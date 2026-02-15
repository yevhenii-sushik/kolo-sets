import { Achievement, AchievementType, UserProfile } from '../types';

// Все доступные достижения
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: AchievementType.FIRST_COLLECTION,
    name: 'Первый шаг',
    description: 'Создайте первую коллекцию',
    icon: '📚'
  },
  {
    id: AchievementType.FIRST_STUDY,
    name: 'Начало пути',
    description: 'Завершите первую сессию изучения',
    icon: '🎯'
  },
  {
    id: AchievementType.STREAK_3,
    name: 'Три дня подряд',
    description: 'Занимайтесь 3 дня подряд',
    icon: '🔥'
  },
  {
    id: AchievementType.STREAK_7,
    name: 'Неделя силы',
    description: 'Занимайтесь 7 дней подряд',
    icon: '💪'
  },
  {
    id: AchievementType.STREAK_30,
    name: 'Месяц упорства',
    description: 'Занимайтесь 30 дней подряд',
    icon: '👑'
  },
  {
    id: AchievementType.CARDS_50,
    name: 'Коллекционер',
    description: 'Создайте 50 карточек',
    icon: '🎴'
  },
  {
    id: AchievementType.CARDS_100,
    name: 'Мастер карточек',
    description: 'Создайте 100 карточек',
    icon: '🏅'
  },
  {
    id: AchievementType.CARDS_500,
    name: 'Легенда',
    description: 'Создайте 500 карточек',
    icon: '⭐'
  },
  {
    id: AchievementType.QUIZ_10,
    name: 'Тестировщик',
    description: 'Пройдите 10 квизов',
    icon: '❓'
  },
  {
    id: AchievementType.QUIZ_50,
    name: 'Мастер квизов',
    description: 'Пройдите 50 квизов',
    icon: '🎓'
  },
  {
    id: AchievementType.FLASHCARDS_10,
    name: 'Флешкарт-новичок',
    description: 'Завершите 10 сессий флешкарточек',
    icon: '🎴'
  },
  {
    id: AchievementType.FLASHCARDS_50,
    name: 'Флешкарт-мастер',
    description: 'Завершите 50 сессий флешкарточек',
    icon: '🌟'
  },
  {
    id: AchievementType.PERFECT_QUIZ,
    name: 'Идеально!',
    description: 'Пройдите квиз без ошибок',
    icon: '💯'
  }
];

// Проверить и разблокировать достижения
export const checkAndUnlockAchievements = (
  profile: UserProfile,
  totalCards: number
): AchievementType[] => {
  const newAchievements: AchievementType[] = [];
  const unlockedIds = profile.achievements;

  // Первая коллекция
  if (!unlockedIds.includes(AchievementType.FIRST_COLLECTION) && totalCards > 0) {
    newAchievements.push(AchievementType.FIRST_COLLECTION);
  }

  // Первая сессия
  if (
    !unlockedIds.includes(AchievementType.FIRST_STUDY) &&
    (profile.stats.flashcardSessions > 0 || profile.stats.quizzesTaken > 0)
  ) {
    newAchievements.push(AchievementType.FIRST_STUDY);
  }

  // Стрики
  if (!unlockedIds.includes(AchievementType.STREAK_3) && profile.currentStreak >= 3) {
    newAchievements.push(AchievementType.STREAK_3);
  }
  if (!unlockedIds.includes(AchievementType.STREAK_7) && profile.currentStreak >= 7) {
    newAchievements.push(AchievementType.STREAK_7);
  }
  if (!unlockedIds.includes(AchievementType.STREAK_30) && profile.currentStreak >= 30) {
    newAchievements.push(AchievementType.STREAK_30);
  }

  // Карточки
  if (!unlockedIds.includes(AchievementType.CARDS_50) && totalCards >= 50) {
    newAchievements.push(AchievementType.CARDS_50);
  }
  if (!unlockedIds.includes(AchievementType.CARDS_100) && totalCards >= 100) {
    newAchievements.push(AchievementType.CARDS_100);
  }
  if (!unlockedIds.includes(AchievementType.CARDS_500) && totalCards >= 500) {
    newAchievements.push(AchievementType.CARDS_500);
  }

  // Квизы
  if (!unlockedIds.includes(AchievementType.QUIZ_10) && profile.stats.quizzesTaken >= 10) {
    newAchievements.push(AchievementType.QUIZ_10);
  }
  if (!unlockedIds.includes(AchievementType.QUIZ_50) && profile.stats.quizzesTaken >= 50) {
    newAchievements.push(AchievementType.QUIZ_50);
  }

  // Флешкарточки
  if (
    !unlockedIds.includes(AchievementType.FLASHCARDS_10) &&
    profile.stats.flashcardSessions >= 10
  ) {
    newAchievements.push(AchievementType.FLASHCARDS_10);
  }
  if (
    !unlockedIds.includes(AchievementType.FLASHCARDS_50) &&
    profile.stats.flashcardSessions >= 50
  ) {
    newAchievements.push(AchievementType.FLASHCARDS_50);
  }

  // Идеальный квиз
  if (
    !unlockedIds.includes(AchievementType.PERFECT_QUIZ) &&
    profile.stats.perfectQuizzes > 0
  ) {
    newAchievements.push(AchievementType.PERFECT_QUIZ);
  }

  return newAchievements;
};

// Получить достижение по ID
export const getAchievement = (id: AchievementType): Achievement | undefined => {
  return ALL_ACHIEVEMENTS.find(a => a.id === id);
};

// Получить все разблокированные достижения
export const getUnlockedAchievements = (profile: UserProfile): Achievement[] => {
  return profile.achievements
    .map(id => getAchievement(id))
    .filter(Boolean) as Achievement[];
};

// Получить прогресс достижения (для отображения)
export const getAchievementProgress = (
  achievement: Achievement,
  profile: UserProfile,
  totalCards: number
): { current: number; target: number; percentage: number } => {
  let current = 0;
  let target = 0;

  switch (achievement.id) {
    case AchievementType.FIRST_COLLECTION:
      current = totalCards > 0 ? 1 : 0;
      target = 1;
      break;
    case AchievementType.FIRST_STUDY:
      current = profile.stats.flashcardSessions + profile.stats.quizzesTaken > 0 ? 1 : 0;
      target = 1;
      break;
    case AchievementType.STREAK_3:
      current = Math.min(profile.currentStreak, 3);
      target = 3;
      break;
    case AchievementType.STREAK_7:
      current = Math.min(profile.currentStreak, 7);
      target = 7;
      break;
    case AchievementType.STREAK_30:
      current = Math.min(profile.currentStreak, 30);
      target = 30;
      break;
    case AchievementType.CARDS_50:
      current = Math.min(totalCards, 50);
      target = 50;
      break;
    case AchievementType.CARDS_100:
      current = Math.min(totalCards, 100);
      target = 100;
      break;
    case AchievementType.CARDS_500:
      current = Math.min(totalCards, 500);
      target = 500;
      break;
    case AchievementType.QUIZ_10:
      current = Math.min(profile.stats.quizzesTaken, 10);
      target = 10;
      break;
    case AchievementType.QUIZ_50:
      current = Math.min(profile.stats.quizzesTaken, 50);
      target = 50;
      break;
    case AchievementType.FLASHCARDS_10:
      current = Math.min(profile.stats.flashcardSessions, 10);
      target = 10;
      break;
    case AchievementType.FLASHCARDS_50:
      current = Math.min(profile.stats.flashcardSessions, 50);
      target = 50;
      break;
    case AchievementType.PERFECT_QUIZ:
      current = profile.stats.perfectQuizzes > 0 ? 1 : 0;
      target = 1;
      break;
  }

  const percentage = target > 0 ? Math.round((current / target) * 100) : 0;

  return { current, target, percentage };
};
