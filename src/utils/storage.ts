import { Collection, Card, SRSData, KnowledgeLevel } from '../types';
import { auth } from '../firebase/config';
import {
  getUserCollections,
  getUserCollection,
  saveUserCollection,
  deleteUserCollection as deleteFirestoreCollection
} from '../firebase/firestore';

const STORAGE_KEY = 'language_cards_collections';
const THEME_KEY = 'language_cards_theme';

// Получить все коллекции (из Firestore если залогинен, иначе из localStorage)
export const getCollections = async (): Promise<Collection[]> => {
  const user = auth.currentUser;
  
  if (user) {
    // Получаем из Firestore
    try {
      return await getUserCollections(user.uid);
    } catch (error) {
      console.error('Ошибка получения из Firestore:', error);
      return getLocalCollections();
    }
  }
  
  return getLocalCollections();
};

// Получить коллекции из localStorage
export const getLocalCollections = (): Collection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const collections = JSON.parse(data);
    // Преобразуем строки дат обратно в объекты Date
    return collections.map((col: any) => ({
      ...col,
      language: col.language || 'nb-NO', // Добавляем язык по умолчанию для старых коллекций
      createdAt: new Date(col.createdAt),
      lastStudied: col.lastStudied ? new Date(col.lastStudied) : undefined,
      cards: col.cards.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        srsData: {
          ...card.srsData,
          nextReview: new Date(card.srsData.nextReview),
          lastReviewed: card.srsData.lastReviewed ? new Date(card.srsData.lastReviewed) : undefined
        }
      }))
    }));
  } catch (error) {
    console.error('Ошибка при загрузке коллекций:', error);
    return [];
  }
};

// Сохранить все коллекции в localStorage
const saveLocalCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error('Ошибка при сохранении коллекций:', error);
  }
};

// Получить коллекцию по ID
export const getCollection = async (id: string): Promise<Collection | undefined> => {
  const user = auth.currentUser;
  if (user) {
    const result = await getUserCollection(user.uid, id);
    return result ?? undefined;
  }
  return getLocalCollections().find(col => col.id === id);
};

// Создать новую коллекцию
export const createCollection = async (name: string, language: string = 'nb-NO'): Promise<Collection> => {
  const newCollection: Collection = {
    id: crypto.randomUUID(),
    name,
    language,
    cards: [],
    createdAt: new Date()
  };
  
  const user = auth.currentUser;
  
  if (user) {
    // Сохраняем в Firestore
    await saveUserCollection(user.uid, newCollection);
  } else {
    // Сохраняем локально
    const collections = getLocalCollections();
    collections.push(newCollection);
    saveLocalCollections(collections);
  }
  
  return newCollection;
};

// Обновить коллекцию
export const updateCollection = async (updatedCollection: Collection): Promise<void> => {
  const user = auth.currentUser;
  
  if (user) {
    // Обновляем в Firestore
    await saveUserCollection(user.uid, updatedCollection);
  } else {
    // Обновляем локально
    const collections = getLocalCollections();
    const index = collections.findIndex(col => col.id === updatedCollection.id);
    
    if (index !== -1) {
      collections[index] = updatedCollection;
      saveLocalCollections(collections);
    }
  }
};

// Удалить коллекцию
export const deleteCollection = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  
  if (user) {
    // Удаляем из Firestore
    await deleteFirestoreCollection(user.uid, id);
  } else {
    // Удаляем локально
    const collections = getLocalCollections();
    const filtered = collections.filter(col => col.id !== id);
    saveLocalCollections(filtered);
  }
};

// Создать новую карточку с начальными данными SRS
export const createCard = (
  word: string,
  translation: string,
  explanation: string,
  example: string,
  partOfSpeech: string
): Card => {
  const initialSRS: SRSData = {
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: new Date()
  };
  
  return {
    id: crypto.randomUUID(),
    word,
    translation,
    explanation,
    example,
    partOfSpeech,
    srsData: initialSRS,
    createdAt: new Date()
  };
};

// Обновить SRS данные карточки на основе оценки
export const updateSRSData = (card: Card, level: KnowledgeLevel): Card => {
  const srs = { ...card.srsData };
  const now = new Date();
  
  // Алгоритм SM-2 (упрощенная версия)
  let quality = 0;
  switch (level) {
    case KnowledgeLevel.DONT_KNOW:
      quality = 0;
      break;
    case KnowledgeLevel.FORGOT:
      quality = 2;
      break;
    case KnowledgeLevel.REMEMBER:
      quality = 3;
      break;
    case KnowledgeLevel.KNOW:
      quality = 5;
      break;
  }
  
  if (quality >= 3) {
    // Правильный ответ
    if (srs.repetitions === 0) {
      srs.interval = 1;
    } else if (srs.repetitions === 1) {
      srs.interval = 6;
    } else {
      srs.interval = Math.round(srs.interval * srs.easinessFactor);
    }
    srs.repetitions += 1;
  } else {
    // Неправильный ответ - сбрасываем прогресс
    srs.repetitions = 0;
    srs.interval = 1;
  }
  
  // Обновляем коэффициент легкости
  srs.easinessFactor = Math.max(
    1.3,
    srs.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // Устанавливаем дату следующего повторения
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + srs.interval);
  srs.nextReview = nextReview;
  srs.lastReviewed = now;
  
  return {
    ...card,
    srsData: srs
  };
};

// Парсинг импорта слов
export const parseImportText = (text: string): Omit<Card, 'id' | 'srsData' | 'createdAt'>[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const cards: Omit<Card, 'id' | 'srsData' | 'createdAt'>[] = [];
  
  for (const line of lines) {
    const parts = line.split(';').map(part => part.trim());
    
    if (parts.length >= 2) {
      cards.push({
        word: parts[0] || '',
        translation: parts[1] || '',
        explanation: parts[2] || '',
        example: parts[3] || '',
        partOfSpeech: parts[4] || ''
      });
    }
  }
  
  return cards;
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
};
