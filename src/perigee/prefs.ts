// Темп новых слов — сколько новых Perigee начинает в день (docs/specs/perigee.md, «План набора и темп
// новых слов»). Как и цель на день, живёт на устройстве. Сам счёт начатых сегодня слов общий для всех
// устройств: он идёт по srsData.introducedAt в наборах

import { DAILY_NEW } from "./plan";

export const DAILY_NEW_OPTIONS = [5, 12, 20] as const;
export type DailyNew = (typeof DAILY_NEW_OPTIONS)[number];

const KEY = "kolo_daily_new";

export function parseDailyNew(raw: string | null): DailyNew {
  const n = Number(raw);
  return (DAILY_NEW_OPTIONS as readonly number[]).includes(n) ? (n as DailyNew) : (DAILY_NEW as DailyNew);
}

export function readDailyNew(): DailyNew {
  try {
    return parseDailyNew(localStorage.getItem(KEY));
  } catch {
    return DAILY_NEW as DailyNew;
  }
}

export function saveDailyNew(n: DailyNew) {
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    // Хранилище недоступно — темп по умолчанию
  }
}
