import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { Link, LinkProps } from "react-router-dom";
import { cx } from "./cx";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "inverse" | "secondary" | "soft" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

// primary — главное действие экрана (одно на экран); inverse — сильное нейтральное;
// secondary — второстепенное; soft — тихий акцент; ghost — в панелях и списках;
// danger — удаление и необратимые действия
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  inverse: "bg-fg text-on-inverse hover:opacity-90",
  secondary: "bg-surface text-fg border border-line hover:bg-inset",
  soft: "bg-accent-soft text-accent-ink hover:bg-accent/15",
  ghost: "text-muted hover:text-fg hover:bg-inset",
  danger: "bg-danger-soft text-danger hover:bg-danger/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 gap-1.5 text-sm",
  md: "h-11 px-5 gap-2 text-sm",
  lg: "h-13 px-7 gap-2.5 text-base",
};

interface StyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

// Классы кнопки — для случаев, когда нужен не <button>, а другой элемент
export function buttonStyles({ variant = "primary", size = "md", fullWidth = false }: StyleOptions = {}) {
  return cx(
    "inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap select-none",
    "transition-[background-color,color,opacity,transform] duration-150 active:scale-[0.98]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleOptions {
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, iconLeft, iconRight, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonStyles({ variant, size, fullWidth }), className)}
      {...rest}
    >
      {loading ? <Spinner size={size === "lg" ? 18 : 16} /> : iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps, StyleOptions {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

// Ссылка, которая выглядит как кнопка (переход по маршруту)
export function ButtonLink({ variant, size, fullWidth, iconLeft, iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={cx(buttonStyles({ variant, size, fullWidth }), className)} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}

type IconButtonVariant = "ghost" | "surface" | "soft";

const ICON_VARIANTS: Record<IconButtonVariant, string> = {
  ghost: "text-muted hover:text-fg hover:bg-inset",
  surface: "bg-surface text-fg border border-line hover:bg-inset",
  soft: "bg-accent-soft text-accent-ink hover:bg-accent/15",
};

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // обязательная подпись для скринридера: у кнопки нет текста
  variant?: IconButtonVariant;
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = "ghost", size = "md", className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center rounded-full shrink-0 transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:opacity-50 disabled:pointer-events-none",
        size === "sm" ? "w-9 h-9" : "w-11 h-11",
        ICON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
