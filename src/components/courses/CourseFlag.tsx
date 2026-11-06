import { courseFlag } from "../../courses/languages";
import { cx } from "../../ui";

const SIZES = {
  sm: "h-6 w-6 text-sm",
  md: "h-9 w-9 text-xl",
  lg: "h-12 w-12 text-2xl",
};

// Флаг курса в круге; у языков без «своей» страны (эсперанто, латынь…) — буквы кода
export default function CourseFlag({
  code,
  voice,
  size = "md",
  className,
}: {
  code: string;
  voice?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const flag = courseFlag(code, voice);
  return (
    <span
      aria-hidden
      className={cx(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-inset leading-none",
        SIZES[size],
        !flag && "font-display font-extrabold uppercase text-muted",
        className,
      )}
    >
      {flag ?? <span className={size === "sm" ? "text-2xs" : "text-xs"}>{code.slice(0, 2)}</span>}
    </span>
  );
}
