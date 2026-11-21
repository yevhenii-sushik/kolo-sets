// «Голос» главной: короткая фраза над главной кнопкой, которая подталкивает заниматься
// (docs/roadmap.md, «Живой Kolo»). Фраза строится только из настоящих данных — дней без занятий,
// орбиты недели, цели дня и вчерашнего счёта. Ничего не выдумываем: если сказать по делу нечего,
// берём «фразу дня» из общего списка, одну и ту же весь день, чтобы главная не мигала разными словами.
// Чистые функции без браузера — покрыты тестами (nudge.test.ts)

export type NudgeKey =
  | "away" // давно не занимался: n — дней с последней тренировки
  | "orbitToday" // сегодня решает неделю: одна тренировка замкнёт орбиту
  | "orbitAtRisk" // до воскресенья нельзя пропустить ни дня
  | "orbitLastDay" // ещё один день — и орбита недели замкнута
  | "goalClose" // до цели дня n карточек
  | "beatYesterday" // вчера — n карточек: побьёшь?
  | "goalMet" // цель дня выполнена: почему бы не ещё
  | "lateNight" // день почти прошёл, а занятий не было
  | "pileUp"; // к повторению скопилось много слов

export type Nudge = { key: NudgeKey; n?: number } | { key: "generic"; index: number };

export interface NudgeInput {
  today: string; // YYYY-MM-DD по местному времени (localDateKey)
  hour: number; // 0–23, местное время
  todayStudied: number; // карточек сегодня (из studyHistory)
  dailyGoal: number;
  dueCount: number;
  history: { date: string; sessions?: number; cardsStudied?: number }[];
  /** Орбита недели из ответа сервера; null — сервер ещё не отвечал */
  orbit?: { status: "closed" | "onTrack" | "atRisk" | "lost"; goal: number; days: string[] } | null;
  genericCount: number; // сколько фраз в общем списке перевода
}

// Пороги: «давно» — с двух дней, «близко к цели» — до 5 карточек, вчерашний счёт есть смысл
// побивать от 10 карточек, «копится» — от 30 слов к повторению, «поздно» — с 21:00
export const AWAY_DAYS = 2;
export const GOAL_CLOSE = 5;
export const BEAT_MIN = 10;
export const PILE_UP = 30;
export const LATE_HOUR = 21;

const dayNumber = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
};

const studied = (d: { sessions?: number; cardsStudied?: number }) => (d.sessions ?? 0) > 0 || (d.cardsStudied ?? 0) > 0;

/** Дней с последней тренировки до сегодняшнего дня; null — тренировок ещё не было */
export function daysSinceLastStudy(history: NudgeInput["history"], today: string): number | null {
  const t = dayNumber(today);
  let last: number | null = null;
  for (const d of history) {
    if (!studied(d)) continue;
    const n = dayNumber(d.date);
    if (n <= t && (last === null || n > last)) last = n;
  }
  return last === null ? null : t - last;
}

/** Фраза дня: одна и та же весь день, на следующий день — следующая */
export const genericIndex = (today: string, count: number) => (count > 0 ? ((dayNumber(today) % count) + count) % count : 0);

export function pickNudge(input: NudgeInput): Nudge {
  const { today, hour, todayStudied, dailyGoal, dueCount, history, orbit } = input;
  const gap = daysSinceLastStudy(history, today);
  const studiedToday = todayStudied > 0 || gap === 0;

  // 1. Вернулся после перерыва — сначала об этом: слова и правда уходят из памяти
  if (!studiedToday && gap !== null && gap >= AWAY_DAYS) return { key: "away", n: gap };

  // 2. Орбита недели: сегодня ещё не засчитан, а без него неделя под угрозой или почти замкнута
  if (orbit && orbit.status !== "closed" && orbit.status !== "lost" && !orbit.days.includes(today)) {
    const need = orbit.goal - orbit.days.length;
    if (orbit.status === "atRisk") return { key: need <= 1 ? "orbitToday" : "orbitAtRisk" };
    if (need === 1) return { key: "orbitLastDay" };
  }

  // 3. Цель дня: близко — дожимаем, вчера было больше — подзадориваем, выполнена — предлагаем ещё
  const left = dailyGoal - todayStudied;
  if (todayStudied > 0 && left > 0 && left <= GOAL_CLOSE) return { key: "goalClose", n: left };
  const yesterday = history.find((d) => dayNumber(d.date) === dayNumber(today) - 1)?.cardsStudied ?? 0;
  if (yesterday >= BEAT_MIN && todayStudied < yesterday) return { key: "beatYesterday", n: yesterday };
  if (todayStudied >= dailyGoal && todayStudied > 0) return { key: "goalMet" };

  // 4. Поздно, а занятий не было; или повторений скопилось много
  if (!studiedToday && hour >= LATE_HOUR) return { key: "lateNight" };
  if (dueCount >= PILE_UP) return { key: "pileUp" };

  return { key: "generic", index: genericIndex(today, input.genericCount) };
}

/** Возглас серии верных ответов: на 5, 10, 15, 20 и дальше каждые 5 подряд. Индекс в списке возгласов
 *  перевода (длинные серии делят последний), -1 — без возгласа */
export const cheerIndex = (streak: number, count: number) =>
  count > 0 && streak >= 5 && streak % 5 === 0 ? Math.min(streak / 5, count) - 1 : -1;
