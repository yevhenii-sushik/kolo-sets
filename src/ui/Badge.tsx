import { HTMLAttributes } from "react";
import { cx } from "./cx";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "special";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-inset text-muted",
  accent: "bg-accent-soft text-accent-ink",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  special: "bg-special-soft text-special",
};

// Короткая метка состояния: «8 слов», «Скоро», «Новое»
export function Badge({ tone = "neutral", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold leading-none", TONES[tone], className)}
      {...rest}
    />
  );
}
