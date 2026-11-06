import { HTMLAttributes } from "react";
import { cx } from "./cx";

type AlertTone = "danger" | "success" | "info" | "warning";

const TONES: Record<AlertTone, string> = {
  danger: "bg-danger-soft text-danger border-danger/20",
  success: "bg-success-soft text-success border-success/20",
  info: "bg-info-soft text-info border-info/20",
  warning: "bg-warning-soft text-warning border-warning/20",
};

// Сообщение над формой или в блоке: ошибка, успех, подсказка. Ошибку скринридер зачитывает сразу.
export function Alert({ tone = "danger", className, ...rest }: HTMLAttributes<HTMLDivElement> & { tone?: AlertTone }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("rounded-2xl border px-4 py-3 text-sm font-medium leading-snug", TONES[tone], className)}
      {...rest}
    />
  );
}
