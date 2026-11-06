import { ReactNode } from "react";

type RingTone = "accent" | "success" | "info" | "special";

const TONES: Record<RingTone, string> = {
  accent: "stroke-accent",
  success: "stroke-success",
  info: "stroke-info",
  special: "stroke-special",
};

// Кольцо прогресса — фирменный элемент «Орбиты» (коло = круг повторения).
// value от 0 до 1; в центр можно положить число или иконку.
export function Ring({
  value,
  size = 44,
  stroke = 5,
  tone = "accent",
  track = "default",
  label,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: RingTone;
  track?: "default" | "inverse"; // inverse — на bg-fg, где обычная дорожка слишком яркая
  label: string; // подпись для скринридера: «18 из 25 слов на сегодня»
  children?: ReactNode;
}) {
  const v = Math.min(1, Math.max(0, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={track === "inverse" ? "stroke-on-inverse/15" : "stroke-track"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={TONES[tone]}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
    </div>
  );
}
