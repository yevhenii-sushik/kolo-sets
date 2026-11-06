import { ReactNode, useEffect, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { IconButton } from "./Button";
import { cx } from "./cx";

// Модальное окно: затемнение, закрытие по Esc и клику мимо, на телефоне — снизу
export function Modal({
  open,
  onClose,
  title,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const { t } = useI18n();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 300 }}
            className={cx(
              "relative w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-4xl bg-surface border border-line shadow-2xl p-6 sm:p-7",
              size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md",
            )}
          >
            <IconButton label={t.close} size="sm" onClick={onClose} className="absolute top-4 right-4">
              <X size={18} />
            </IconButton>
            {title && (
              <h2 id={titleId} className="pr-10 mb-4 font-display font-extrabold text-xl text-fg text-balance">
                {title}
              </h2>
            )}
            {children}
            {footer && <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
