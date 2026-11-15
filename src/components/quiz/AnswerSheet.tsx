import { cx } from "../../ui";

// Лист ответов теста вместо полосы прогресса (docs/specs/perigee.md, «Тест: честный ответ и карточка
// вопроса»): по сегменту на вопрос — верно, ошибка, текущий, впереди. Видно, как складывается результат,
// а счётчики «верно / ошибок» в шапке больше не нужны. Для длинного теста — обычная полоса
export const SHEET_MAX = 30;

export default function AnswerSheet({ results, current, label }: { results: (boolean | undefined)[]; current: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={results.length} aria-valuenow={results.filter((r) => r !== undefined).length} className="flex flex-1 gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          className={cx(
            "h-2 flex-1 rounded-full transition-colors duration-300",
            r === true ? "bg-success" : r === false ? "bg-danger" : i === current ? "bg-accent/40" : "bg-track",
          )}
        />
      ))}
    </div>
  );
}
