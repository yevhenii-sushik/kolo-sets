import type { Card, Collection } from "../types";
import type { Language } from "../locales/languages";
import { initialSRS } from "../utils/srs";
import type { PresetSet } from "./levels";

export interface BuildOptions {
  lang: Language; // язык перевода
  name: string; // название темы на языке интерфейса
  voice: string; // голос курса
  courseId: string;
  now: Date;
  // Сколько карточек уже добавлено в этом же действии («весь уровень»): createdAt идут дальше по порядку
  offset?: number;
  folderId?: string;
}

// Готовый набор → обычный набор человека: чистое расписание, свои id, отметка, откуда он.
// createdAt карточек — по порядку (now + offset + номер, в мс): Perigee вводит новые слова по createdAt,
// так что слова приходят в порядке тем и внутри темы, а не вперемешку (docs/specs/05-ready-sets.md)
export function buildPresetCollection(set: PresetSet, o: BuildOptions): Collection {
  const offset = o.offset ?? 0;
  const cards: Card[] = set.cards.map((c, i) => ({
    id: crypto.randomUUID(),
    word: c.word,
    translation: c.translation[o.lang] ?? c.translation.en ?? Object.values(c.translation)[0] ?? "",
    explanation: c.explanation,
    example: c.example,
    partOfSpeech: c.partOfSpeech,
    srsData: initialSRS(o.now),
    createdAt: new Date(o.now.getTime() + offset + i),
    presetCardId: c.id,
  }));
  return {
    id: crypto.randomUUID(),
    name: o.name,
    language: o.voice,
    courseId: o.courseId,
    cards,
    createdAt: new Date(o.now.getTime() + offset),
    ...(o.folderId ? { folderId: o.folderId } : {}),
    preset: { id: set.id, version: set.version, lang: o.lang },
  };
}
