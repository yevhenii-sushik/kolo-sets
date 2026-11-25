import { describe, expect, it } from "vitest";
import { AchievementType } from "../../src/types";
import { countCards, isStartedCard } from "./cards";
import { collectionAchievements } from "./session";

const fresh = { srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: {}, lastReviewed: null } };
const dontKnow = { srsData: { interval: 0, repetitions: 0, totalReviews: 1, lastReviewed: { seconds: 1 } } };
const old = { srsData: { interval: 3, repetitions: 1 } }; // до totalReviews и lastReviewed

describe("isStartedCard", () => {
  it("новое слово не начато, даже если в базе lastReviewed: null", () => {
    expect(isStartedCard(fresh)).toBe(false);
    expect(isStartedCard({})).toBe(false);
    expect(isStartedCard(null)).toBe(false);
  });

  it("слово начато после первой оценки, в том числе «Не знаю» (интервал 0)", () => {
    expect(isStartedCard(dontKnow)).toBe(true);
  });

  it("старые карточки без totalReviews — по интервалу", () => {
    expect(isStartedCard(old)).toBe(true);
  });
});

describe("countCards", () => {
  it("все карточки, начатые слова и начатые наборы", () => {
    const counts = countCards([{ cards: [fresh, dontKnow, old] }, { cards: [fresh, fresh] }, { cards: [] }, undefined, {}]);
    expect(counts).toEqual({ allCards: 5, startedCards: 2, startedSets: 1 });
  });
});

describe("медали за слова и наборы — только за начатое", () => {
  const state = { achievements: [] };

  it("готовый уровень без единой тренировки: медаль только за первый набор", () => {
    const sets = Array.from({ length: 16 }, () => ({ cards: Array.from({ length: 20 }, () => fresh) }));
    const counts = countCards(sets);
    const unlocked = collectionAchievements(state, {
      cardsInSession: 0,
      totalCards: counts.startedCards,
      collectionsCount: counts.startedSets,
      hasCollection: sets.length > 0,
    });
    expect(unlocked).toEqual([AchievementType.FIRST_COLLECTION]);
  });

  it("начатые слова в трёх наборах — медали за 10 слов и 3 набора", () => {
    const sets = [0, 1, 2].map(() => ({ cards: [dontKnow, dontKnow, dontKnow, dontKnow, fresh] }));
    const counts = countCards(sets);
    const unlocked = collectionAchievements(state, {
      cardsInSession: 0,
      totalCards: counts.startedCards,
      collectionsCount: counts.startedSets,
      hasCollection: true,
    });
    expect(unlocked).toEqual(expect.arrayContaining([AchievementType.FIRST_COLLECTION, AchievementType.CARDS_10, AchievementType.COLLECTIONS_3]));
    expect(unlocked).not.toContain(AchievementType.CARDS_25);
  });
});
