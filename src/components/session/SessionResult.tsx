import { ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button, Modal, Text, cx } from "../../ui";

const TILE_TONES = {
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
};

const VALUE_TONES = { default: "text-fg", success: "text-success", danger: "text-danger", info: "text-info", accent: "text-accent-ink" };

export interface ResultMetric {
  label: string;
  value: ReactNode;
  tone?: keyof typeof VALUE_TONES;
}

// Итог тренировки или игры: иконка, заголовок, цифры, «Выйти» и «Ещё раз». Esc и клик мимо — выход
export default function SessionResult({
  open,
  icon,
  tone = "accent",
  title,
  subtitle,
  metrics,
  children,
  againLabel,
  exitLabel,
  onAgain,
  onExit,
  size,
}: {
  open: boolean;
  icon: ReactNode;
  tone?: keyof typeof TILE_TONES;
  title: ReactNode;
  subtitle?: ReactNode;
  metrics: ResultMetric[];
  children?: ReactNode;
  againLabel: string;
  exitLabel: string;
  onAgain: () => void;
  onExit: () => void;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <Modal
      open={open}
      onClose={onExit}
      size={size ?? (children ? "md" : "sm")}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onExit}>
            {exitLabel}
          </Button>
          <Button fullWidth iconLeft={<RotateCcw size={18} />} onClick={onAgain}>
            {againLabel}
          </Button>
        </>
      }
    >
      <div className="grid justify-items-center gap-3 pt-2 text-center">
        <span className={cx("grid h-14 w-14 place-items-center rounded-2xl", TILE_TONES[tone])}>{icon}</span>
        <h2 className="font-display text-3xl font-extrabold text-fg">{title}</h2>
        {subtitle && (
          <Text size="sm" tone="muted">
            {subtitle}
          </Text>
        )}
      </div>
      <div className={cx("mt-6 grid gap-2", metrics.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : metrics.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl bg-inset px-3 py-3 text-center">
            <p className={cx("font-display text-2xl font-extrabold tabular-nums", VALUE_TONES[m.tone ?? "default"])}>{m.value}</p>
            <p className="mt-0.5 text-xs text-muted">{m.label}</p>
          </div>
        ))}
      </div>
      {children && <div className="mt-5">{children}</div>}
    </Modal>
  );
}
