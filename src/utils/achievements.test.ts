import { describe, expect, it } from "vitest";
import { ALL_ACHIEVEMENTS, checkAndUnlockAchievements, getAchievementProgress } from "./achievements";
import { AchievementType } from "../types";

// Достижения «за тренировку» проверяются только с данными сессии — у них нет прогресса
const SESSION_ONLY = new Set<AchievementType>([
  AchievementType.NIGHT_OWL,
  AchievementType.EARLY_BIRD,
  AchievementType.MARATHON,
  AchievementType.SPEED_DEMON,
  AchievementType.ALL_KNOW,
  AchievementType.COMEBACK,
]);

interface Case {
  name: string;
  profile: { stats: Record<string, number>; currentStreak: number; achievements: string[] };
  cards: number;
  options: { collectionsCount: number; hasCollection: boolean };
}

const cases: Case[] = [
  { name: "новичок", profile: { stats: {}, currentStreak: 0, achievements: [] }, cards: 0, options: { collectionsCount: 0, hasCollection: false } },
  // Взял готовый набор и ни разу не учил: начатых слов и наборов нет
  { name: "готовый набор без тренировок", profile: { stats: {}, currentStreak: 0, achievements: [] }, cards: 0, options: { collectionsCount: 0, hasCollection: true } },
  { name: "только Блиц", profile: { stats: { gamesPlayed: 3 }, currentStreak: 1, achievements: [] }, cards: 12, options: { collectionsCount: 1, hasCollection: true } },
  {
    name: "занимается давно",
    profile: { stats: { flashcardSessions: 55, quizzesTaken: 12, perfectQuizzes: 4, gamesPlayed: 9 }, currentStreak: 15, achievements: [] },
    cards: 230,
    options: { collectionsCount: 4, hasCollection: true },
  },
];

describe("getAchievementProgress", () => {
  // Прогресс 100% ⇔ сервер открыл бы достижение: полоса не может стоять полной у закрытой медали
  for (const c of cases) {
    it(`совпадает с правилами открытия: ${c.name}`, () => {
      const unlocked = new Set(checkAndUnlockAchievements(c.profile, c.cards, c.options));
      for (const a of ALL_ACHIEVEMENTS) {
        if (SESSION_ONLY.has(a.id)) continue;
        const full = getAchievementProgress(a, c.profile, c.cards, c.options).percentage >= 100;
        expect([a.id, full]).toEqual([a.id, unlocked.has(a.id)]);
      }
    });
  }

  it("медаль за 50 слов считает переданные начатые слова, а не все слова наборов", () => {
    const a = ALL_ACHIEVEMENTS.find((x) => x.id === AchievementType.CARDS_50)!;
    expect(getAchievementProgress(a, { stats: {} }, 12).current).toBe(12);
  });

  it("первый набор засчитан, даже если в нём ничего не начато", () => {
    const a = ALL_ACHIEVEMENTS.find((x) => x.id === AchievementType.FIRST_COLLECTION)!;
    expect(getAchievementProgress(a, { stats: {} }, 0, { hasCollection: true }).percentage).toBe(100);
  });
});
