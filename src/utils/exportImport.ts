import { Collection } from '../types';

// Экспорт коллекций в JSON
export const exportCollectionsToJSON = (collections: Collection[]): string => {
  return JSON.stringify(collections, null, 2);
};

// Экспорт одной коллекции в JSON
export const exportCollectionToJSON = (collection: Collection): string => {
  return JSON.stringify(collection, null, 2);
};

// Импорт коллекций из JSON
export const importCollectionsFromJSON = (jsonString: string): Collection[] => {
  try {
    const parsed = JSON.parse(jsonString);
    
    // Проверяем, что это массив
    if (!Array.isArray(parsed)) {
      // Возможно это одна коллекция
      if (isValidCollection(parsed)) {
        return [parseCollection(parsed)];
      }
      throw new Error('Неверный формат: ожидается массив коллекций или одна коллекция');
    }
    
    // Парсим каждую коллекцию
    const collections = parsed.map(parseCollection);
    
    return collections;
  } catch (error) {
    console.error('Ошибка импорта:', error);
    throw new Error('Не удалось импортировать коллекции. Проверьте формат файла.');
  }
};

// Проверка валидности коллекции
const isValidCollection = (obj: any): boolean => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.name === 'string' &&
    Array.isArray(obj.cards)
  );
};

// Парсинг коллекции из объекта
const parseCollection = (obj: any): Collection => {
  if (!isValidCollection(obj)) {
    throw new Error('Неверная структура коллекции');
  }
  
  return {
    id: obj.id || crypto.randomUUID(),
    name: obj.name,
    cards: obj.cards.map((card: any) => ({
      id: card.id || crypto.randomUUID(),
      word: card.word || '',
      translation: card.translation || '',
      explanation: card.explanation || '',
      example: card.example || '',
      partOfSpeech: card.partOfSpeech || '',
      createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
      srsData: {
        easinessFactor: card.srsData?.easinessFactor || 2.5,
        interval: card.srsData?.interval || 0,
        repetitions: card.srsData?.repetitions || 0,
        nextReview: card.srsData?.nextReview
          ? new Date(card.srsData.nextReview)
          : new Date(),
        lastReviewed: card.srsData?.lastReviewed
          ? new Date(card.srsData.lastReviewed)
          : undefined
      }
    })),
    createdAt: obj.createdAt ? new Date(obj.createdAt) : new Date(),
    lastStudied: obj.lastStudied ? new Date(obj.lastStudied) : undefined
  };
};

// Скачать JSON файл
export const downloadJSON = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Прочитать JSON файл
export const readJSONFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Не удалось прочитать файл'));
    };
    
    reader.readAsText(file);
  });
};
