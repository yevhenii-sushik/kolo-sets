import { KnowledgeLevel } from "../../types";

// Через сколько слово вернётся: «ещё раз», «1 д», «3 мес», «2 г» — коротко, чтобы влезло под оценку
// и в подпись свайпа на карточке. 0 — ещё раз в этой тренировке
export interface IntervalStrings {
  again: string;
  days: string;
  months: string;
  years: string;
}

export function intervalLabel(days: number, s: IntervalStrings): string {
  if (days <= 0) return s.again;
  if (days < 30) return s.days.replace("{n}", String(days));
  if (days < 365) return s.months.replace("{n}", String(Math.round(days / 30.4)));
  return s.years.replace("{n}", String(Math.round(days / 365)));
}

// Свайп после переворота. Вправо — «Помню», а не «Знаю»: самый ленивый жест не должен давать самую
// сильную оценку (×1,3 к интервалу и рост лёгкости). «Знаю» — только кнопкой или клавишей 4
export const SWIPE = { left: KnowledgeLevel.DONT_KNOW, right: KnowledgeLevel.REMEMBER } as const;

// Подписи, которые проступают на карточке, пока её тянешь: «Помню · 6 д», «Не знаю · ещё раз»
export function swipeLabels(
  s: { levels: { dontKnow: string; remember: string }; interval: IntervalStrings },
  previews?: Record<KnowledgeLevel, number>,
): { left: string; right: string } {
  const label = (name: string, level: KnowledgeLevel) => (previews ? `${name} · ${intervalLabel(previews[level], s.interval)}` : name);
  return { left: label(s.levels.dontKnow, SWIPE.left), right: label(s.levels.remember, SWIPE.right) };
}
