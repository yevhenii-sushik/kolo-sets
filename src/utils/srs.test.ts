import { describe, expect, it } from "vitest";
import { Card, KnowledgeLevel } from "../types";
import { dayDiff, introducedOn, isDueAt, levelForAnswer, memoryStrength, previewIntervals, updateSRSData } from "./srs";

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

const { KNOW, REMEMBER, FORGOT, DONT_KNOW } = KnowledgeLevel;

describe("isDueAt", () => {
  it("новая карточка не ждёт повторения", () => {
    expect(isDueAt(newCard(), at(5))).toBe(false);
  });

  it("срок считается по дням: оценённое вечером ждёт уже с утра", () => {
    const card = updateSRSData(newCard(), FORGOT, at(1, 20)); // 1 день → завтра в 20:00
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
  it("«Помню»: лесенка 1 → 6 → × лёгкость, лёгкость не меняется; новое слово — не раньше чем через 2 дня", () => {
    let card = updateSRSData(newCard(), REMEMBER, at(1));
    expect(card.srsData.interval).toBe(1);
    expect(dayDiff(at(1), card.srsData.nextReview)).toBe(2); // на день дальше «Забыл»
    card = updateSRSData(card, REMEMBER, at(3));
    expect(card.srsData.interval).toBe(6);
    card = updateSRSData(card, REMEMBER, at(9));
    expect(card.srsData.interval).toBe(15);
    expect(card.srsData.easinessFactor).toBeCloseTo(2.5);
  });

  it("«Знаю»: 3 → 8 → × лёгкость × 1,3, лёгкость растёт", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    expect(card.srsData.interval).toBe(3);
    card = updateSRSData(card, KNOW, at(4));
    expect(card.srsData.interval).toBe(8);
    card = updateSRSData(card, KNOW, at(12));
    expect(card.srsData.interval).toBe(Math.round(8 * 2.8 * 1.3));
    expect(card.srsData.easinessFactor).toBeCloseTo(2.95);
  });

  it("повтор набора каждый день сдвигает слово на день, а не умножает интервал", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(4)); // в срок → 8 дней, ждёт 12-го
    for (const day of [5, 6, 7, 8]) card = updateSRSData(card, KNOW, at(day));
    expect(card.srsData.interval).toBe(8);
    expect(dayDiff(at(8), card.srsData.nextReview)).toBe(8); // не дальше, чем «Помню» + день
    expect(card.srsData.easinessFactor).toBeCloseTo(2.8); // раньше срока лёгкость не накручивается
    expect(card.srsData.totalReviews).toBe(6);
  });

  it("незадолго до срока интервал растёт по прошедшему времени", () => {
    let card = updateSRSData(newCard(), REMEMBER, at(1));
    card = updateSRSData(card, REMEMBER, at(3)); // 6 дней, срок 9-го
    card = updateSRSData(card, REMEMBER, at(8)); // прошло 5 дней из 6
    expect(card.srsData.interval).toBe(Math.round(5 * 2.5));
    expect(card.srsData.repetitions).toBe(3);
    expect(dayDiff(at(8), card.srsData.nextReview)).toBe(card.srsData.interval);
  });

  it("«Не знаю» — с нуля; «Забыл» — завтра, но потом сразу 6 дней", () => {
    let card = updateSRSData(newCard(), KNOW, at(1));
    card = updateSRSData(card, KNOW, at(4)); // 8 дней
    const lost = updateSRSData(card, DONT_KNOW, at(6));
    expect(lost.srsData).toMatchObject({ interval: 1, repetitions: 0 });
    expect(lost.srsData.easinessFactor).toBeCloseTo(2.6);
    const forgot = updateSRSData(card, FORGOT, at(6));
    expect(forgot.srsData).toMatchObject({ interval: 1, repetitions: 1 });
    expect(updateSRSData(forgot, REMEMBER, at(7)).srsData.interval).toBe(6);
    expect(updateSRSData(lost, REMEMBER, at(7)).srsData.interval).toBe(1);
  });

  it("карточка без srsData не ломается", () => {
    const card = { ...newCard(), srsData: undefined } as unknown as Card;
    expect(updateSRSData(card, KNOW, at(1)).srsData.interval).toBe(3);
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
    card = updateSRSData(card, KNOW, at(4)); // 8 дней, срок 12-го, лёгкость 2,8
    expect(previewIntervals(card, at(12))).toEqual({
      [DONT_KNOW]: 1,
      [FORGOT]: 1,
      [REMEMBER]: Math.round(8 * 2.8),
      [KNOW]: Math.round(8 * 2.8 * 1.3),
    });
    // Назавтра после повтора «Помню» расписание не трогает (до срока 7 дней), «Знаю» — на день дальше
    expect(previewIntervals(card, at(5))).toMatchObject({ [REMEMBER]: 7, [KNOW]: 8 });
  });

  it("у «Забыл», «Помню» и «Знаю» сроки всегда разные", () => {
    const due = (interval: number, repetitions: number, nextDay: number, lastDay: number): Card => ({
      ...newCard(),
      srsData: { easinessFactor: 1.3, interval, repetitions, nextReview: at(nextDay), lastReviewed: at(lastDay) },
    });
    const cards: [Card, number][] = [
      [newCard(), 1], // новое
      [due(1, 0, 10, 9), 10], // после «Не знаю», в срок
      [due(1, 1, 10, 9), 10], // ступень 6 дней
      [due(1, 1, 11, 9), 10], // ждёт завтра
      [due(30, 4, 20, 1), 10], // далеко до срока
      [due(2, 2, 10, 8), 10], // маленький интервал, минимальная лёгкость
    ];
    for (const [card, day] of cards) {
      const p = previewIntervals(card, at(day));
      expect(p[REMEMBER]).toBeGreaterThan(p[FORGOT]);
      expect(p[KNOW]).toBeGreaterThan(p[REMEMBER]);
    }
  });
});

describe("memoryStrength", () => {
  const withInterval = (interval: number): Card => ({ ...newCard(), srsData: { ...newCard().srsData, interval, repetitions: 2 } });

  it("новое → учится → крепнет → крепкое по интервалу", () => {
    expect(memoryStrength(newCard())).toBe(0);
    expect(memoryStrength(withInterval(1))).toBe(1);
    expect(memoryStrength(withInterval(6))).toBe(1);
    expect(memoryStrength(withInterval(7))).toBe(2);
    expect(memoryStrength(withInterval(29))).toBe(2);
    expect(memoryStrength(withInterval(30))).toBe(3);
  });

  it("первая оценка нового слова выводит его из «нового»", () => {
    expect(memoryStrength(updateSRSData(newCard(), REMEMBER, at(1)))).toBe(1);
  });
});
