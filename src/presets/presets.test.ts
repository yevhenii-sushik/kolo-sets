import { describe, expect, it } from "vitest";
import { LANGUAGES } from "../locales/languages";
import { getCourseLanguage } from "../courses/languages";
import en from "../locales/en/words/words.json";
import { PRESET_LEVELS, PRESET_TOPICS, type PresetFile, type PresetLevel, translationLanguages, defaultTranslationLanguage } from "./levels";

// Проверка содержимого готовых наборов: формат, переводы, повторы (docs/specs/05-ready-sets.md).
// Вычитки нет — тест ловит то, что можно поймать машиной
const FILES = import.meta.glob<PresetFile>("./*/*/*.json", { eager: true, import: "default" });
const WORDS = import.meta.glob<{ ready?: { topics?: Record<string, string>; levels?: Record<string, string> } }>(
  "../locales/*/words/words.json",
  { eager: true, import: "default" },
);

const POS = Object.keys(en.pos);
const sets = Object.entries(FILES).map(([path, file]) => {
  const [, course, levelDir, topic] = path.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.json$/) ?? [];
  return { path, course, level: levelDir?.toUpperCase() as PresetLevel, levelDir, topic, file };
});

const clean = (s: unknown) => typeof s === "string" && s.length > 0 && s === s.trim() && !/\s{2,}/.test(s);

describe("готовые наборы: файлы", () => {
  it("есть хотя бы один набор", () => {
    expect(sets.length).toBeGreaterThan(0);
  });

  it.each(sets)("$path: курс, уровень и тема из пути существуют", ({ course, level, levelDir, topic }) => {
    expect(getCourseLanguage(course), `курс ${course}`).toBeDefined();
    expect(levelDir, "папка уровня — строчными").toBe(levelDir.toLowerCase());
    expect(PRESET_LEVELS).toContain(level);
    expect(PRESET_TOPICS[level], `тема ${topic}`).toContain(topic);
  });

  it.each(sets)("$path: версия и число карточек", ({ file }) => {
    expect(Number.isInteger(file.version) && file.version >= 1).toBe(true);
    expect(file.cards.length).toBeGreaterThanOrEqual(15);
    expect(file.cards.length).toBeLessThanOrEqual(25);
  });

  it.each(sets)("$path: карточки заполнены", ({ course, file }) => {
    const langs = translationLanguages(course);
    const ids = new Set<string>();
    for (const card of file.cards) {
      const where = `${card.id} (${card.word})`;
      expect(card.id, where).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(ids.has(card.id), `повтор id ${where}`).toBe(false);
      ids.add(card.id);
      expect(clean(card.word), `word ${where}`).toBe(true);
      expect(clean(card.example), `example ${where}`).toBe(true);
      expect(typeof card.explanation === "string" && card.explanation === card.explanation.trim(), `explanation ${where}`).toBe(true);
      expect(POS, `partOfSpeech ${where}`).toContain(card.partOfSpeech);
      for (const lang of langs) expect(clean(card.translation[lang]), `перевод ${lang}: ${where}`).toBe(true);
      // Перевод на язык самого курса не нужен — его быть не должно, чтобы не путать
      expect(Object.keys(card.translation).sort(), `языки перевода: ${where}`).toEqual([...langs].sort());
    }
  });

  it("одно слово не встречается в двух наборах одного курса и уровня", () => {
    const seen = new Map<string, string>();
    for (const { course, level, topic, file } of sets) {
      for (const card of file.cards) {
        const key = `${course}/${level}/${card.word.toLowerCase()}`;
        expect(seen.get(key), `«${card.word}» уже есть в ${seen.get(key)}`).toBeUndefined();
        seen.set(key, topic);
      }
    }
  });
});

describe("готовые наборы: названия на всех языках интерфейса", () => {
  it.each(LANGUAGES.map((l) => l.code))("%s: все темы и уровни", (code) => {
    const ready = WORDS[`../locales/${code}/words/words.json`]?.ready;
    for (const level of PRESET_LEVELS) {
      expect(clean(ready?.levels?.[level]), `уровень ${level}`).toBe(true);
      for (const topic of PRESET_TOPICS[level]) expect(clean(ready?.topics?.[topic]), `тема ${topic}`).toBe(true);
    }
  });
});

describe("язык перевода", () => {
  it("все языки интерфейса, кроме языка курса", () => {
    expect(translationLanguages("nb")).not.toContain("no");
    expect(translationLanguages("nb")).toContain("en");
    expect(translationLanguages("en")).not.toContain("en");
    expect(translationLanguages("pt")).not.toContain("pt-BR");
    expect(translationLanguages("it")).toHaveLength(LANGUAGES.length);
  });

  it("по умолчанию — язык интерфейса, а если он совпадает с курсом — английский", () => {
    expect(defaultTranslationLanguage("nb", "ru")).toBe("ru");
    expect(defaultTranslationLanguage("nb", "no")).toBe("en");
    expect(defaultTranslationLanguage("en", "uk")).toBe("uk");
    expect(translationLanguages("en")).toContain(defaultTranslationLanguage("en", "en"));
  });
});
