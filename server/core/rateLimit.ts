// Счётчик «сколько раз за сутки» (UTC): { day, count }. Чистая функция — сервер хранит результат в rateLimits/{uid}
export interface DailyCount {
  day: string; // YYYY-MM-DD по UTC
  count: number;
}

// Можно ли ещё раз сегодня: следующее значение счётчика или null, если лимит исчерпан.
// Кривая или вчерашняя запись — как будто сегодня ещё ничего не было
export function takeDaily(prev: unknown, limit: number, now: Date): DailyCount | null {
  const day = now.toISOString().slice(0, 10);
  const p = prev as Partial<DailyCount> | null | undefined;
  const count = p && p.day === day && typeof p.count === "number" && Number.isFinite(p.count) ? Math.max(0, p.count) : 0;
  return count >= limit ? null : { day, count: count + 1 };
}
