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

// Типы достижений
export enum AchievementType {
  FIRST_COLLECTION = 'first_collection',
  FIRST_STUDY = 'first_study',
  STREAK_3 = 'streak_3',
  STREAK_7 = 'streak_7',
  STREAK_30 = 'streak_30',
  CARDS_50 = 'cards_50',
  CARDS_100 = 'cards_100',
  CARDS_500 = 'cards_500',
  QUIZ_10 = 'quiz_10',
  QUIZ_50 = 'quiz_50',
  FLASHCARDS_10 = 'flashcards_10',
  FLASHCARDS_50 = 'flashcards_50',
  PERFECT_QUIZ = 'perfect_quiz'
}

// Достижение
export interface Achievement {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
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

// Профиль пользователя
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date;
  stats: UserStats;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: Date;
  achievements: AchievementType[];
  studyHistory: StudyDay[];
}

// Статистика пользователя
export interface UserStats {
  totalCards: number;
  cardsLearned: number;
  quizzesTaken: number;
  flashcardSessions: number;
  totalStudyTime: number; // В секундах
  perfectQuizzes: number;
}

// День изучения (для календаря активности)
export interface StudyDay {
  date: string; // YYYY-MM-DD
  sessions: number;
  cardsStudied: number;
  timeSpent: number; // В секундах
}
