import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RingArt, SatelliteArt } from "./ItemArt";

// Аватар в кольце (docs/specs/02-progression.md → «Предметы»): дуга — опыт до следующего уровня в цветах
// надетой раскраски, по кольцу летает надетый спутник, снизу — номер уровня
export function AvatarFrame({
  size = 112,
  progress,
  ring,
  satellite,
  level,
  label,
  children,
}: {
  size?: number;
  progress: number; // 0…1
  ring?: string;
  satellite?: string;
  level?: number;
  label: string;
  children: ReactNode; // сам аватар
}) {
  const reduce = useReducedMotion();
  const sat = Math.round(size * 0.26);
  return (
    <div
      role="img"
      aria-label={label}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <RingArt id={ring} size={size} stroke={5} value={progress} className="absolute inset-0" />
      <div className="overflow-hidden rounded-full" style={{ width: size - 16, height: size - 16 }}>
        {children}
      </div>

      {satellite && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ rotate: -40 }}
          animate={reduce ? undefined : { rotate: 320 }}
          transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
        >
          <span className="absolute left-1/2 -translate-x-1/2 drop-shadow-md" style={{ top: -sat / 2 + 2.5 }}>
            <SatelliteArt id={satellite} size={sat} />
          </span>
        </motion.div>
      )}

      {level !== undefined && (
        <span
          aria-hidden
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border-2 border-surface bg-fg px-2.5 py-0.5 font-display text-sm font-extrabold tabular-nums text-on-inverse"
        >
          {level}
        </span>
      )}
    </div>
  );
}
