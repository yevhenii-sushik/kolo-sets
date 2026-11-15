import { describe, expect, it } from "vitest";
import { KnowledgeLevel } from "../types";
import { hasRounds, parseRoundState, roundAt, roundTier } from "./flashRounds";

describe("roundAt", () => {
  it("маленький набор — целиком", () => {
    expect(roundAt(12, 0)).toEqual({ from: 0, to: 12 });
    expect(roundAt(24, 0)).toEqual({ from: 0, to: 24 }); // хвост из 4 не отдельный круг
    expect(hasRounds(24)).toBe(false);
  });

  it("большой — по 20 по порядку, короткий хвост присоединяется", () => {
    expect(roundAt(300, 0)).toEqual({ from: 0, to: 20 });
    expect(roundAt(300, 40)).toEqual({ from: 40, to: 60 });
    expect(roundAt(63, 40)).toEqual({ from: 40, to: 63 });
    expect(roundAt(70, 40)).toEqual({ from: 40, to: 60 });
    expect(hasRounds(25)).toBe(true);
  });

  it("позиция за концом набора (слова удалили) — с начала", () => {
    expect(roundAt(30, 40)).toEqual({ from: 0, to: 20 });
    expect(roundAt(30, -3)).toEqual({ from: 0, to: 20 });
  });
});

describe("где остановились посреди круга", () => {
  it("старая запись — просто число", () => {
    expect(parseRoundState("40")).toEqual({ pos: 40, done: {} });
    expect(parseRoundState("0")).toEqual({ pos: 0, done: {} });
  });

  it("оценки круга сохраняются, мусор отбрасывается", () => {
    const raw = JSON.stringify({ pos: 20, done: { a: KnowledgeLevel.KNOW, b: KnowledgeLevel.DONT_KNOW, c: "maybe", d: 3 } });
    expect(parseRoundState(raw)).toEqual({ pos: 20, done: { a: KnowledgeLevel.KNOW, b: KnowledgeLevel.DONT_KNOW } });
  });

  it("пусто, битая строка или странное значение — с начала", () => {
    expect(parseRoundState(null)).toEqual({ pos: 0, done: {} });
    expect(parseRoundState("{oops")).toEqual({ pos: 0, done: {} });
    expect(parseRoundState(JSON.stringify({ pos: -5, done: [] }))).toEqual({ pos: 0, done: {} });
  });
});

describe("честный итог круга", () => {
  it("без трудных — «ни одного трудного», до половины — «хорошо идёт», больше — «хорошее начало»", () => {
    expect(roundTier(20, 0)).toBe("clean");
    expect(roundTier(20, 10)).toBe("good");
    expect(roundTier(20, 11)).toBe("start");
    expect(roundTier(3, 2)).toBe("start");
  });
});
