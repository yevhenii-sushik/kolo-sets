import { LANGUAGES, type Language } from "../locales/languages";

// Готовые наборы Kolo: уровни, темы и языки перевода. Чистый модуль — им пользуются и страница,
// и тест содержимого. Спецификация — docs/specs/05-ready-sets.md

export const PRESET_LEVELS = ["A1", "A2"] as const;
export type PresetLevel = (typeof PRESET_LEVELS)[number];

// Темы уровня. Порядок — порядок в списке, в папке уровня и в том, как Perigee вводит новые слова.
// Темы общие для всех курсов, названия — в words.ready.topics на всех языках интерфейса
export const PRESET_TOPICS: Record<PresetLevel, readonly string[]> = {
  A1: [
    "greetings",
    "numbers",
    "time",
    "people",
    "food",
    "home",
    "city",
    "shopping",
    "health",
    "clothes",
    "weather",
    "work",
    "leisure",
    "verbs",
    "adjectives",
    "small-words",
  ],
  A2: [],
};

export interface PresetCard {
  id: string; // постоянный в пределах набора
  word: string;
  partOfSpeech: string; // ключ из words.pos
  explanation: string; // на изучаемом языке, может быть пустым
  example: string;
  translation: Partial<Record<Language, string>>;
}

// Файл набора: src/presets/<курс>/<уровень>/<тема>.json — курс, уровень и тема берутся из пути
export interface PresetFile {
  version: number;
  cards: PresetCard[];
}

export interface PresetSet extends PresetFile {
  id: string;
  course: string;
  level: PresetLevel;
  topic: string;
}

export const presetId = (course: string, level: PresetLevel, topic: string) => `${course}-${level.toLowerCase()}-${topic}`;

const topicRank = (level: PresetLevel, topic: string) => {
  const i = PRESET_TOPICS[level].indexOf(topic);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

// Сначала по уровню, внутри уровня — по порядку тем
export const comparePresets = (a: { level: PresetLevel; topic: string }, b: { level: PresetLevel; topic: string }) =>
  PRESET_LEVELS.indexOf(a.level) - PRESET_LEVELS.indexOf(b.level) || topicRank(a.level, a.topic) - topicRank(b.level, b.topic);

// Язык интерфейса и курс одного языка: у норвежского интерфейс 'no', курс 'nb'; у португальского — 'pt-BR' и 'pt'
const UI_COURSE: Partial<Record<Language, string>> = { no: "nb", "pt-BR": "pt" };

// На какие языки переведены слова набора: все языки интерфейса, кроме языка самого курса
export const translationLanguages = (course: string): Language[] =>
  LANGUAGES.map((l) => l.code).filter((code) => (UI_COURSE[code] ?? code) !== course);

// Перевод по умолчанию — на язык интерфейса. Если он совпадает с языком курса (норвежский интерфейс,
// курс норвежского) — на английский
export const defaultTranslationLanguage = (course: string, ui: Language): Language => {
  const langs = translationLanguages(course);
  if (langs.includes(ui)) return ui;
  return langs.includes("en") ? "en" : langs[0];
};
