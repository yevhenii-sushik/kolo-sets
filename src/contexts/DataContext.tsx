import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  updateUserCollectionFields,
  parseCourses,
  parseFolders,
  saveCoursesState,
} from '../firebase/firestore';
import { getCollections, deleteCollection, updateCollectionMeta } from '../utils/storage';
import { getDisplayStreak } from '../utils/streak';
import { Achievement, AchievementType, Collection, Course, Folder, SessionExtras } from '../types';
import { COURSES_VERSION, planCourses } from '../courses/plan';
import { courseCodeFromLanguage, defaultVoice } from '../courses/languages';
import {
  ALL_ACHIEVEMENTS,
  checkAndUnlockAchievements as computeNewAchievements,
} from '../utils/achievements';

interface DataContextType {
  profile: any | null;
  /** Наборы активного курса */
  collections: Collection[];
  /** Слов в активном курсе */
  totalCards: number;
  /** Наборы всех курсов — для профиля, достижений, напоминаний и резервной копии */
  allCollections: Collection[];
  allTotalCards: number;
  /** Курсы пользователя (docs/specs/01-courses.md) */
  courses: Course[];
  activeCourse: Course | null;
  /** Профиль и наборы загружены, курсы известны — можно решать, нужен ли выбор языка */
  coursesReady: boolean;
  /** Папки активного курса */
  folders: Folder[];
  setActiveCourse: (id: string) => Promise<void>;
  /** Добавить курс (или переключиться, если он уже есть) и сделать его активным */
  addCourse: (code: string, voice?: string) => Promise<void>;
  updateCourseVoice: (id: string, voice: string) => Promise<void>;
  /** Удаляет курс вместе с его наборами и папками */
  removeCourse: (id: string) => Promise<void>;
  moveCollectionToCourse: (collectionId: string, courseId: string) => Promise<void>;
  createFolder: (name: string, color: string) => Promise<void>;
  /** Удаляет папку; её наборы остаются в курсе без папки */
  deleteFolder: (folderId: string) => Promise<void>;
  /** Голос озвучки для набора — из его курса */
  voiceForCollection: (collection: Collection) => string;
  profileLoading: boolean;
  collectionsLoading: boolean;
  refreshProfile: () => Promise<void>;
  refreshCollections: () => Promise<void>;
  /** Optimistic update — вызывать после мутации коллекций */
  setCollections: (c: Collection[] | ((prev: Collection[]) => Collection[])) => void;
  /** Очередь разблокированных достижений для показа баннера */
  pendingUnlocks: Achievement[];
  /** Убрать первое достижение из очереди */
  dismissUnlock: (id: AchievementType) => void;
  /** Проверить достижения после сессии или события */
  checkAchievements: (extras?: SessionExtras) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

function readProfileCache(uid: string): any | null {
  try {
    return JSON.parse(localStorage.getItem(`profile_cache_${uid}`) ?? 'null');
  } catch {
    return null;
  }
}

function writeProfileCache(uid: string, profile: any) {
  try {
    localStorage.setItem(`profile_cache_${uid}`, JSON.stringify(profile));
  } catch {}
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfileState] = useState<any | null>(() =>
    user?.uid ? readProfileCache(user.uid) : null
  );
  const [collectionsState, setCollectionsState] = useState<Collection[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pendingUnlocks, setPendingUnlocks] = useState<Achievement[]>([]);
  // Профиль загружен с сервера (не из кэша) — только тогда можно мигрировать курсы
  const [profileFresh, setProfileFresh] = useState(false);

  // Ref для sync-доступа к collections внутри колбэков без stale closure
  const collectionsRef = useRef<Collection[]>([]);

  // Поддерживаем функциональные апдейтеры: оптимистичные обновления/откаты
  // должны применяться к актуальному состоянию, а не к снапшоту из замыкания
  const setCollections = useCallback((c: Collection[] | ((prev: Collection[]) => Collection[])) => {
    const next = typeof c === 'function' ? c(collectionsRef.current) : c;
    collectionsRef.current = next;
    setCollectionsState(next);
  }, []);

  const setProfile = useCallback((p: any, uid: string) => {
    if (!p) return;
    const normalized = {
      ...p,
      currentStreak: getDisplayStreak(p.currentStreak ?? 0, p.lastStudyDate),
    };
    setProfileState(normalized);
    writeProfileCache(uid, normalized);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const p = await getUserProfile(user.uid);
      setProfile(p, user.uid);
      setProfileFresh(true);
    } finally {
      setProfileLoading(false);
    }
  }, [user, setProfile]);

  // Точечно меняет поля профиля в памяти и кэше (после записи курсов и папок)
  const patchProfile = useCallback((fields: Record<string, unknown>) => {
    if (!user) return;
    setProfileState((prev: any) => {
      const next = { ...(prev ?? {}), ...fields };
      writeProfileCache(user.uid, next);
      return next;
    });
  }, [user]);

  const refreshCollections = useCallback(async () => {
    if (!user) return;
    setCollectionsLoading(true);
    try {
      const loaded = await getCollections();
      setCollections(loaded);
    } finally {
      setCollectionsLoading(false);
    }
  }, [user, setCollections]);

  const dismissUnlock = useCallback((id: AchievementType) => {
    setPendingUnlocks(prev => prev.filter(a => a.id !== id));
  }, []);

  const checkAchievements = useCallback(async (extras?: SessionExtras) => {
    if (!user) return;
    try {
      // Всегда читаем свежий профиль из Firestore для точности
      const freshProfile = await getUserProfile(user.uid);
      if (!freshProfile) return;

      const currentCollections = collectionsRef.current;
      const currentTotalCards = currentCollections.reduce((s, c) => s + c.cards.length, 0);

      // Всегда синхронизируем контекст со свежим профилем (обновляет стрик в шапке)
      setProfile(freshProfile, user.uid);

      const newIds = computeNewAchievements(freshProfile, currentTotalCards, {
        collectionsCount: currentCollections.length,
        ...extras,
      });

      if (newIds.length === 0) return;

      const existingIds: AchievementType[] = freshProfile.achievements ?? [];
      await updateUserProfile(user.uid, {
        achievements: [...existingIds, ...newIds],
      });

      const newAchievements = newIds
        .map(id => ALL_ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean) as Achievement[];

      setPendingUnlocks(prev => [...prev, ...newAchievements]);

      setProfile({ ...freshProfile, achievements: [...existingIds, ...newIds] }, user.uid);
    } catch (err) {
      console.error('Achievement check failed:', err);
    }
  }, [user, setProfile]);

  useEffect(() => {
    if (!user?.uid) {
      setProfileState(null);
      setCollections([]);
      setPendingUnlocks([]);
      setProfileLoading(false);
      setCollectionsLoading(false);
      return;
    }

    const cached = readProfileCache(user.uid);
    setProfileState(cached);
    setCollections([]);
    setProfileFresh(false);
    setProfileLoading(!cached);
    setCollectionsLoading(true);

    Promise.all([refreshProfile(), refreshCollections()]);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Курсы ──────────────────────────────────────────────────────────────────
  // Интерфейс всегда показывает результат planCourses; запись в базу идёт отдельно и может
  // не пройти (нет сети) — тогда наборы всё равно видны в своём курсе, а запись повторится
  // при следующей загрузке.

  const coursesInput = useMemo(
    () => ({
      courses: parseCourses(profile?.courses),
      activeCourseId: profile?.activeCourseId ?? null,
      folders: parseFolders(profile?.folders),
      coursesVersion: profile?.coursesVersion,
    }),
    [profile],
  );

  const plan = useMemo(() => planCourses(coursesInput, collectionsState), [coursesInput, collectionsState]);

  const allCollections = useMemo(() => {
    if (plan.collectionUpdates.length === 0) return collectionsState;
    const upd = new Map(plan.collectionUpdates.map(u => [u.id, u]));
    return collectionsState.map(c => {
      const u = upd.get(c.id);
      return u ? { ...c, courseId: u.courseId, folderId: u.clearFolder ? undefined : c.folderId } : c;
    });
  }, [collectionsState, plan]);

  const courses = useMemo(
    () => [...plan.courses].sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime()),
    [plan.courses],
  );
  const activeCourse = courses.find(c => c.id === plan.activeCourseId) ?? null;
  const activeId = activeCourse?.id ?? null;
  const coursesReady = profileFresh && !collectionsLoading;

  const collections = useMemo(
    () => (activeId ? allCollections.filter(c => c.courseId === activeId) : []),
    [allCollections, activeId],
  );
  const folders = useMemo(
    () => plan.folders.filter(f => f.courseId === activeId),
    [plan.folders, activeId],
  );

  // Записываем миграцию и «самолечение» один раз, когда данные загружены с сервера
  const persistingRef = useRef(false);
  useEffect(() => {
    if (!user || !coursesReady || persistingRef.current) return;
    if (!plan.profileChanged && plan.collectionUpdates.length === 0) return;
    persistingRef.current = true;
    const uid = user.uid;
    (async () => {
      try {
        if (plan.collectionUpdates.length > 0) {
          await Promise.all(
            plan.collectionUpdates.map(u =>
              updateUserCollectionFields(uid, u.id, u.clearFolder ? { courseId: u.courseId, folderId: undefined } : { courseId: u.courseId }),
            ),
          );
          const upd = new Map(plan.collectionUpdates.map(u => [u.id, u]));
          setCollections(prev =>
            prev.map(c => {
              const u = upd.get(c.id);
              return u ? { ...c, courseId: u.courseId, folderId: u.clearFolder ? undefined : c.folderId } : c;
            }),
          );
        }
        if (plan.profileChanged) {
          const fields = {
            courses: plan.courses,
            activeCourseId: plan.activeCourseId,
            folders: plan.folders,
            coursesVersion: COURSES_VERSION,
          };
          await saveCoursesState(uid, fields);
          patchProfile(fields);
        }
      } catch (err) {
        console.error('Courses migration failed:', err);
      } finally {
        persistingRef.current = false;
      }
    })();
  }, [user, coursesReady, plan, setCollections, patchProfile]);

  // Курсы и папки всегда пишем полным списком: отфильтрованный по курсу стёр бы остальные
  const saveCourses = useCallback(
    async (fields: { courses?: Course[]; activeCourseId?: string | null; folders?: Folder[] }) => {
      if (!user) return;
      const withVersion = { ...fields, coursesVersion: COURSES_VERSION };
      patchProfile(withVersion);
      await saveCoursesState(user.uid, withVersion);
    },
    [user, patchProfile],
  );

  const setActiveCourse = useCallback(
    (id: string) => saveCourses({ activeCourseId: id }),
    [saveCourses],
  );

  const addCourse = useCallback(
    async (code: string, voice?: string) => {
      if (plan.courses.some(c => c.id === code)) return saveCourses({ activeCourseId: code });
      const next = [...plan.courses, { id: code, voice: voice ?? defaultVoice(code), addedAt: new Date() }];
      return saveCourses({ courses: next, activeCourseId: code });
    },
    [plan.courses, saveCourses],
  );

  const updateCourseVoice = useCallback(
    (id: string, voice: string) => saveCourses({ courses: plan.courses.map(c => (c.id === id ? { ...c, voice } : c)) }),
    [plan.courses, saveCourses],
  );

  const removeCourse = useCallback(
    async (id: string) => {
      const doomed = allCollections.filter(c => c.courseId === id);
      await Promise.all(doomed.map(c => deleteCollection(c.id)));
      const doomedIds = new Set(doomed.map(c => c.id));
      setCollections(prev => prev.filter(c => !doomedIds.has(c.id)));
      const nextCourses = plan.courses.filter(c => c.id !== id);
      await saveCourses({
        courses: nextCourses,
        folders: plan.folders.filter(f => f.courseId !== id),
        activeCourseId: plan.activeCourseId === id ? (nextCourses[0]?.id ?? null) : plan.activeCourseId,
      });
    },
    [allCollections, plan, setCollections, saveCourses],
  );

  const moveCollectionToCourse = useCallback(
    async (collectionId: string, courseId: string) => {
      const col = allCollections.find(c => c.id === collectionId);
      const course = plan.courses.find(c => c.id === courseId);
      if (!col || !course) return;
      // Папка принадлежит старому курсу — в новом набор лежит в корне; язык — для озвучки старых версий
      const fields = { courseId, folderId: undefined, language: course.voice };
      setCollections(prev => prev.map(c => (c.id === collectionId ? { ...c, ...fields } : c)));
      try {
        await updateCollectionMeta(col, fields);
      } catch (err) {
        setCollections(prev => prev.map(c => (c.id === collectionId ? col : c)));
        throw err;
      }
    },
    [allCollections, plan.courses, setCollections],
  );

  const createFolder = useCallback(
    async (name: string, color: string) => {
      if (!activeId) return;
      const folder: Folder = { id: crypto.randomUUID(), name, color, createdAt: new Date(), courseId: activeId };
      await saveCourses({ folders: [...plan.folders, folder] });
    },
    [activeId, plan.folders, saveCourses],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      const affected = allCollections.filter(c => c.folderId === folderId);
      setCollections(prev => prev.map(c => (c.folderId === folderId ? { ...c, folderId: undefined } : c)));
      await Promise.all([
        saveCourses({ folders: plan.folders.filter(f => f.id !== folderId) }),
        ...affected.map(c => updateCollectionMeta(c, { folderId: undefined })),
      ]);
    },
    [allCollections, plan.folders, setCollections, saveCourses],
  );

  const voiceForCollection = useCallback(
    (c: Collection) =>
      plan.courses.find(x => x.id === (c.courseId ?? courseCodeFromLanguage(c.language)))?.voice ?? c.language,
    [plan.courses],
  );

  const totalCards = collections.reduce((sum, c) => sum + c.cards.length, 0);
  const allTotalCards = allCollections.reduce((sum, c) => sum + c.cards.length, 0);

  return (
    <DataContext.Provider
      value={{
        profile,
        collections,
        totalCards,
        allCollections,
        allTotalCards,
        courses,
        activeCourse,
        coursesReady,
        folders,
        setActiveCourse,
        addCourse,
        updateCourseVoice,
        removeCourse,
        moveCollectionToCourse,
        createFolder,
        deleteFolder,
        voiceForCollection,
        profileLoading,
        collectionsLoading,
        refreshProfile,
        refreshCollections,
        setCollections,
        pendingUnlocks,
        dismissUnlock,
        checkAchievements,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
