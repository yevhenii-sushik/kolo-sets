import { Card } from '../types';

// Честный Fisher-Yates: sort(() => Math.random() - 0.5) статистически смещён
// (нестабильный компаратор), короткие списки почти не перемешиваются.
export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// 4 варианта ответа: правильный + 3 дистрактора. field — что выбираем: перевод (по умолчанию) или слово.
// Сначала берём слова той же части речи: «бежать» среди трёх существительных угадывается исключением.
// Дедуп без учёта регистра, чтобы две карточки с одинаковым ответом не давали две «правильные» кнопки.
export function makeChoicesFor(card: Card, pool: Card[], field: 'word' | 'translation' = 'translation'): string[] {
  const correct = card[field];
  const seen = new Set([correct.trim().toLowerCase()]);
  const same: string[] = [];
  const other: string[] = [];
  for (const c of pool) {
    if (c.id === card.id) continue;
    const value = c[field] ?? '';
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    (card.partOfSpeech && c.partOfSpeech === card.partOfSpeech ? same : other).push(value);
  }
  const distractors = [...shuffle(same), ...shuffle(other)].slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([...distractors, correct]);
}

export function makeChoices(card: Card, allCards: Card[]): string[] {
  return makeChoicesFor(card, allCards, 'translation');
}

// Достаточно ли разных ответов для четырёх вариантов
export function canMakeChoices(pool: Card[], field: 'word' | 'translation' = 'translation'): boolean {
  return new Set(pool.map((c) => (c[field] ?? '').trim().toLowerCase()).filter(Boolean)).size >= 4;
}
