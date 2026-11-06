import { Achievement, AchievementType, SessionExtras } from '../types';

// Названия и описания — в переводах: t.profile.achievementsList[id]
export const ALL_ACHIEVEMENTS: Achievement[] = [
  // --- First steps ---
  { id: AchievementType.FIRST_COLLECTION, icon: '📚' },
  { id: AchievementType.FIRST_STUDY, icon: '🎯' },
  // --- Streak milestones ---
  { id: AchievementType.STREAK_3, icon: '🔥' },
  { id: AchievementType.STREAK_7, icon: '💪' },
  { id: AchievementType.STREAK_14, icon: '💎' },
  { id: AchievementType.STREAK_30, icon: '👑' },
  { id: AchievementType.STREAK_60, icon: '🌙' },
  { id: AchievementType.STREAK_100, icon: '🏆' },
  // --- Card count milestones ---
  { id: AchievementType.CARDS_10, icon: '📖' },
  { id: AchievementType.CARDS_25, icon: '🌱' },
  { id: AchievementType.CARDS_50, icon: '🎴' },
  { id: AchievementType.CARDS_100, icon: '🏅' },
  { id: AchievementType.CARDS_200, icon: '📚' },
  { id: AchievementType.CARDS_500, icon: '⭐' },
  { id: AchievementType.CARDS_1000, icon: '🧠' },
  // --- Flashcard sessions ---
  { id: AchievementType.FLASHCARDS_1, icon: '🃏' },
  { id: AchievementType.FLASHCARDS_10, icon: '🎴' },
  { id: AchievementType.FLASHCARDS_50, icon: '🌟' },
  { id: AchievementType.FLASHCARDS_100, icon: '🦅' },
  // --- Quiz sessions ---
  { id: AchievementType.QUIZ_1, icon: '❓' },
  { id: AchievementType.QUIZ_10, icon: '📊' },
  { id: AchievementType.QUIZ_50, icon: '🎓' },
  { id: AchievementType.QUIZ_100, icon: '🏆' },
  // --- Perfect quizzes ---
  { id: AchievementType.PERFECT_QUIZ, icon: '💯' },
  { id: AchievementType.PERFECT_QUIZZES_3, icon: '✨' },
  { id: AchievementType.PERFECT_QUIZZES_10, icon: '🤖' },
  // --- Collections ---
  { id: AchievementType.COLLECTIONS_3, icon: '📂' },
  { id: AchievementType.COLLECTIONS_5, icon: '🗂️' },
  // --- Special session-based ---
  { id: AchievementType.NIGHT_OWL, icon: '🦉' },
  { id: AchievementType.EARLY_BIRD, icon: '🌅' },
  { id: AchievementType.MARATHON, icon: '🏃' },
  { id: AchievementType.SPEED_DEMON, icon: '⚡' },
  { id: AchievementType.ALL_KNOW, icon: '🌈' },
  { id: AchievementType.COMEBACK, icon: '🔄' },
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
