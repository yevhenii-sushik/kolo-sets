import type { Card, Collection } from "../types";
import type { SharedSet } from "../../server/core/shareLinks";
import { courseCodeFromLanguage, getCourseLanguage } from "../courses/languages";
import { initialSRS } from "../utils/srs";

// Курс набора по ссылке: свой id курса, если он есть в каталоге, иначе — по языку озвучки (у старых наборов).
// null — языка нет в каталоге: такой набор кладём в активный курс получателя
export function sharedSetCourse(set: Pick<SharedSet, "course" | "voice">): string | null {
  if (set.course && getCourseLanguage(set.course)) return set.course;
  const code = courseCodeFromLanguage(set.voice || undefined);
  return getCourseLanguage(code) ? code : null;
}

// Голос набора, если это вариант того же курса: новый курс сразу звучит так, как у автора ('en-GB', 'pt-BR')
export function sharedSetVoice(set: Pick<SharedSet, "voice">, course: string): string | undefined {
  return getCourseLanguage(course)?.variants.some((v) => v.voice === set.voice) ? set.voice : undefined;
}

export interface SharedBuildOptions {
  shareId: string;
  courseId: string;
  voice: string; // голос курса получателя
  now: Date;
}

// Набор по ссылке → свой набор получателя: новые id, чистое расписание, отметка, откуда он.
// createdAt карточек — по порядку слов (now + номер, в мс): Perigee вводит новые слова по createdAt,
// так что они приходят в том порядке, в каком их выстроил автор (docs/specs/07-shared-sets.md)
export function buildSharedCollection(set: SharedSet, o: SharedBuildOptions): Collection {
  const cards: Card[] = set.cards.map((c, i) => ({
    id: crypto.randomUUID(),
    word: c.word,
    translation: c.translation,
    explanation: c.explanation,
    example: c.example,
    partOfSpeech: c.partOfSpeech,
    srsData: initialSRS(o.now),
    createdAt: new Date(o.now.getTime() + i),
  }));
  return {
    id: crypto.randomUUID(),
    name: set.name,
    language: o.voice,
    courseId: o.courseId,
    cards,
    createdAt: o.now,
    sharedFrom: o.shareId,
  };
}
