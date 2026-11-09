import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RingArt, SatelliteArt } from "./ItemArt";

// Аватар в кольце (docs/specs/02-progression.md → «Предметы»): кольцо всегда полное, в цветах надетой
// раскраски, по нему летают надетые спутники (до трёх, на равном расстоянии). Уровень и опыт — отдельной
// полосой в профиле, не на аватаре
export function AvatarFrame({
  size = 112,
  ring,
  satellites = [],
  label,
  children,
}: {
  size?: number;
  ring?: string;
  satellites?: string[];
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
      <RingArt id={ring} size={size} stroke={5} className="absolute inset-0" />
      <div className="overflow-hidden rounded-full" style={{ width: size - 16, height: size - 16 }}>
        {children}
      </div>

      {satellites.length > 0 && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ rotate: -40 }}
          animate={reduce ? undefined : { rotate: 320 }}
          transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
        >
          {satellites.map((id, i) => (
            <div key={id} className="absolute inset-0" style={{ transform: `rotate(${(360 / satellites.length) * i}deg)` }}>
              <span className="absolute left-1/2 -translate-x-1/2 drop-shadow-md" style={{ top: -sat / 2 + 2.5 }}>
                <SatelliteArt id={id} size={sat} />
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
