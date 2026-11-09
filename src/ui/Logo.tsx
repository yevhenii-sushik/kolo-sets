import { cx } from "./cx";

// Знак Kolo «Орбита»: кольцо и спутник — слово уходит на орбиту и возвращается, когда его пора повторить.
// Геометрия в квадрате 100×100: кольцо R 42 / r 26, спутник r 10 на средней линии под углом −45°,
// вокруг него вырез r 15. Те же фигуры — в public/favicon.svg и PNG-иконках приложения.
export const MARK_RING =
  "M87.85 31.81A42 42 0 1 1 68.19 12.15A15 15 0 0 0 59.05 25.62A26 26 0 1 0 74.38 40.95A15 15 0 0 0 87.85 31.81Z";
export const MARK_DOT = { cx: 74.04, cy: 25.96, r: 10 };

// brand — на обычном фоне; inverse — на bg-fg (инверсные блоки); night — на bg-brand-night,
// который тёмный в обеих темах (подвал сайта); mono — один цвет от текста вокруг (на оранжевом)
type LogoTone = "brand" | "inverse" | "night" | "mono";

const RING: Record<LogoTone, string> = {
  brand: "fill-accent",
  inverse: "fill-accent",
  night: "fill-brand-orange",
  mono: "fill-current",
};
const DOT: Record<LogoTone, string> = { brand: "fill-fg", inverse: "fill-on-inverse", night: "fill-white", mono: "fill-current" };
const TEXT: Record<LogoTone, string> = { brand: "text-fg", inverse: "text-on-inverse", night: "text-white", mono: "" };

// Спутник делает оборот при наведении на ближайший родитель с классом group (обычно ссылка на главную)
const ORBIT_ON_HOVER =
  "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-in-out group-hover:rotate-[360deg]";

export function LogoMark({
  size = 32,
  tone = "brand",
  label,
  className,
}: {
  size?: number;
  tone?: LogoTone;
  label?: string; // только если знак стоит один, без надписи и подписанной ссылки
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="7 7 86 86"
      className={cx("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <path d={MARK_RING} className={RING[tone]} />
      <circle {...MARK_DOT} className={DOT[tone]} />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 22, text: "text-base", gap: "gap-2" },
  md: { mark: 30, text: "text-xl", gap: "gap-2.5" },
  lg: { mark: 44, text: "text-3xl", gap: "gap-3" },
};

// Логотип: знак + «kolo». В заголовках страниц и превью — «Kolo» (src/design/README.md → «Название»).
export function Logo({ size = "md", tone = "brand", className }: { size?: keyof typeof SIZES; tone?: LogoTone; className?: string }) {
  const s = SIZES[size];
  return (
    <span
      className={cx(
        "inline-flex items-center font-display font-extrabold tracking-tight leading-none whitespace-nowrap",
        s.gap,
        s.text,
        TEXT[tone],
        className,
      )}
    >
      <LogoMark size={s.mark} tone={tone} className={ORBIT_ON_HOVER} />
      kolo
    </span>
  );
}

// Иконка приложения: знак на ночном квадрате — как на домашнем экране. Цвета не зависят от темы.
export function AppIcon({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className={cx("shrink-0", className)}>
      <rect width="100" height="100" rx="22.4" className="fill-brand-night" />
      <g transform="translate(15.5 15.5) scale(0.69)">
        <path d={MARK_RING} className="fill-brand-orange" />
        <circle {...MARK_DOT} className="fill-white" />
      </g>
    </svg>
  );
}
