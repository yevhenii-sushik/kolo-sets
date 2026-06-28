import { Achievement, AchievementType, SessionExtras } from '../types';

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // --- First steps ---
  {
    id: AchievementType.FIRST_COLLECTION,
    name: 'Первый шаг',
    description: 'Создайте первую коллекцию карточек',
    icon: '📚',
  },
  {
    id: AchievementType.FIRST_STUDY,
    name: 'Начало пути',
    description: 'Завершите первую сессию изучения',
    icon: '🎯',
  },

  // --- Streak milestones ---
  {
    id: AchievementType.STREAK_3,
    name: 'Три дня подряд',
    description: 'Занимайтесь 3 дня подряд',
    icon: '🔥',
  },
  {
    id: AchievementType.STREAK_7,
    name: 'Неделя силы',
    description: 'Занимайтесь 7 дней подряд',
    icon: '💪',
  },
  {
    id: AchievementType.STREAK_14,
    name: 'Две недели',
    description: 'Занимайтесь 14 дней подряд',
    icon: '💎',
  },
  {
    id: AchievementType.STREAK_30,
    name: 'Месяц упорства',
    description: 'Занимайтесь 30 дней подряд',
    icon: '👑',
  },
  {
    id: AchievementType.STREAK_60,
    name: 'Два месяца',
    description: 'Занимайтесь 60 дней подряд',
    icon: '🌙',
  },
  {
    id: AchievementType.STREAK_100,
    name: 'Сто дней',
    description: 'Занимайтесь 100 дней подряд',
    icon: '🏆',
  },

  // --- Card count milestones ---
  {
    id: AchievementType.CARDS_10,
    name: 'Первые слова',
    description: 'Добавьте 10 карточек',
    icon: '📖',
  },
  {
    id: AchievementType.CARDS_25,
    name: 'Росток знаний',
    description: 'Добавьте 25 карточек',
    icon: '🌱',
  },
  {
    id: AchievementType.CARDS_50,
    name: 'Коллекционер',
    description: 'Добавьте 50 карточек',
    icon: '🎴',
  },
  {
    id: AchievementType.CARDS_100,
    name: 'Мастер карточек',
    description: 'Добавьте 100 карточек',
    icon: '🏅',
  },
  {
    id: AchievementType.CARDS_200,
    name: 'Энциклопедист',
    description: 'Добавьте 200 карточек',
    icon: '📚',
  },
  {
    id: AchievementType.CARDS_500,
    name: 'Легенда',
    description: 'Добавьте 500 карточек',
    icon: '⭐',
  },
  {
    id: AchievementType.CARDS_1000,
    name: 'Ходячая энциклопедия',
    description: 'Добавьте 1000 карточек',
    icon: '🧠',
  },

  // --- Flashcard sessions ---
  {
    id: AchievementType.FLASHCARDS_1,
    name: 'Первое знакомство',
    description: 'Завершите первую сессию флешкарточек',
    icon: '🃏',
  },
  {
    id: AchievementType.FLASHCARDS_10,
    name: 'Флешкарт-новичок',
    description: 'Завершите 10 сессий флешкарточек',
    icon: '🎴',
  },
  {
    id: AchievementType.FLASHCARDS_50,
    name: 'Флешкарт-мастер',
    description: 'Завершите 50 сессий флешкарточек',
    icon: '🌟',
  },
  {
    id: AchievementType.FLASHCARDS_100,
    name: 'Флешкарт-ас',
    description: 'Завершите 100 сессий флешкарточек',
    icon: '🦅',
  },

  // --- Quiz sessions ---
  {
    id: AchievementType.QUIZ_1,
    name: 'Первый экзамен',
    description: 'Пройдите первый квиз',
    icon: '❓',
  },
  {
    id: AchievementType.QUIZ_10,
    name: 'Тестировщик',
    description: 'Пройдите 10 квизов',
    icon: '📊',
  },
  {
    id: AchievementType.QUIZ_50,
    name: 'Мастер квизов',
    description: 'Пройдите 50 квизов',
    icon: '🎓',
  },
  {
    id: AchievementType.QUIZ_100,
    name: 'Квиз-чемпион',
    description: 'Пройдите 100 квизов',
    icon: '🏆',
  },

  // --- Perfect quizzes ---
  {
    id: AchievementType.PERFECT_QUIZ,
    name: 'Идеально!',
    description: 'Пройдите квиз без единой ошибки',
    icon: '💯',
  },
  {
    id: AchievementType.PERFECT_QUIZZES_3,
    name: 'Перфекционист',
    description: 'Пройдите 3 квиза без ошибок',
    icon: '✨',
  },
  {
    id: AchievementType.PERFECT_QUIZZES_10,
    name: 'Машина',
    description: 'Пройдите 10 квизов без ошибок',
    icon: '🤖',
  },

  // --- Collections ---
  {
    id: AchievementType.COLLECTIONS_3,
    name: 'Библиотекарь',
    description: 'Создайте 3 коллекции',
    icon: '📂',
  },
  {
    id: AchievementType.COLLECTIONS_5,
    name: 'Архивариус',
    description: 'Создайте 5 коллекций',
    icon: '🗂️',
  },

  // --- Special session achievements ---
  {
    id: AchievementType.NIGHT_OWL,
    name: 'Сова',
    description: 'Позанимайтесь после полуночи',
    icon: '🦉',
  },
  {
    id: AchievementType.EARLY_BIRD,
    name: 'Жаворонок',
    description: 'Позанимайтесь до 7 утра',
    icon: '🌅',
  },
  {
    id: AchievementType.MARATHON,
    name: 'Марафонец',
    description: 'Занимайтесь более 30 минут за одну сессию',
    icon: '🏃',
  },
  {
    id: AchievementType.SPEED_DEMON,
    name: 'Скоростной демон',
    description: 'Ответьте на все вопросы квиза менее чем за 5 секунд каждый',
    icon: '⚡',
  },
  {
    id: AchievementType.ALL_KNOW,
    name: 'Знаю всё!',
    description: 'Оцените все карточки как «Знаю» в одной сессии',
    icon: '🌈',
  },
  {
    id: AchievementType.COMEBACK,
    name: 'Возвращение',
    description: 'Вернитесь к учёбе после перерыва в 7+ дней',
    icon: '🔄',
  },
];

export const checkAndUnlockAchievements = (
  profile: any,
  totalCards: number,
  extras?: SessionExtras & { collectionsCount?: number }
): AchievementType[] => {
  const newAchievements: AchievementType[] = [];
  const unlockedSet = new Set<string>(profile.achievements ?? []);
  const stats = profile.stats ?? {};
  const isFromSession = extras !== undefined;

  const check = (id: AchievementType, condition: boolean) => {
    if (condition && !unlockedSet.has(id)) newAchievements.push(id);
  };

  const collectionsCount = extras?.collectionsCount ?? 0;
  const streak = profile.currentStreak ?? 0;
  const flashcardSessions = stats.flashcardSessions ?? 0;
  const quizzesTaken = stats.quizzesTaken ?? 0;
  const perfectQuizzes = stats.perfectQuizzes ?? 0;

  // First steps
  check(AchievementType.FIRST_COLLECTION, collectionsCount >= 1 || totalCards > 0);
  check(AchievementType.FIRST_STUDY, flashcardSessions > 0 || quizzesTaken > 0);

  // Streaks
  check(AchievementType.STREAK_3, streak >= 3);
  check(AchievementType.STREAK_7, streak >= 7);
  check(AchievementType.STREAK_14, streak >= 14);
  check(AchievementType.STREAK_30, streak >= 30);
  check(AchievementType.STREAK_60, streak >= 60);
  check(AchievementType.STREAK_100, streak >= 100);

  // Card counts
  check(AchievementType.CARDS_10, totalCards >= 10);
  check(AchievementType.CARDS_25, totalCards >= 25);
  check(AchievementType.CARDS_50, totalCards >= 50);
  check(AchievementType.CARDS_100, totalCards >= 100);
  check(AchievementType.CARDS_200, totalCards >= 200);
  check(AchievementType.CARDS_500, totalCards >= 500);
  check(AchievementType.CARDS_1000, totalCards >= 1000);

  // Flashcard sessions
  check(AchievementType.FLASHCARDS_1, flashcardSessions >= 1);
  check(AchievementType.FLASHCARDS_10, flashcardSessions >= 10);
  check(AchievementType.FLASHCARDS_50, flashcardSessions >= 50);
  check(AchievementType.FLASHCARDS_100, flashcardSessions >= 100);

  // Quiz sessions
  check(AchievementType.QUIZ_1, quizzesTaken >= 1);
  check(AchievementType.QUIZ_10, quizzesTaken >= 10);
  check(AchievementType.QUIZ_50, quizzesTaken >= 50);
  check(AchievementType.QUIZ_100, quizzesTaken >= 100);

  // Perfect quizzes
  check(AchievementType.PERFECT_QUIZ, perfectQuizzes >= 1);
  check(AchievementType.PERFECT_QUIZZES_3, perfectQuizzes >= 3);
  check(AchievementType.PERFECT_QUIZZES_10, perfectQuizzes >= 10);

  // Collections
  check(AchievementType.COLLECTIONS_3, collectionsCount >= 3);
  check(AchievementType.COLLECTIONS_5, collectionsCount >= 5);

  // Session-specific achievements (only when called from a session)
  if (isFromSession) {
    const hour = new Date().getHours();
    check(AchievementType.NIGHT_OWL, hour >= 0 && hour < 5);
    check(AchievementType.EARLY_BIRD, hour >= 5 && hour < 7);

    if (extras?.duration !== undefined) {
      check(AchievementType.MARATHON, extras.duration >= 1800);
    }

    if (extras?.allKnow) {
      check(AchievementType.ALL_KNOW, true);
    }

    if (extras?.quizQuestions !== undefined && extras?.duration !== undefined && extras.quizQuestions >= 5) {
      const secPerQuestion = extras.duration / extras.quizQuestions;
      check(AchievementType.SPEED_DEMON, secPerQuestion < 5);
    }

    if (extras?.isComeback) {
      check(AchievementType.COMEBACK, true);
    }
  }

  return newAchievements;
};

export const getAchievement = (id: AchievementType): Achievement | undefined =>
  ALL_ACHIEVEMENTS.find(a => a.id === id);

export const getUnlockedAchievements = (profile: any): Achievement[] =>
  (profile.achievements ?? [])
    .map((id: AchievementType) => getAchievement(id))
    .filter(Boolean) as Achievement[];

export const getAchievementProgress = (
  achievement: Achievement,
  profile: any,
  totalCards: number,
  collectionsCount = 0
): { current: number; target: number; percentage: number } => {
  const stats = profile.stats ?? {};
  const streak = profile.currentStreak ?? 0;
  const flashcardSessions = stats.flashcardSessions ?? 0;
  const quizzesTaken = stats.quizzesTaken ?? 0;
  const perfectQuizzes = stats.perfectQuizzes ?? 0;

  let current = 0;
  let target = 1;

  switch (achievement.id) {
    case AchievementType.FIRST_COLLECTION:
      current = collectionsCount > 0 || totalCards > 0 ? 1 : 0;
      break;
    case AchievementType.FIRST_STUDY:
      current = flashcardSessions + quizzesTaken > 0 ? 1 : 0;
      break;

    case AchievementType.STREAK_3:   current = Math.min(streak, 3);   target = 3;   break;
    case AchievementType.STREAK_7:   current = Math.min(streak, 7);   target = 7;   break;
    case AchievementType.STREAK_14:  current = Math.min(streak, 14);  target = 14;  break;
    case AchievementType.STREAK_30:  current = Math.min(streak, 30);  target = 30;  break;
    case AchievementType.STREAK_60:  current = Math.min(streak, 60);  target = 60;  break;
    case AchievementType.STREAK_100: current = Math.min(streak, 100); target = 100; break;

    case AchievementType.CARDS_10:   current = Math.min(totalCards, 10);   target = 10;   break;
    case AchievementType.CARDS_25:   current = Math.min(totalCards, 25);   target = 25;   break;
    case AchievementType.CARDS_50:   current = Math.min(totalCards, 50);   target = 50;   break;
    case AchievementType.CARDS_100:  current = Math.min(totalCards, 100);  target = 100;  break;
    case AchievementType.CARDS_200:  current = Math.min(totalCards, 200);  target = 200;  break;
    case AchievementType.CARDS_500:  current = Math.min(totalCards, 500);  target = 500;  break;
    case AchievementType.CARDS_1000: current = Math.min(totalCards, 1000); target = 1000; break;

    case AchievementType.FLASHCARDS_1:   current = Math.min(flashcardSessions, 1);   break;
    case AchievementType.FLASHCARDS_10:  current = Math.min(flashcardSessions, 10);  target = 10;  break;
    case AchievementType.FLASHCARDS_50:  current = Math.min(flashcardSessions, 50);  target = 50;  break;
    case AchievementType.FLASHCARDS_100: current = Math.min(flashcardSessions, 100); target = 100; break;

    case AchievementType.QUIZ_1:   current = Math.min(quizzesTaken, 1);   break;
    case AchievementType.QUIZ_10:  current = Math.min(quizzesTaken, 10);  target = 10;  break;
    case AchievementType.QUIZ_50:  current = Math.min(quizzesTaken, 50);  target = 50;  break;
    case AchievementType.QUIZ_100: current = Math.min(quizzesTaken, 100); target = 100; break;

    case AchievementType.PERFECT_QUIZ:     current = perfectQuizzes > 0 ? 1 : 0;             break;
    case AchievementType.PERFECT_QUIZZES_3:  current = Math.min(perfectQuizzes, 3);  target = 3;  break;
    case AchievementType.PERFECT_QUIZZES_10: current = Math.min(perfectQuizzes, 10); target = 10; break;

    case AchievementType.COLLECTIONS_3: current = Math.min(collectionsCount, 3); target = 3; break;
    case AchievementType.COLLECTIONS_5: current = Math.min(collectionsCount, 5); target = 5; break;

    // One-shot session achievements — either done or not
    case AchievementType.NIGHT_OWL:
    case AchievementType.EARLY_BIRD:
    case AchievementType.MARATHON:
    case AchievementType.SPEED_DEMON:
    case AchievementType.ALL_KNOW:
    case AchievementType.COMEBACK:
      current = 0;
      target = 1;
      break;
  }

  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
  return { current, target, percentage };
};
