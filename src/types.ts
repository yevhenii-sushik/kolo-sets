// Типы для приложения изучения слов

// Типы заданий для Quiz
export enum TaskType {
  WORD_BY_TRANSLATION = 'word_by_translation',
  TRANSLATION_BY_WORD = 'translation_by_word',
  WORD_BY_EXPLANATION = 'word_by_explanation',
  WRITE_WORD_BY_TRANSLATION = 'write_word_by_translation',
  WRITE_WORD_BY_EXPLANATION = 'write_word_by_explanation'
}

// Оценка знания слова (для флешкарточек)
export enum KnowledgeLevel {
  DONT_KNOW = 'dont_know',      // Не знаю
  FORGOT = 'forgot',             // Забыл
  REMEMBER = 'remember',         // Помню
  KNOW = 'know'                  // Знаю
}

// Данные для алгоритма интервального повторения (SRS)
export interface SRSData {
  easinessFactor: number;   // Коэффициент легкости (2.5 по умолчанию)
  interval: number;         // Интервал в днях
  repetitions: number;      // Количество успешных повторений
  nextReview: Date;         // Дата следующего повторения
  lastReviewed?: Date;      // Дата последнего повторения
}

// Карточка слова
export interface Card {
  id: string;
  word: string;              // Слово на изучаемом языке
  translation: string;       // Перевод
  explanation: string;       // Объяснение на изучаемом языке
  example: string;           // Пример использования
  partOfSpeech: string;      // Часть речи
  srsData: SRSData;         // Данные для интервального повторения
  createdAt: Date;
}

// Коллекция карточек
export interface Collection {
  id: string;
  name: string;
  cards: Card[];
  createdAt: Date;
  lastStudied?: Date;
}

// Настройки Quiz
export interface QuizSettings {
  enabledTaskTypes: TaskType[];
}

// Статистика сессии флешкарточек
export interface FlashcardStats {
  totalCards: number;
  dontKnow: number;
  forgot: number;
  remember: number;
  know: number;
  duration: number;  // В секундах
}

// Статистика Quiz
export interface QuizStats {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  byTaskType: {
    [key in TaskType]?: {
      correct: number;
      total: number;
    }
  };
  duration: number;  // В секундах
  mistakes: QuizMistake[];
}

// Ошибка в Quiz
export interface QuizMistake {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  taskType: TaskType;
}

