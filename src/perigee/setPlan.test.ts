import { describe, expect, it } from "vitest";
import { Card } from "../types";
import { daysToStart, setPlan } from "./setPlan";
import { parseDailyNew } from "./prefs";

const NOW = new Date(2026, 10, 15, 12);
const day = (offset: number) => new Date(2026, 10, 15 + offset, 12);

let seq = 0;
const card = (interval: number, nextOffset = 3): Card => {
  seq += 1;
  return {
    id: `c${seq}`,
    word: `w${seq}`,
    translation: `t${seq}`,
    explanation: "",
    example: "",
    partOfSpeech: "",
    createdAt: day(-40),
    srsData: { easinessFactor: 2.5, interval, repetitions: interval ? 2 : 0, nextReview: day(nextOffset) },
  };
};

describe("setPlan", () => {
  it("слова по силе памяти — те же ступени, что точки на карточке; к повторению считаем отдельно", () => {
    const cards = [card(0), card(0), card(3, -1), card(5), card(12), card(45, 0)];
    expect(setPlan(cards, NOW)).toEqual({ total: 6, strong: 1, growing: 1, learning: 2, fresh: 2, due: 2 });
  });
  it("пустой набор", () => {
    expect(setPlan([], NOW)).toEqual({ total: 0, strong: 0, growing: 0, learning: 0, fresh: 0, due: 0 });
  });
});

describe("daysToStart", () => {
  it("помещается в сегодняшний остаток — сегодня", () => {
    expect(daysToStart(4, 12, 12)).toBe(0);
    expect(daysToStart(0, 0, 12)).toBe(0);
  });
  it("иначе — сколько дней при выбранном темпе, считая сегодняшний остаток", () => {
    expect(daysToStart(300, 12, 12)).toBe(24); // 288 после сегодня → 24 дня
    expect(daysToStart(300, 0, 12)).toBe(25); // сегодня уже всё начато — с завтрашнего дня
    expect(daysToStart(300, 0, 20)).toBe(15);
    expect(daysToStart(30, 5, 5)).toBe(5);
  });
});

describe("темп новых слов", () => {
  it("только 5, 12 или 20; иначе по умолчанию 12", () => {
    expect(parseDailyNew("5")).toBe(5);
    expect(parseDailyNew("20")).toBe(20);
    expect(parseDailyNew("7")).toBe(12);
    expect(parseDailyNew(null)).toBe(12);
    expect(parseDailyNew("abc")).toBe(12);
  });
});
