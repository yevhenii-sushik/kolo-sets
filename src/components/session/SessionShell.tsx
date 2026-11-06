import { ReactNode } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { IconButton, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

const BAR_TONES = { accent: "bg-accent", success: "bg-success", danger: "bg-danger" };

// Оболочка тренировки на весь экран: закрыть, название, действие справа, полоса прогресса.
// Общая для флэшкарт, теста, повторения и игр — чтобы все режимы выглядели одной семьёй.
export default function SessionShell({
  title,
  subtitle,
  onClose,
  action,
  progress,
  progressTone = "accent",
  meta,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  action?: ReactNode;
  progress?: number; // 0..1; без него полосы нет
  progressTone?: keyof typeof BAR_TONES;
  meta?: ReactNode; // справа от полосы: «3 / 8», таймер, счёт
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 flex flex-col overflow-hidden bg-bg">
      <header className="shrink-0 px-4 pt-3 sm:px-6">
        <div className="mx-auto grid max-w-3xl gap-2">
          <div className="flex items-center gap-2">
            <IconButton label={t.close} onClick={onClose} className="-ml-2">
              <X size={22} />
            </IconButton>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-semibold text-fg">{title}</h1>
              {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
            </div>
            {action}
          </div>
          {(progress !== undefined || meta) && (
            <div className={cx("flex items-center gap-3 pb-1", progress === undefined && "justify-end")}>
              {progress !== undefined && (
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
                  <div
                    className={cx("h-full rounded-full transition-[width] duration-500 ease-out", BAR_TONES[progressTone])}
                    style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
                  />
                </div>
              )}
              {meta && <div className="flex shrink-0 items-center gap-3 text-sm font-semibold tabular-nums text-muted">{meta}</div>}
            </div>
          )}
        </div>
      </header>
      {children}
    </motion.div>
  );
}
