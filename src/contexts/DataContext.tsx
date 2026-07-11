import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getUserProfile, updateUserProfile } from '../firebase/firestore';
import { getCollections } from '../utils/storage';
import { getDisplayStreak } from '../utils/streak';
import { Achievement, AchievementType, Collection, SessionExtras } from '../types';
import {
  ALL_ACHIEVEMENTS,
  checkAndUnlockAchievements as computeNewAchievements,
} from '../utils/achievements';

interface DataContextType {
  profile: any | null;
  collections: Collection[];
  totalCards: number;
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
    } finally {
      setProfileLoading(false);
    }
  }, [user, setProfile]);

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
    setProfileLoading(!cached);
    setCollectionsLoading(true);

    Promise.all([refreshProfile(), refreshCollections()]);
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCards = collectionsState.reduce((sum, c) => sum + c.cards.length, 0);

  return (
    <DataContext.Provider
      value={{
        profile,
        collections: collectionsState,
        totalCards,
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
