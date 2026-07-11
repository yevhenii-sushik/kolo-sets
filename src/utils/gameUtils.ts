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

// 4 варианта ответа: правильный перевод + 3 дистрактора.
// Дедуп без учёта регистра, чтобы две карточки с одинаковым переводом
// не давали две одинаковые «правильные» кнопки.
export function makeChoices(card: Card, allCards: Card[]): string[] {
  const correct = card.translation;
  const seen = new Set([correct.trim().toLowerCase()]);
  const pool: string[] = [];
  for (const c of allCards) {
    if (c.id === card.id) continue;
    const key = c.translation.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(c.translation);
  }
  const distractors = shuffle(pool).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([...distractors, correct]);
}
