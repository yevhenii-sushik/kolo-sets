import { Collection, Card } from '../types';
import { auth } from '../firebase/config';
import {
  getUserCollections,
  getUserCollection,
  saveUserCollection,
  updateUserCollectionFields,
  deleteUserCollection as deleteFirestoreCollection
} from '../firebase/firestore';

// SRS-логика живёт в чистом модуле srs.ts (с тестами); реэкспорт — для существующих импортов
export { isNewCard, isDueCard, updateSRSData } from './srs';
import { initialSRS } from './srs';

const THEME_KEY = 'language_cards_theme';

// Наборы живут только в Firestore: приложение открывается лишь после входа, а попробовать без аккаунта — это
// анонимный вход Firebase (шаг 16 в docs/specs/06-audit-fixes.md). Прежний гостевой режим на localStorage
// удалён: до него нельзя было добраться. Без входа записывать некуда — запись отклоняется, и экран это покажет
const signedIn = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  return user;
};

// Все наборы человека. Ошибка сервера — пустой список, как и раньше (тренировка и экспорт скажут, что наборов нет)
export const getCollections = async (): Promise<Collection[]> => {
  const user = auth.currentUser;
  if (!user) return [];
  try {
    return await getUserCollections(user.uid);
  } catch (error) {
    console.error('Ошибка получения из Firestore:', error);
    return [];
  }
};

// Получить коллекцию по ID
export const getCollection = async (id: string): Promise<Collection | undefined> => {
  const user = auth.currentUser;
  if (!user) return undefined;
  const result = await getUserCollection(user.uid, id);
  return result ?? undefined;
};

// Новый пустой набор — только объект, без записи: экран показывает его сразу, а запись идёт в фоне
// (saveCollection в DataContext, docs/specs/06-audit-fixes.md, шаг 4). Раньше создание ждало ответа
// сервера, и без сети окно «Новый набор» не закрывалось.
// courseId — курс, в котором создаётся набор; language — голос озвучки курса; folderId — открытая папка
export const buildCollection = (name: string, language: string, courseId?: string, folderId?: string): Collection => ({
  id: crypto.randomUUID(),
  name,
  language,
  ...(courseId ? { courseId } : {}),
  ...(folderId ? { folderId } : {}),
  cards: [],
  createdAt: new Date(),
});

// Сохранить готовый набор целиком (с карточками) — набор Kolo, собранный в presets/build.ts
export const addCollection = async (newCollection: Collection): Promise<void> => {
  await saveUserCollection(signedIn().uid, newCollection);
};

// Сохранить коллекцию целиком: новую или изменённую (setDoc в Firestore тоже создаёт или заменяет)
export const updateCollection = async (updatedCollection: Collection): Promise<void> => {
  await saveUserCollection(signedIn().uid, updatedCollection);
};

// Точечно обновить метаданные коллекции (isFavorite, folderId, ...): updateDoc только изменённых полей
// (не гоняем все карточки); undefined = удалить поле
export const updateCollectionMeta = async (
  coll: Collection,
  fields: Partial<Pick<Collection, 'isFavorite' | 'folderId' | 'order' | 'name' | 'language' | 'courseId' | 'lastStudied'>>
): Promise<void> => {
  await updateUserCollectionFields(signedIn().uid, coll.id, fields);
};

// Удалить коллекцию
export const deleteCollection = async (id: string): Promise<void> => {
  await deleteFirestoreCollection(signedIn().uid, id);
};

// Создать новую карточку с начальными данными SRS
export const createCard = (
  word: string,
  translation: string,
  explanation: string,
  example: string,
  partOfSpeech: string
): Card => {
  return {
    id: crypto.randomUUID(),
    word,
    translation,
    explanation,
    example,
    partOfSpeech,
    srsData: initialSRS(new Date()),
    createdAt: new Date()
  };
};

// ── Порядок коллекций (localStorage, без Firestore-записей на каждый drag) ──

export const getCollectionOrder = (userId: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(`kolo_col_order_${userId}`) ?? '[]');
  } catch {
    return [];
  }
};

export const saveCollectionOrder = (userId: string, ids: string[]): void => {
  localStorage.setItem(`kolo_col_order_${userId}`, JSON.stringify(ids));
};

export const applyCollectionOrder = (collections: import('../types').Collection[], userId: string): import('../types').Collection[] => {
  const order = getCollectionOrder(userId);
  if (order.length === 0) return collections;
  const map = new Map(collections.map(c => [c.id, c]));
  const sorted: import('../types').Collection[] = [];
  for (const id of order) {
    const c = map.get(id);
    if (c) { sorted.push(c); map.delete(id); }
  }
  // Новые коллекции (которых нет в сохранённом порядке) — в конец
  map.forEach(c => sorted.push(c));
  return sorted;
};

// ── Ежедневная цель (карточек в день) ──
const DAILY_GOAL_KEY = 'kolo_daily_goal';

export const getDailyGoal = (): number => {
  const saved = localStorage.getItem(DAILY_GOAL_KEY);
  const n = saved ? parseInt(saved, 10) : 10;
  return isNaN(n) ? 10 : Math.max(1, Math.min(200, n));
};

export const setDailyGoal = (goal: number): void => {
  localStorage.setItem(DAILY_GOAL_KEY, String(Math.max(1, Math.min(200, goal))));
};

// Тема (dark/light/system mode)
export const getThemePref = (): 'light' | 'dark' | 'system' => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return 'system';
};

// Оставляем для обратной совместимости
export const getTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// Цвет адресной строки и строки состояния — под фон текущей темы (токен --color-bg)
const syncThemeColor = (): void => {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
};

export const setTheme = (theme: 'light' | 'dark' | 'system'): void => {
  if (theme === 'system') {
    localStorage.removeItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } else {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  syncThemeColor();
};
