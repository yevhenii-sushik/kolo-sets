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
  getUserCollectionsFromCache,
  updateUserCollectionFields,
  parseCourses,
  parseFolders,
  saveCoursesState,
} from '../firebase/firestore';
import { getCollections, deleteCollection, updateCollection, updateCollectionMeta } from '../utils/storage';
import { saveInBackground } from '../utils/backgroundSave';
import { getDisplayStreak } from '../utils/streak';
import { Achievement, AchievementType, Collection, Course, Folder } from '../types';
import { COURSES_VERSION, planCourses } from '../courses/plan';
import { courseCodeFromLanguage, defaultVoice } from '../courses/languages';
import { ALL_ACHIEVEMENTS } from '../utils/achievements';
import {
  flushPendingSessions,
  recheckAchievements,
  setOrbitGoal,
  submitSession,
  syncProgress,
  type Loot,
  type Progression,
  type SessionPayload,
  type SessionReply,
} from '../api/progress';
import { announceFirstSession, announceMedals, announceProgress } from '../components/progress/ProgressMoments';
import { localDateKey } from '../utils/progress';
import { readCache, writeCache, profileCacheKey, progressionCacheKey } from '../utils/profileCache';

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
  /** Профиль и наборы пришли с сервера, курсы известны — можно решать, нужен ли выбор языка,
   *  и записывать миграцию курсов */
  coursesReady: boolean;
  /** Есть что показать: наборы (из кэша устройства или с сервера) и профиль (из копии или с сервера).
   *  По нему страницы решают, нужен ли скелетон (src/design/README.md → «Загрузка») */
  contentReady: boolean;
  /** Папки активного курса */
  folders: Folder[];
  setActiveCourse: (id: string) => Promise<void>;
  /** Добавить курс (или переключиться, если он уже есть) и сделать его активным */
  addCourse: (code: string, voice?: string) => Promise<void>;
  updateCourseVoice: (id: string, voice: string) => Promise<void>;
  /** Удаляет курс вместе с его наборами и папками */
  removeCourse: (id: string) => Promise<void>;
  moveCollectionToCourse: (collectionId: string, courseId: string) => Promise<void>;
  /** Набор изменён (новые слова, правка, переименование) или создан: сразу на экране, запись — в фоне,
   *  без ожидания сети. Промис не отклоняется: true — сервер принял (можно, например, проверить медали) */
  saveCollection: (collection: Collection) => Promise<boolean>;
  /** Создаёт папку в активном курсе; возвращает её id — чтобы сразу положить туда набор. Сеть не ждёт */
  createFolder: (name: string, color: string) => Promise<string | undefined>;
  updateFolder: (folderId: string, fields: Pick<Folder, 'name' | 'color'>) => Promise<void>;
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
  /** Тренировка завершена: прогресс начисляет сервер, празднование серии и баннеры — по его ответу */
  reportSession: (payload: SessionPayload) => Promise<void>;
  /** Достижения за наборы и слова — после создания набора, импорта или добавления слов */
  checkAchievements: () => Promise<void>;
  /** Опыт и орбита недели (docs/specs/02-progression.md); null — сервер ещё не ответил ни разу */
  progression: Progression | null;
  /** Цель недели 3–7: первый выбор — сразу, дальше — с понедельника. Ошибку сети пробрасывает */
  setWeeklyGoal: (goal: number) => Promise<void>;
  /** Капсулы, пыль, инвентарь, медали и надетое — из профиля (пишет только сервер) */
  loot: Loot;
  /** Ответ сервера после действия с наградами */
  applyLoot: (loot: Loot) => void;
  /** Ответ сервера с опытом и орбитой (покупка щита и т. п.) */
  applyProgression: (p: Progression | null | undefined, celebrate: boolean) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData(): DataContextType {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

const readProfileCache = (uid: string) => readCache(profileCacheKey(uid));
const writeProfileCache = (uid: string, profile: any) => writeCache(profileCacheKey(uid), profile);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfileState] = useState<any | null>(() =>
    user?.uid ? readProfileCache(user.uid) : null
  );
  const [collectionsState, setCollectionsState] = useState<Collection[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [pendingUnlocks, setPendingUnlocks] = useState<Achievement[]>([]);
  const [progression, setProgressionState] = useState<Progression | null>(() =>
    user?.uid ? readCache(progressionCacheKey(user.uid)) : null
  );
  // Профиль загружен с сервера (не из кэша) — только тогда можно мигрировать курсы
  const [profileFresh, setProfileFresh] = useState(false);
  // То же для наборов: на экране может быть копия из кэша Firestore, а решать по ней нельзя
  const [collectionsFresh, setCollectionsFresh] = useState(false);
  const collectionsFreshRef = useRef(false);
  // Чей ответ ждём: пришедший позже ответ для прежнего аккаунта не должен попасть в новый
  const uidRef = useRef<string | null>(null);

  // Ref для sync-доступа к collections внутри колбэков без stale closure
  const collectionsRef = useRef<Collection[]>([]);

  // Поддерживаем функциональные апдейтеры: оптимистичные обновления/откаты
  // должны применяться к актуальному состоянию, а не к снапшоту из замыкания
  const setCollections = useCallback((c: Collection[] | ((prev: Collection[]) => Collection[])) => {
    const next = typeof c === 'function' ? c(collectionsRef.current) : c;
    collectionsRef.current = next;
    setCollectionsState(next);
  }, []);

  // Запись набора в фоне (docs/specs/06-audit-fixes.md, шаг 4). Пишем версию из памяти на момент записи, а не
  // переданную: повтор после отказа не должен затереть то, что добавили позже. Набора в памяти уже нет
  // (удалили, пока висел повтор) — не воскрешаем его
  const saveCollection = useCallback(
    (collection: Collection) => {
      setCollections(prev =>
        prev.some(c => c.id === collection.id)
          ? prev.map(c => (c.id === collection.id ? collection : c))
          : [collection, ...prev],
      );
      return saveInBackground(
        () => {
          const latest = collectionsRef.current.find(c => c.id === collection.id);
          return latest ? updateCollection(latest) : Promise.resolve();
        },
        { key: `set:${collection.id}` },
      );
    },
    [setCollections],
  );

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
    const uid = user.uid;
    // Наборы уже на экране (из кэша или прошлой загрузки) — обновляем молча, без скелетона
    if (collectionsRef.current.length === 0) setCollectionsLoading(true);
    try {
      const loaded = await getCollections();
      if (uidRef.current !== uid) return;
      collectionsFreshRef.current = true;
      setCollections(loaded);
      setCollectionsFresh(true);
    } finally {
      if (uidRef.current === uid) setCollectionsLoading(false);
    }
  }, [user, setCollections]);

  const dismissUnlock = useCallback((id: AchievementType) => {
    setPendingUnlocks(prev => prev.filter(a => a.id !== id));
  }, []);

  const showUnlocks = useCallback((ids: AchievementType[]) => {
    const unlocked = ids.map(id => ALL_ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean) as Achievement[];
    if (unlocked.length > 0) setPendingUnlocks(prev => [...prev, ...unlocked]);
  }, []);

  // Празднуем то, что сообщил сервер: орбита замкнута, уровень, починка, щит
  const applyProgression = useCallback((p: Progression | null | undefined, celebrate: boolean) => {
    if (!p || !user) return;
    setProgressionState(p);
    writeCache(progressionCacheKey(user.uid), p);
    if (p.capsules) patchProfile({ capsules: p.capsules.count });
    if (celebrate) announceProgress(p);
  }, [user, patchProfile]);

  const applyLoot = useCallback((l: Loot) => patchProfile({ ...l }), [patchProfile]);

  const loot = useMemo<Loot>(() => ({
    // Кэш опыта с этапа 2a капсул не знает — на него не опираемся
    capsules: typeof profile?.capsules === 'number' ? profile.capsules : (progression?.capsules?.count ?? 0),
    pity: profile?.pity ?? 0,
    dust: profile?.dust ?? 0,
    inventory: profile?.inventory ?? {},
    medals: profile?.medals ?? [],
    equipped: { showcase: [], ...(profile?.equipped ?? {}) },
  }), [profile, progression]);

  const applyReply = useCallback((reply: SessionReply, celebrate: boolean) => {
    showUnlocks(reply.newAchievements);
    if (reply.loot) patchProfile({ ...reply.loot });
    // Повтор возвращает старый ответ — его орбита уже устарела
    if (reply.duplicate) return;
    // Первая тренировка: капсула, бета-медаль и уровень — одним окном «Первые награды»
    const first = celebrate && reply.firstSession && reply.progression;
    applyProgression(reply.progression, celebrate && !first);
    if (first) announceFirstSession(reply.progression!, reply.granted ?? []);
    else if (celebrate) announceMedals(reply.granted ?? []);
  }, [showUnlocks, applyProgression, patchProfile]);

  const setWeeklyGoal = useCallback(async (goal: number) => {
    applyProgression(await setOrbitGoal(goal), true);
  }, [applyProgression]);

  const reportSession = useCallback(async (payload: SessionPayload) => {
    const reply = await submitSession(payload);
    if (reply) applyReply(reply, true);
    await refreshProfile(); // серия в шапке и цифры профиля — уже с сервера
  }, [applyReply, refreshProfile]);

  const checkAchievements = useCallback(async () => {
    const { newAchievements, progression: p } = await recheckAchievements();
    if (newAchievements.length > 0) {
      showUnlocks(newAchievements);
      applyProgression(p, true);
      await refreshProfile();
    }
  }, [showUnlocks, applyProgression, refreshProfile]);

  useEffect(() => {
    uidRef.current = user?.uid ?? null;
    collectionsFreshRef.current = false;
    setCollectionsFresh(false);
    if (!user?.uid) {
      setProfileState(null);
      setProgressionState(null);
      setCollections([]);
      setPendingUnlocks([]);
      setProfileLoading(false);
      setCollectionsLoading(false);
      return;
    }

    const cached = readProfileCache(user.uid);
    setProfileState(cached);
    setProgressionState(readCache(progressionCacheKey(user.uid)));
    setCollections([]);
    setProfileFresh(false);
    setProfileLoading(!cached);
    setCollectionsLoading(true);

    // Наборы из кэша Firestore на устройстве — сразу на экран, сервер ответит следом и заменит их.
    // Пустой кэш не показываем: «наборов нет» могло бы оказаться неправдой — тогда ждём сервер
    const uid = user.uid;
    getUserCollectionsFromCache(uid)
      .then((cachedCollections) => {
        if (uidRef.current !== uid || collectionsFreshRef.current || cachedCollections.length === 0) return;
        setCollections(cachedCollections);
        setCollectionsLoading(false);
      })
      .catch(() => {});

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
  // Решения (выбор языка, миграция) — только по ответу сервера, показ — уже по копиям
  const coursesReady = profileFresh && collectionsFresh;
  // Не загрузился профиль (нет сети и копии) — не держим скелетон вечно, показываем что есть
  const contentReady = !collectionsLoading && (!!profile || !profileLoading);

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

  // При запуске: тренировки, не дошедшие до сервера (не было сети), — без празднования, оно было бы
  // про вчерашнюю тренировку; затем итоги прошедших недель (щит сработал, серию можно починить)
  const flushedRef = useRef<string | null>(null);
  const syncedDayRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !coursesReady || flushedRef.current === user.uid) return;
    flushedRef.current = user.uid;
    syncedDayRef.current = localDateKey(new Date());
    (async () => {
      const replies = await flushPendingSessions();
      replies.forEach(r => applyReply(r, false));
      const synced = await syncProgress();
      applyProgression(synced?.progression, true);
      if (synced?.loot) applyLoot(synced.loot);
      announceMedals(synced?.granted ?? []);
      if (replies.length > 0) refreshProfile();
    })();
  }, [user, coursesReady, applyReply, applyProgression, refreshProfile]);

  // Приложение осталось открытым до следующего дня (или недели) — подводим итоги заново
  useEffect(() => {
    if (!user || !coursesReady) return;
    const onVisible = () => {
      const today = localDateKey(new Date());
      if (document.visibilityState !== 'visible' || syncedDayRef.current === today) return;
      syncedDayRef.current = today;
      syncProgress().then(r => {
        applyProgression(r?.progression, true);
        if (r?.loot) applyLoot(r.loot);
        announceMedals(r?.granted ?? []);
      });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, coursesReady, applyProgression]);

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

  // Папки — список в профиле. Пишем его целиком и в фоне: на экране папка сразу, без сети запись дождётся
  // её сама (шаг 4 плана). Основа для правки и повтор — последний список из памяти, а не из замыкания
  // рендера: две правки подряд не затрут друг друга, а повтор — то, что сохранилось после отказа
  const foldersRef = useRef<Folder[]>([]);
  useEffect(() => {
    foldersRef.current = plan.folders;
  }, [plan.folders]);

  const saveFolders = useCallback(
    (next: Folder[]) => {
      if (!user) return;
      const uid = user.uid;
      foldersRef.current = next;
      patchProfile({ folders: next, coursesVersion: COURSES_VERSION });
      void saveInBackground(
        () => saveCoursesState(uid, { folders: foldersRef.current, coursesVersion: COURSES_VERSION }),
        { key: 'folders' },
      );
    },
    [user, patchProfile],
  );

  const createFolder = useCallback(
    async (name: string, color: string) => {
      if (!activeId) return;
      const folder: Folder = { id: crypto.randomUUID(), name, color, createdAt: new Date(), courseId: activeId };
      saveFolders([...foldersRef.current, folder]);
      return folder.id;
    },
    [activeId, saveFolders],
  );

  const updateFolder = useCallback(
    async (folderId: string, fields: Pick<Folder, 'name' | 'color'>) => {
      saveFolders(foldersRef.current.map(f => (f.id === folderId ? { ...f, ...fields } : f)));
    },
    [saveFolders],
  );

  const deleteFolder = useCallback(
    async (folderId: string) => {
      const affected = collectionsRef.current.filter(c => c.folderId === folderId);
      setCollections(prev => prev.map(c => (c.folderId === folderId ? { ...c, folderId: undefined } : c)));
      saveFolders(foldersRef.current.filter(f => f.id !== folderId));
      for (const c of affected) {
        void saveInBackground(() => updateCollectionMeta(c, { folderId: undefined }), { key: `folder:${c.id}` });
      }
    },
    [setCollections, saveFolders],
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
        contentReady,
        folders,
        setActiveCourse,
        addCourse,
        updateCourseVoice,
        removeCourse,
        moveCollectionToCourse,
        saveCollection,
        createFolder,
        updateFolder,
        deleteFolder,
        voiceForCollection,
        profileLoading,
        collectionsLoading,
        refreshProfile,
        refreshCollections,
        setCollections,
        pendingUnlocks,
        dismissUnlock,
        reportSession,
        checkAchievements,
        progression,
        setWeeklyGoal,
        loot,
        applyLoot,
        applyProgression,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
