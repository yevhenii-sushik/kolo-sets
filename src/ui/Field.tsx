import { forwardRef, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

// Подпись, подсказка и ошибка вокруг поля. Ошибка заменяет подсказку.
export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("grid content-start gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-faint">{hint}</p>
      )}
    </div>
  );
}

// 16px текста — чтобы iOS не увеличивал страницу при фокусе
const CONTROL = cx(
  "w-full rounded-2xl bg-inset text-base text-fg placeholder:text-hint",
  "border border-transparent outline-none transition-colors",
  "focus:border-accent focus:bg-surface",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: ReactNode;
  trailing?: ReactNode; // например, кнопка «показать пароль»
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { iconLeft, trailing, invalid, className, ...rest },
  ref,
) {
  return (
    <div className={cx("relative flex items-center", className)}>
      {iconLeft && <span className="pointer-events-none absolute left-4 text-faint">{iconLeft}</span>}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cx(CONTROL, "h-12 px-4", Boolean(iconLeft) && "pl-11", Boolean(trailing) && "pr-12", invalid && "border-danger")}
        {...rest}
      />
      {trailing && <span className="absolute right-1.5 flex items-center">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ invalid, className, rows = 4, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cx(CONTROL, "px-4 py-3 resize-y leading-relaxed", invalid && "border-danger", className)}
        {...rest}
      />
    );
  },
);

// Нативный список: на телефоне открывается системный выбор — удобнее самописного
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={cx("relative", className)}>
      <select ref={ref} className={cx(CONTROL, "h-12 appearance-none pl-4 pr-11")} {...rest}>
        {children}
      </select>
      <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-faint" />
    </div>
  );
});

export function Checkbox({ label, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return (
    <label className={cx("flex items-start gap-3 cursor-pointer", className)}>
      <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-accent cursor-pointer" {...rest} />
      <span className="text-sm text-muted leading-snug">{label}</span>
    </label>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (value: boolean) => void;
  disabled?: boolean;
  label: string; // подпись для скринридера
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        "relative w-11 h-6 shrink-0 rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-accent" : "bg-track",
      )}
    >
      <span
        className={cx(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface shadow-sm transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}
