import { cx } from "../../ui";

// Лист ответов в шапке тренировки вместо полосы прогресса — общий для теста, флэшкарт и сессии Perigee
// (режимы выглядят одной семьёй). Клетка на слово: цвет — итог (верно / ошибка, во флэшкартах — оценка),
// светлая — текущее, серые — впереди. Видно, как складывается результат. Для длинного захода — обычная полоса
export const SHEET_MAX = 30;

export type SheetTone = "success" | "info" | "warning" | "danger";

const TONES: Record<SheetTone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
};

export default function AnswerSheet({ marks, total, current, label }: { marks: (SheetTone | undefined)[]; total: number; current: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={marks.filter(Boolean).length} className="flex flex-1 gap-1">
      {Array.from({ length: total }, (_, i) => {
        const tone = marks[i];
        return (
          <span
            key={i}
            className={cx("h-2 flex-1 rounded-full transition-colors duration-300", tone ? TONES[tone] : i === current ? "bg-accent/40" : "bg-track")}
          />
        );
      })}
    </div>
  );
}
