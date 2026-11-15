// Флэшкарты большого набора — кругами (docs/specs/perigee.md, «Большие наборы»). Размер набора не
// ограничиваем, а 300 карточек подряд никто честно не пройдёт: берём по 20 по порядку и помним, где
// остановились. Позиция — в localStorage: удобство одного устройства, а не данные аккаунта

export const ROUND_SIZE = 20;
const MIN_TAIL = 5; // хвост короче — присоединяем к кругу, а не оставляем на отдельный крошечный

export interface Round {
  from: number; // индекс первой карточки круга
  to: number; // индекс после последней
}

export function roundAt(total: number, offset: number): Round {
  const from = offset > 0 && offset < total ? offset : 0;
  let to = Math.min(from + ROUND_SIZE, total);
  if (total - to < MIN_TAIL) to = total;
  return { from, to };
}

// Набор больше одного круга — показываем диапазон и общий прогресс
export const hasRounds = (total: number) => roundAt(total, 0).to < total;

const key = (collectionId: string) => `kolo_flash_pos_${collectionId}`;

export function readRoundPos(collectionId: string): number {
  try {
    const n = Number(localStorage.getItem(key(collectionId)));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveRoundPos(collectionId: string, pos: number) {
  try {
    if (pos > 0) localStorage.setItem(key(collectionId), String(pos));
    else localStorage.removeItem(key(collectionId));
  } catch {
    // Хранилище недоступно — начнём с начала, ничего страшного
  }
}
