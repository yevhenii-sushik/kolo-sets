import { Card } from '../types';

// Честный Fisher-Yates: sort(() => Math.random() - 0.5) статистически смещён
// (нестабильный компаратор), короткие списки почти не перемешиваются.
export function shuffle<T>(arr: readonly T[], random: () => number = Math.random): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 4 варианта ответа: правильный + 3 дистрактора. field — что выбираем: перевод (по умолчанию) или слово.
// Сначала берём слова той же части речи: «бежать» среди трёх существительных угадывается исключением.
// Дедуп без учёта регистра, чтобы две карточки с одинаковым ответом не давали две «правильные» кнопки.
export function makeChoicesFor(card: Card, pool: Card[], field: 'word' | 'translation' = 'translation'): string[] {
  const distractors = distractorsFor(card, pool, field).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([...distractors, card[field]]);
}

const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();

// Неверные варианты для карточки: та же часть речи первой, без повторов. Синонимы не берём: если у
// двух слов один перевод («glad» и «lykkelig» — «счастливый»), на вопрос «счастливый» верны оба, и
// второй засчитался бы ошибкой. То же наоборот: у омонима («bank» — «банк» и «берег») верны оба перевода
export function distractorsFor(card: Card, pool: Card[], field: 'word' | 'translation'): string[] {
  const prompt = field === 'word' ? 'translation' : 'word';
  const asked = norm(card[prompt]);
  const seen = new Set([norm(card[field])]);
  const same: string[] = [];
  const other: string[] = [];
  for (const c of pool) {
    if (c.id === card.id || norm(c[prompt]) === asked) continue;
    const value = c[field] ?? '';
    const key = norm(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    (card.partOfSpeech && c.partOfSpeech === card.partOfSpeech ? same : other).push(value);
  }
  return [...shuffle(same), ...shuffle(other)];
}

export function makeChoices(card: Card, allCards: Card[]): string[] {
  return makeChoicesFor(card, allCards, 'translation');
}

// Достаточно ли разных ответов для четырёх вариантов
export function canMakeChoices(pool: Card[], field: 'word' | 'translation' = 'translation'): boolean {
  return new Set(pool.map((c) => (c[field] ?? '').trim().toLowerCase()).filter(Boolean)).size >= 4;
}
