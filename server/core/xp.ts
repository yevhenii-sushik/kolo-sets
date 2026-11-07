// Опыт и уровни (docs/specs/02-progression.md → «Опыт и уровни»). Чистые функции.
import { AchievementType } from "../../src/types";

export const DAILY_XP_CAP = 400; // опыт за тренировки в день; бонусы — сверх потолка
export const FIRST_SESSION_BONUS = 5;
export const ORBIT_BONUS = 50;
const GAME_ROUND_MAX = 20;
const PERFECT_QUIZ_BONUS = 10;

export type Kind = "flashcards" | "review" | "quiz" | "speed" | "survival" | "match";

// Опыт за саму тренировку (до потолка)
export function sessionXp(kind: Kind, cards: number, correct?: number): number {
  switch (kind) {
    case "flashcards":
    case "review":
      return cards;
    case "quiz": {
      const right = correct ?? 0;
      return cards + right + (right === cards && cards > 0 ? PERFECT_QUIZ_BONUS : 0);
    }
    default:
      return Math.min(correct ?? 0, GAME_ROUND_MAX);
  }
}

// Сколько из «сырого» опыта засчитать с учётом дневного потолка
export function capDaily(raw: number, xpDay: { day: string; amount: number } | undefined, today: string) {
  const used = xpDay?.day === today ? xpDay.amount : 0;
  const gained = Math.max(0, Math.min(raw, DAILY_XP_CAP - used));
  return { gained, xpDay: { day: today, amount: used + gained } };
}

// Переход с уровня L на L+1 стоит 100 + 50 × (L − 1)
export const levelStep = (level: number) => 100 + 50 * (level - 1);

export function levelFromXp(xp: number): { level: number; into: number; next: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(xp));
  while (rest >= levelStep(level)) {
    rest -= levelStep(level);
    level += 1;
  }
  return { level, into: rest, next: levelStep(level) };
}

// Достижения: крупные — 100, средние — 50, остальные — 25
const BIG = new Set<AchievementType>([
  AchievementType.STREAK_30,
  AchievementType.STREAK_60,
  AchievementType.STREAK_100,
  AchievementType.CARDS_500,
  AchievementType.CARDS_1000,
  AchievementType.FLASHCARDS_100,
  AchievementType.QUIZ_50,
  AchievementType.QUIZ_100,
  AchievementType.PERFECT_QUIZZES_10,
]);
const MID = new Set<AchievementType>([
  AchievementType.STREAK_7,
  AchievementType.STREAK_14,
  AchievementType.CARDS_100,
  AchievementType.CARDS_200,
  AchievementType.FLASHCARDS_50,
  AchievementType.QUIZ_10,
  AchievementType.PERFECT_QUIZZES_3,
  AchievementType.COLLECTIONS_5,
  AchievementType.MARATHON,
  AchievementType.SPEED_DEMON,
]);

export const achievementXp = (id: AchievementType) => (BIG.has(id) ? 100 : MID.has(id) ? 50 : 25);
