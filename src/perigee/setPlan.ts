// План набора (docs/specs/perigee.md, «План набора и темп новых слов»). Чистые функции.
//
// Большой набор пугает: 300 слов и непонятно, сколько ещё. План показывает, где набор сейчас (слова по
// силе памяти — те же ступени, что точки на карточке) и когда все новые слова будут в работе при выбранном
// темпе. Срок «выучено» не обещаем: он зависит от ответов, а не от календаря.

import { Card } from "../types";
import { isDueAt, isNewCard, memoryStrength } from "../utils/srs";

export interface SetPlan {
  total: number;
  strong: number; // интервал от месяца
  growing: number; // от недели
  learning: number; // меньше недели
  fresh: number; // ещё не начаты
  due: number; // к повторению сегодня
}

export function setPlan(cards: Card[], now: Date = new Date()): SetPlan {
  const plan: SetPlan = { total: cards.length, strong: 0, growing: 0, learning: 0, fresh: 0, due: 0 };
  for (const card of cards) {
    if (isDueAt(card, now)) plan.due += 1;
    if (isNewCard(card)) {
      plan.fresh += 1;
      continue;
    }
    const s = memoryStrength(card);
    if (s === 3) plan.strong += 1;
    else if (s === 2) plan.growing += 1;
    else plan.learning += 1;
  }
  return plan;
}

/**
 * Через сколько дней все новые слова набора будут в работе, если учить его каждый день. leftToday —
 * сколько новых ещё можно начать сегодня (лимит общий на курс), dailyNew — темп. 0 — помещаются в сегодня
 */
export function daysToStart(fresh: number, leftToday: number, dailyNew: number): number {
  if (fresh <= Math.max(0, leftToday)) return 0;
  return Math.ceil((fresh - Math.max(0, leftToday)) / Math.max(1, dailyNew));
}
