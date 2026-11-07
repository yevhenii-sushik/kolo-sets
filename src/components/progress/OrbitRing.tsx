import type { ReactNode } from "react";
import { cx } from "../../ui";

// Кольцо недели (docs/specs/02-progression.md): точки на орбите — цель, закрашенные — засчитанные дни.
// Дуга соединяет засчитанные точки; когда орбита замкнута, кольцо смыкается целиком.
export function OrbitRing({
  goal,
  done,
  closed,
  size = 24,
  label,
  children,
  className,
}: {
  goal: number;
  done: number;
  closed: boolean;
  size?: number;
  label?: string; // без подписи кольцо декоративное (рядом есть текст)
  children?: ReactNode;
  className?: string;
}) {
  const dot = Math.max(2.25, size / 11);
  const stroke = Math.max(1.5, size / 16);
  const r = size / 2 - dot - 0.5;
  const c = 2 * Math.PI * r;
  const filled = Math.min(done, goal);
  const arc = closed ? 1 : Math.max(0, filled - 1) / goal;
  const mid = size / 2;

  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={mid} cy={mid} r={r} fill="none" strokeWidth={stroke} className="stroke-track" />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - arc)}
          transform={`rotate(-90 ${mid} ${mid})`}
          className="stroke-accent"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        {Array.from({ length: goal }, (_, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / goal;
          return (
            <circle
              key={i}
              cx={mid + r * Math.cos(a)}
              cy={mid + r * Math.sin(a)}
              r={dot}
              className={i < filled || closed ? "fill-accent" : "fill-track"}
              style={{ transition: "fill 0.3s ease" }}
            />
          );
        })}
      </svg>
      {children && <span className="absolute inset-0 grid place-items-center">{children}</span>}
    </span>
  );
}
