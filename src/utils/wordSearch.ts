import type { Card, Collection } from "../types";

// Поиск слова по наборам курса: вкладка «Слова» (поле «Найти слово», ⌘K с любой вкладки)

export type MatchField = "word" | "translation" | "explanation";

export interface WordSearchResult {
  card: Card;
  collection: Collection;
  field: MatchField;
  // Совпадение в исходном тексте поля: [начало, конец) — для подсветки
  range: [number, number];
}

export const SEARCH_LIMIT = 50;

// ⌘K / Ctrl+K на вкладке «Слова»: шапка просит страницу поставить курсор в поле поиска
export const FIND_WORD_EVENT = "kolo:find-word";

interface Folded {
  text: string;
  // Для каждого символа свёрнутой строки — индекс его символа в исходной
  origin: number[];
}

// Без регистра и диакритики: ученик часто печатает без нужной раскладки, и «uber» должно найти
// «über», «corazon» — «corazón», «е» — «ё». Карта индексов нужна, чтобы подсветить исходные буквы
export function fold(source: string): Folded {
  let text = "";
  const origin: number[] = [];
  let i = 0;
  for (const ch of source) {
    const folded = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (const part of folded) {
      text += part;
      origin.push(i);
    }
    i += ch.length;
  }
  return { text, origin };
}

// Найденный кусок свёрнутой строки → границы в исходной
function sourceRange(f: Folded, source: string, start: number, length: number): [number, number] {
  const from = f.origin[start];
  const last = f.origin[start + length - 1];
  const lastChar = source.codePointAt(last) ?? 0;
  return [from, last + (lastChar > 0xffff ? 2 : 1)];
}

const FIELDS: MatchField[] = ["word", "translation", "explanation"];

// Чем меньше, тем выше в списке: точное совпадение → начало поля → где-то внутри;
// при равенстве слово важнее перевода, перевод — объяснения
function rank(field: MatchField, haystack: string, at: number, length: number): number {
  const place = at === 0 && haystack.length === length ? 0 : at === 0 ? 1 : 2;
  return place * FIELDS.length + FIELDS.indexOf(field);
}

export function searchCards(
  collections: Collection[],
  query: string,
  limit = SEARCH_LIMIT,
): { results: WordSearchResult[]; total: number } {
  const q = fold(query.trim()).text;
  if (!q) return { results: [], total: 0 };

  const found: { result: WordSearchResult; score: number; order: number }[] = [];
  for (const collection of collections) {
    for (const card of collection.cards) {
      // Одна строка на карточку — по лучшему совпадению: перевод «hus» точнее, чем слово «husker»
      let best: { result: WordSearchResult; score: number } | null = null;
      for (const field of FIELDS) {
        const source = card[field];
        if (!source) continue;
        const f = fold(source);
        const at = f.text.indexOf(q);
        if (at === -1) continue;
        const score = rank(field, f.text, at, q.length);
        if (!best || score < best.score) {
          best = { result: { card, collection, field, range: sourceRange(f, source, at, q.length) }, score };
        }
      }
      if (best) found.push({ ...best, order: found.length });
    }
  }

  found.sort((a, b) => a.score - b.score || a.order - b.order);
  return { results: found.slice(0, limit).map((x) => x.result), total: found.length };
}
