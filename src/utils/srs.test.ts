import { describe, expect, it } from "vitest";
import { Card, KnowledgeLevel } from "../types";
import { dayDiff, introducedOn, isDueAt, levelForAnswer, previewIntervals, updateSRSData } from "./srs";

// Местное время: тесты не зависят от часового пояса машины
const at = (day: number, hour = 12) => new Date(2026, 10, day, hour);

const newCard = (): Card => ({
  id: "c1",
  word: "hus",
  translation: "дом",
  explanation: "",
  example: "",
  partOfSpeech: "",
  createdAt: at(1),
  srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: at(1) },
});

const { KNOW, REMEMBER, DONT_KNOW } = KnowledgeLevel;

describe("isDueAt", () => {
  it("новая карточка не ждёт повторения", () => {
    expect(isDueAt(newCard(), at(5))).toBe(false);
  });

  it("срок считается по дням: оценённое вечером ждёт уже с утра", () => {
    const card = updateSRSData(newCard(), KNOW, at(1, 20)); // интервал 1 день → завтра в 20:00
    expect(isDueAt(card, at(2, 8))).toBe(true);
    expect(isDueAt(card, at(1, 23))).toBe(false);
  });

  it("понимает Timestamp из Firestore", () => {
    const card = newCard();
    card.srsData = { ...card.srsData, interval: 1, repetitions: 1, nextReview: { toDate: () => at(3) } as unknown as Date };
    expect(isDueAt(card, at(3, 1))).toBe(true);
  });
});

describe("updateSRSData", () => {
  it("новое слово: 1 день, потом 6, потом × лёгкость", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    expect(card.srsData.interval).toBe(1);
    card = updateSRSData(card, KNOW, at(2));
    expect(card.srsData.interval).toBe(6);
    card = updateSRSData(card, KNOW, at(8));
    expect(card.srsData.interval).toBe(Math.round(6 * 2.7));
  });

  it("повтор набора каждый день не раздувает интервал", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(2)); // в срок → 6 дней, ждёт 8-го
    for (const day of [3, 4, 5, 6]) card = updateSRSData(card, KNOW, at(day));
    expect(card.srsData.interval).toBe(6);
    expect(dayDiff(at(1), card.srsData.nextReview)).toBe(7); // расписание не сдвинулось
    expect(card.srsData.easinessFactor).toBeCloseTo(2.7); // свайпы раньше срока не накручивают лёгкость
    expect(card.srsData.totalReviews).toBe(6);
  });

  it("незадолго до срока интервал растёт по прошедшему времени", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(2)); // 6 дней, срок 8-го
    card = updateSRSData(card, REMEMBER, at(7)); // прошло 5 дней из 6
    expect(card.srsData.interval).toBe(Math.round(5 * 2.7));
    expect(card.srsData.repetitions).toBe(3);
    expect(dayDiff(at(7), card.srsData.nextReview)).toBe(card.srsData.interval);
  });

  it("забыл раньше срока — начинаем заново", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(2));
    card = updateSRSData(card, DONT_KNOW, at(4));
    expect(card.srsData.interval).toBe(1);
    expect(card.srsData.repetitions).toBe(0);
    expect(card.srsData.easinessFactor).toBeLessThan(2.7);
  });

  it("карточка без srsData не ломается", () => {
    const card = { ...newCard(), srsData: undefined } as unknown as Card;
    expect(updateSRSData(card, KNOW, at(1)).srsData.interval).toBe(1);
  });
});

describe("levelForAnswer", () => {
  it("узнал — «Помню», вспомнил сам — «Знаю», ошибся — «Забыл»", () => {
    expect(levelForAnswer({ kind: "choice", correct: true })).toBe(REMEMBER);
    expect(levelForAnswer({ kind: "choice", correct: false })).toBe(KnowledgeLevel.FORGOT);
    expect(levelForAnswer({ kind: "type", result: "exact" })).toBe(KNOW);
    expect(levelForAnswer({ kind: "type", result: "close" })).toBe(REMEMBER);
    expect(levelForAnswer({ kind: "type", result: "wrong" })).toBe(KnowledgeLevel.FORGOT);
    expect(levelForAnswer({ kind: "self", level: DONT_KNOW })).toBe(DONT_KNOW);
  });
});

describe("introducedAt", () => {
  it("ставится при первой оценке и не меняется дальше", () => {
    let card = updateSRSData(newCard(), REMEMBER, at(3, 9));
    expect(card.srsData.introducedAt).toEqual(at(3, 9));
    card = updateSRSData(card, KNOW, at(4));
    expect(card.srsData.introducedAt).toEqual(at(3, 9));
    expect(introducedOn([card, newCard()], at(3, 22))).toBe(1);
    expect(introducedOn([card], at(4))).toBe(0);
  });
});

describe("previewIntervals", () => {
  it("показывает, через сколько дней слово вернётся при каждой оценке", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(2)); // 6 дней, срок 8-го
    expect(previewIntervals(card, at(8))).toEqual({
      [DONT_KNOW]: 1,
      [KnowledgeLevel.FORGOT]: 1,
      [REMEMBER]: Math.round(6 * 2.7),
      [KNOW]: Math.round(6 * 2.7),
    });
    // Назавтра после повтора «Знаю» не сдвигает расписание: до срока остаётся 5 дней
    expect(previewIntervals(card, at(3))[KNOW]).toBe(5);
  });
});
