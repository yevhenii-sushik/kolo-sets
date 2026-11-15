import { ReactNode, useEffect, useState } from "react";
import { Spinner } from "./Spinner";
import { cx } from "./cx";

// Через сколько миллисекунд показывать индикатор. Ответ из кэша приходит быстрее —
// тогда скелетон или спиннер не мигнёт вовсе, а пользователь сразу увидит содержимое
export const LOADING_DELAY = 200;

// true, когда с монтирования прошло delay мс
export function useDelayed(delay = LOADING_DELAY): boolean {
  const [on, setOn] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const timer = setTimeout(() => setOn(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return on;
}

// Заготовка блока: форма будущего содержимого без текста. Сама не пульсирует — пульсирует
// весь <Loading> разом, чтобы блоки не мерцали вразнобой. surface — карточка с рамкой, inset — полоса.
// inline — полоса внутри строки текста (<span>), например вместо числа, которое ещё считается
export function Skeleton({
  tone = "inset",
  inline = false,
  className,
}: {
  tone?: "inset" | "surface";
  inline?: boolean;
  className?: string;
}) {
  const Tag = inline ? "span" : "div";
  return (
    <Tag
      aria-hidden
      className={cx(
        "rounded-lg",
        inline && "inline-block align-middle",
        tone === "surface" ? "border border-line bg-surface" : "bg-inset",
        className,
      )}
    />
  );
}

// Состояние загрузки. Скринридер узнаёт о нём сразу (role="status" + скрытая подпись), а глазу
// индикатор виден только после delay. Место под скелетоном занято с первого кадра — когда
// содержимое придёт, страница не прыгнет. Без children — спиннер по центру.
// Пульсация — только если пользователь не просил уменьшить движение (motion-safe)
export function Loading({
  label,
  delay = LOADING_DELAY,
  className,
  children,
}: {
  label: string;
  delay?: number;
  className?: string;
  children?: ReactNode;
}) {
  const visible = useDelayed(delay);
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div
        aria-hidden
        className={cx(
          "motion-safe:transition-opacity motion-safe:duration-300",
          visible ? "opacity-100" : "opacity-0",
          !children && "flex justify-center py-16 text-muted",
        )}
      >
        {children ? <div className="motion-safe:animate-pulse">{children}</div> : <Spinner size={24} />}
      </div>
    </div>
  );
}
