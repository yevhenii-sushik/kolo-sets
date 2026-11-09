import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Spinner, cx } from "../../ui";

// Сгруппированный список настроек (как в системных настройках телефона): группы-карточки
// со строками, подпись группы сверху, пояснение снизу. Одна строка — одна настройка

export type RowTone = "accent" | "info" | "special" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<RowTone, string> = {
  accent: "bg-accent-soft text-accent-ink",
  info: "bg-info-soft text-info",
  special: "bg-special-soft text-special",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-inset text-muted",
};

export function SettingsGroup({
  id,
  title,
  footnote,
  children,
}: {
  id?: string;
  title?: ReactNode;
  footnote?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="grid scroll-mt-24 gap-2">
      {title && <h2 className="px-4 text-sm font-semibold text-muted">{title}</h2>}
      <div className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">{children}</div>
      {footnote && <p className="px-4 text-xs leading-relaxed text-faint">{footnote}</p>}
    </section>
  );
}

// Строка: иконка, название (и пояснение), справа — значение со стрелкой или элемент управления.
// onClick — строка-кнопка, to — строка-ссылка; control — переключатель или поле справа;
// below — элемент управления под названием (на телефоне не помещается справа)
export function SettingsRow({
  icon,
  tone = "neutral",
  title,
  description,
  value,
  control,
  below,
  onClick,
  to,
  loading,
  danger,
  disabled,
}: {
  icon?: ReactNode;
  tone?: RowTone;
  title: ReactNode;
  description?: ReactNode;
  value?: ReactNode;
  control?: ReactNode;
  below?: ReactNode;
  onClick?: () => void;
  to?: string;
  loading?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const interactive = !!onClick || !!to;
  const body = (
    <>
      {icon && (
        <span aria-hidden className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-lg", TONES[danger ? "danger" : tone])}>
          {icon}
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5 text-left">
        <span className={cx("font-medium", danger ? "text-danger" : "text-fg")}>{title}</span>
        {description && <span className="text-sm leading-snug text-muted">{description}</span>}
      </span>
      {value !== undefined && <span className="min-w-0 max-w-[45%] shrink-0 truncate text-right text-sm text-muted">{value}</span>}
      {control && <span className="shrink-0">{control}</span>}
      {loading ? (
        <Spinner size={16} />
      ) : (
        interactive && <ChevronRight aria-hidden size={18} className="-mr-1 shrink-0 text-faint" />
      )}
    </>
  );

  const row = "flex min-h-14 w-full items-center gap-3 px-4 py-3";
  const hover = "transition-colors hover:bg-inset focus-visible:bg-inset focus-visible:outline-none disabled:opacity-50";

  if (to) {
    return (
      <Link to={to} className={cx(row, hover)}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled || loading} className={cx(row, hover)}>
        {body}
      </button>
    );
  }
  return (
    <div className="grid gap-3 px-4 py-3">
      <div className="flex min-h-8 w-full items-center gap-3">{body}</div>
      {below}
    </div>
  );
}

// Переключатель на 2–4 варианта (тема): компактная замена плиткам
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-2xl bg-inset p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
              active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
            )}
          >
            {o.icon && <span className="hidden sm:contents">{o.icon}</span>}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
