import { ReactNode } from "react";
import { Card, Heading, Text, cx } from "../../ui";

// Общие блоки внутренних страниц «Другого» (настройки, данные, поддержка, обновления, Dakuta) —
// чтобы страницы не могли разъехаться по виду.

export function PageHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <header className="grid gap-2">
      <Heading size={1}>{title}</Heading>
      {subtitle && <Text tone="muted">{subtitle}</Text>}
    </header>
  );
}

// Карточка-секция: заголовок, пояснение, содержимое
export function Section({
  title,
  description,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card padding="lg" className={cx("grid grid-cols-1 gap-5", className)}>
      <div className="grid gap-1">
        <Heading size={3} as="h2">
          {title}
        </Heading>
        {description && (
          <Text size="sm" tone="muted">
            {description}
          </Text>
        )}
      </div>
      {children}
    </Card>
  );
}

// Строка «текст слева — переключатель или кнопка справа»
export function SettingRow({ title, description, control }: { title: ReactNode; description?: ReactNode; control: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="grid min-w-0 gap-0.5">
        <p className="font-semibold text-fg">{title}</p>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

// Плитка выбора одного варианта: тема, язык, цель, тема обращения
export function OptionButton({
  active,
  onClick,
  className,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "rounded-2xl border text-sm font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-surface text-muted hover:bg-inset hover:text-fg",
        className,
      )}
    >
      {children}
    </button>
  );
}
