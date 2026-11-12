import { Card } from "../types";
import { ARTICLES } from "../utils/answerCheck";

// Пропуск в примере (docs/specs/perigee.md, этап C): находим слово карточки в её примере и прячем его.
// Слово в примере часто стоит в другой форме («hus» → «huset», «å spise» → «spiser»), поэтому ищем
// сначала точное совпадение, потом слово с той же основой. Сомневаемся (ни одного или несколько
// кандидатов) — пропуска нет: лучше обычный шаг, чем задание с ошибкой.

export interface Cloze {
  before: string;
  answer: string; // как слово написано в примере
  after: string;
}

const TOKEN = /[\p{L}\p{M}'’-]+/gu;

// «å spise» → «spise», «en bil» → «bil», «l'homme» → «homme»
function bare(word: string): string {
  const w = word.trim();
  if (/^l['’]\S/i.test(w)) return w.slice(2);
  const space = w.indexOf(" ");
  return space > 0 && ARTICLES.has(w.slice(0, space).toLowerCase()) ? w.slice(space + 1).trim() : w;
}

export function blankExample(card: Pick<Card, "word" | "example">): Cloze | null {
  const example = card.example?.trim();
  const base = bare(card.word ?? "");
  if (!example || base.length < 2) return null;
  const lower = example.toLowerCase();
  const target = base.toLowerCase();

  // Фраза из нескольких слов — только целиком и ровно один раз
  if (/\s/.test(base)) {
    const at = lower.indexOf(target);
    if (at === -1 || lower.indexOf(target, at + 1) !== -1) return null;
    return { before: example.slice(0, at), answer: example.slice(at, at + base.length), after: example.slice(at + base.length) };
  }

  const tokens = [...example.matchAll(TOKEN)].map((m) => ({ text: m[0], at: m.index ?? 0 }));
  const exact = tokens.filter((t) => t.text.toLowerCase() === target);
  // Основа: короткие слова целиком, длинные — без последней буквы (spise → spis-er, -te)
  const stem = target.length <= 4 ? target : target.slice(0, -1);
  const similar = tokens.filter((t) => {
    const w = t.text.toLowerCase();
    return w.startsWith(stem) && w.length <= target.length + 3;
  });
  const found = exact.length === 1 ? exact : exact.length === 0 && similar.length === 1 ? similar : [];
  if (found.length !== 1) return null;
  const { text, at } = found[0];
  return { before: example.slice(0, at), answer: text, after: example.slice(at + text.length) };
}
