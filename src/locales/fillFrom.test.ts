import { describe, expect, it } from "vitest";
import { fillFrom } from "./fillFrom";
import { translations } from "./index";

describe("частичный перевод", () => {
  const en = { a: "A", nested: { b: "B", c: "C" }, list: ["x", "y"], count: { one: "{n} word", other: "{n} words" } };

  it("недостающие ключи — из английского, по одному", () => {
    expect(fillFrom(en, { nested: { b: "Б" } })).toEqual({ ...en, nested: { b: "Б", c: "C" } });
  });

  it("массивы — целиком, лишние формы множественного числа сохраняются", () => {
    expect(fillFrom(en, { list: ["икс"] }).list).toEqual(["икс"]);
    expect(fillFrom(en, { count: { one: "{n} слово", few: "{n} слова" } }).count).toEqual({ one: "{n} слово", other: "{n} words", few: "{n} слова" });
  });

  it("пусто или не того типа — остаётся английское", () => {
    expect(fillFrom(en, undefined)).toBe(en);
    expect(fillFrom(en, { a: 5, nested: "oops" })).toEqual(en);
  });

  it("переведённое — на языке, непереведённое — по-английски", () => {
    expect(translations.de.words.flashcards.settings.title).toBe("Karteneinstellungen");
    expect(translations.de.words.quiz.settings.title).toBe("Quiz-Einstellungen");
    expect(translations.de.words.editCollection.modals.importTitle).toBe("Wörter importieren");
    expect(translations.es.words.flashcards.levels.know).toBe("Lo sé");
    expect(translations.de.close).toBe("Schließen");
    expect(translations.fr.close).toBe("Fermer");
    // Совет дня и ежедневную игру не переводим — обе скрыты флагами (docs/roadmap.md, 2026-11-27),
    // так что они надёжно проверяют подстановку английского
    expect(translations.fr.home.tips).toEqual(translations.en.home.tips);
    expect(translations.de.home.tips).toEqual(translations.en.home.tips);
    expect(translations.es.game).toEqual(translations.en.game);
  });
});
