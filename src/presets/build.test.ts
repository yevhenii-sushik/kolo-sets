import { describe, expect, it } from "vitest";
import { isNewCard } from "../utils/srs";
import { buildPresetCollection } from "./build";
import type { PresetSet } from "./levels";

const set: PresetSet = {
  id: "nb-a1-greetings",
  course: "nb",
  level: "A1",
  topic: "greetings",
  version: 3,
  cards: [
    { id: "hei", word: "hei", partOfSpeech: "interjection", explanation: "", example: "Hei!", translation: { en: "hi", ru: "привет" } },
    { id: "takk", word: "takk", partOfSpeech: "interjection", explanation: "", example: "Takk!", translation: { en: "thanks" } },
  ],
};
const now = new Date("2026-11-22T10:00:00Z");
const base = { name: "Приветствия", voice: "nb-NO", courseId: "nb", now };

describe("buildPresetCollection", () => {
  it("обычный набор человека с отметкой, откуда он", () => {
    const col = buildPresetCollection(set, { ...base, lang: "ru" });
    expect(col).toMatchObject({ name: "Приветствия", language: "nb-NO", courseId: "nb", preset: { id: "nb-a1-greetings", version: 3, lang: "ru" } });
    expect(col.folderId).toBeUndefined();
    expect(col.cards.map((c) => c.presetCardId)).toEqual(["hei", "takk"]);
    expect(col.cards.every(isNewCard)).toBe(true);
  });

  it("перевод на выбранный язык, а если его нет — английский", () => {
    const col = buildPresetCollection(set, { ...base, lang: "ru" });
    expect(col.cards.map((c) => c.translation)).toEqual(["привет", "thanks"]);
  });

  it("свои id: один набор можно добавить в разные курсы, id не совпадут", () => {
    const a = buildPresetCollection(set, { ...base, lang: "en" });
    const b = buildPresetCollection(set, { ...base, lang: "en" });
    expect(a.id).not.toBe(b.id);
    expect(a.cards[0].id).not.toBe(b.cards[0].id);
  });

  it("createdAt идут по порядку и продолжаются со сдвигом — Perigee введёт слова по темам", () => {
    const first = buildPresetCollection(set, { ...base, lang: "en" });
    const second = buildPresetCollection(set, { ...base, lang: "en", offset: set.cards.length, folderId: "f1" });
    const times = [...first.cards, ...second.cards].map((c) => c.createdAt.getTime());
    expect(times).toEqual([...times].sort((x, y) => x - y));
    expect(new Set(times).size).toBe(times.length);
    expect(second.folderId).toBe("f1");
  });
});
