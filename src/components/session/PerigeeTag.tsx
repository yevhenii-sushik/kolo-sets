import { PerigeeMark, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

// Пометка «к режиму подключён Perigee»: ответы здесь идут в расписание повторений (docs/specs/perigee.md).
// compact — только знак (строка под режимами в окне выбора), иначе знак и название (в шапке тренировки)
export default function PerigeeTag({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const hint = t.words.perigee.tagHint;
  if (compact) {
    return (
      <span title={hint} className={cx("inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink", className)}>
        <PerigeeMark size={13} tone="mono" label={hint} />
      </span>
    );
  }
  return (
    <span
      title={hint}
      className={cx("inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-ink", className)}
    >
      <PerigeeMark size={12} tone="mono" />
      Perigee
      <span className="sr-only">{hint}</span>
    </span>
  );
}
