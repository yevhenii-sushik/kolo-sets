// Типы для приложения изучения слов

// Типы заданий для Quiz
export enum TaskType {
  WORD_BY_TRANSLATION = 'word_by_translation',
  TRANSLATION_BY_WORD = 'translation_by_word',
  WORD_BY_EXPLANATION = 'word_by_explanation',
  WRITE_WORD_BY_TRANSLATION = 'write_word_by_translation',
  WRITE_WORD_BY_EXPLANATION = 'write_word_by_explanation',
  MATCHING = 'matching'
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
  // First steps
  FIRST_COLLECTION = 'first_collection',
  FIRST_STUDY = 'first_study',
  // Streak milestones
  STREAK_3 = 'streak_3',
  STREAK_7 = 'streak_7',
  STREAK_14 = 'streak_14',
  STREAK_30 = 'streak_30',
  STREAK_60 = 'streak_60',
  STREAK_100 = 'streak_100',
  // Card count milestones
  CARDS_10 = 'cards_10',
  CARDS_25 = 'cards_25',
  CARDS_50 = 'cards_50',
  CARDS_100 = 'cards_100',
  CARDS_200 = 'cards_200',
  CARDS_500 = 'cards_500',
  CARDS_1000 = 'cards_1000',
  // Flashcard sessions
  FLASHCARDS_1 = 'flashcards_1',
  FLASHCARDS_10 = 'flashcards_10',
  FLASHCARDS_50 = 'flashcards_50',
  FLASHCARDS_100 = 'flashcards_100',
  // Quiz sessions
  QUIZ_1 = 'quiz_1',
  QUIZ_10 = 'quiz_10',
  QUIZ_50 = 'quiz_50',
  QUIZ_100 = 'quiz_100',
  // Perfect quizzes
  PERFECT_QUIZ = 'perfect_quiz',
  PERFECT_QUIZZES_3 = 'perfect_quizzes_3',
  PERFECT_QUIZZES_10 = 'perfect_quizzes_10',
  // Collections
  COLLECTIONS_3 = 'collections_3',
  COLLECTIONS_5 = 'collections_5',
  // Special session-based
  NIGHT_OWL = 'night_owl',
  EARLY_BIRD = 'early_bird',
  MARATHON = 'marathon',
  SPEED_DEMON = 'speed_demon',
  ALL_KNOW = 'all_know',
  COMEBACK = 'comeback',
}

// Контекст сессии для проверки особых достижений
export interface SessionExtras {
  duration?: number;       // seconds — for MARATHON, SPEED_DEMON
  allKnow?: boolean;       // all cards rated KNOW — for ALL_KNOW
  quizQuestions?: number;  // question count — for SPEED_DEMON check
  isComeback?: boolean;    // returning after 7+ day gap — for COMEBACK
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
  totalReviews?: number;    // Всего показов этой карточки
  correctReviews?: number;  // Успешных (quality >= 3)
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

// Папка для группировки коллекций
export interface Folder {
  id: string;
  name: string;
  color: string; // hex or tailwind token: '#3B82F6', '#22C55E', etc.
  createdAt: Date;
}

// Коллекция карточек
export interface Collection {
  id: string;
  name: string;
  language: string;          // Код языка для TTS (например 'en-US', 'nb-NO')
  cards: Card[];
  createdAt: Date;
  lastStudied?: Date;
  isFavorite?: boolean;      // Добавлена в избранное
  order?: number;            // Позиция для ручной сортировки
  folderId?: string;         // ID папки (undefined = без папки)
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
