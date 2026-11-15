import { KnowledgeLevel } from "../types";

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

// Где остановились: начало круга и оценки, уже поставленные в нём. Ушёл посреди круга — вернёшься
// к оставшимся карточкам, а итог круга всё равно посчитает все (docs/specs/perigee.md, «Флэшкарты»)
export interface RoundState {
  pos: number;
  done: Record<string, KnowledgeLevel>; // id карточки → первая оценка в этом круге
}

const EMPTY: RoundState = { pos: 0, done: {} };
const LEVELS = new Set<string>(Object.values(KnowledgeLevel));

// Раньше хранили только число (позицию) — его тоже понимаем
export function parseRoundState(raw: string | null): RoundState {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "number") return value > 0 ? { pos: value, done: {} } : EMPTY;
    if (!value || typeof value !== "object") return EMPTY;
    const { pos, done } = value as { pos?: unknown; done?: unknown };
    const clean: Record<string, KnowledgeLevel> = {};
    if (done && typeof done === "object") {
      for (const [id, level] of Object.entries(done)) if (LEVELS.has(level as string)) clean[id] = level as KnowledgeLevel;
    }
    return { pos: typeof pos === "number" && pos > 0 ? pos : 0, done: clean };
  } catch {
    return EMPTY;
  }
}

const key = (collectionId: string) => `kolo_flash_pos_${collectionId}`;

export function readRoundState(collectionId: string): RoundState {
  try {
    return parseRoundState(localStorage.getItem(key(collectionId)));
  } catch {
    return EMPTY;
  }
}

export function saveRoundState(collectionId: string, state: RoundState) {
  try {
    if (state.pos > 0 || Object.keys(state.done).length > 0) localStorage.setItem(key(collectionId), JSON.stringify(state));
    else localStorage.removeItem(key(collectionId));
  } catch {
    // Хранилище недоступно — начнём с начала, ничего страшного
  }
}

// Честный итог круга: хвалим, только когда есть за что. Трудные — «Не знаю» и «Забылось»
export type RoundTier = "clean" | "good" | "start";

export function roundTier(total: number, hard: number): RoundTier {
  if (hard === 0) return "clean";
  return hard * 2 <= total ? "good" : "start";
}
