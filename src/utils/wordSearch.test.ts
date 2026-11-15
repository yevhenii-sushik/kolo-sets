import { describe, expect, it } from "vitest";
import type { Card, Collection } from "../types";
import { fold, searchCards } from "./wordSearch";

const card = (id: string, word: string, translation: string, explanation = ""): Card => ({
  id,
  word,
  translation,
  explanation,
  example: "",
  partOfSpeech: "",
  srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(0) },
  createdAt: new Date(0),
});

const set = (id: string, cards: Card[]): Collection => ({ id, name: id, language: "nb-NO", cards, createdAt: new Date(0) });

const ids = (r: ReturnType<typeof searchCards>) => r.results.map((x) => x.card.id);

describe("fold", () => {
  it("без регистра и диакритики, с картой индексов", () => {
    expect(fold("Über").text).toBe("uber");
    expect(fold("ёлка").text).toBe("елка");
    expect(fold("Corazón").text).toBe("corazon");
    // æ и ø — отдельные буквы, не «a» и «o» с меткой
    expect(fold("blåbær").text).toBe("blabær");
    expect(fold("søt").text).toBe("søt");
  });

  it("составленные символы указывают на свою букву в исходной строке", () => {
    const f = fold("éx"); // е + отдельное ударение
    expect(f.text).toBe("ex");
    expect(f.origin).toEqual([0, 2]);
  });
});

describe("searchCards", () => {
  const sets = [
    set("a", [card("1", "huske", "помнить"), card("2", "fuglehus", "скворечник"), card("3", "bok", "книга", "noe man leser")]),
    set("b", [card("4", "hus", "дом"), card("5", "Hus", "дом")]),
  ];

  it("пустой запрос — пусто", () => {
    expect(searchCards(sets, "   ")).toEqual({ results: [], total: 0 });
  });

  it("точное совпадение → начало → внутри; без регистра", () => {
    expect(ids(searchCards(sets, "hus"))).toEqual(["4", "5", "1", "2"]);
  });

  it("ищет по переводу и объяснению", () => {
    expect(ids(searchCards(sets, "дом"))).toEqual(["4", "5"]);
    expect(ids(searchCards(sets, "leser"))).toEqual(["3"]);
    expect(searchCards(sets, "leser").results[0].field).toBe("explanation");
  });

  it("лучшее поле карточки: точный перевод выше слова, где запрос внутри", () => {
    const r = searchCards([set("c", [card("x", "husdyr", "bok"), card("y", "kokebok", "поваренная книга")])], "bok");
    expect(ids(r)).toEqual(["x", "y"]);
    expect(r.results[0].field).toBe("translation");
  });

  it("находит без диакритики и подсвечивает исходные буквы", () => {
    const r = searchCards([set("d", [card("z", "Straße über", "улица")])], "uber");
    expect(r.results[0].range).toEqual([7, 11]);
    expect("Straße über".slice(...r.results[0].range)).toBe("über");
  });

  it("лимит: показывает первые, total — сколько всего", () => {
    const many = set("m", Array.from({ length: 70 }, (_, i) => card(`c${i}`, `ord${i}`, "слово")));
    const r = searchCards([many], "ord", 50);
    expect(r.results).toHaveLength(50);
    expect(r.total).toBe(70);
  });
});
