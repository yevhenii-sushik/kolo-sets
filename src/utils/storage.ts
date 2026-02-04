import { Collection, Card, SRSData, KnowledgeLevel } from '../types';

const STORAGE_KEY = 'language_cards_collections';
const THEME_KEY = 'language_cards_theme';

// Получить все коллекции
export const getCollections = (): Collection[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const collections = JSON.parse(data);
    // Преобразуем строки дат обратно в объекты Date
    return collections.map((col: any) => ({
      ...col,
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

// Сохранить все коллекции
export const saveCollections = (collections: Collection[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections));
  } catch (error) {
    console.error('Ошибка при сохранении коллекций:', error);
  }
};

// Получить коллекцию по ID
export const getCollection = (id: string): Collection | undefined => {
  const collections = getCollections();
  return collections.find(col => col.id === id);
};

// Создать новую коллекцию
export const createCollection = (name: string): Collection => {
  const newCollection: Collection = {
    id: crypto.randomUUID(),
    name,
    cards: [],
    createdAt: new Date()
  };
  
  const collections = getCollections();
  collections.push(newCollection);
  saveCollections(collections);
  
  return newCollection;
};

// Обновить коллекцию
export const updateCollection = (updatedCollection: Collection): void => {
  const collections = getCollections();
  const index = collections.findIndex(col => col.id === updatedCollection.id);
  
  if (index !== -1) {
    collections[index] = updatedCollection;
    saveCollections(collections);
  }
};

// Удалить коллекцию
export const deleteCollection = (id: string): void => {
  const collections = getCollections();
  const filtered = collections.filter(col => col.id !== id);
  saveCollections(filtered);
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

// Тема (dark/light mode)
export const getTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  // По умолчанию используем системную тему
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const setTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(THEME_KEY, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
