import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

// Капсула: шар ночного синего в оранжевом кольце-орбите — тот же образ, что знак Kolo.
// shake — капсулу трясёт перед открытием, glow — свечение (празднование, готова к открытию)
export function CapsuleArt({ size = 120, shake = false, glow = false }: { size?: number; shake?: boolean; glow?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      aria-hidden
      animate={shake && !reduce ? { rotate: [0, -8, 8, -6, 6, -3, 3, 0], scale: [1, 1.04, 1.04, 1.06, 1.06, 1.08, 1.08, 1.1] } : { rotate: 0, scale: 1 }}
      transition={shake ? { duration: 0.9, repeat: Infinity } : { duration: 0.3 }}
    >
      <defs>
        <radialGradient id={`b${uid}`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#3A4270" />
          <stop offset="55%" stopColor="#1A1F3A" />
          <stop offset="100%" stopColor="#0B0E19" />
        </radialGradient>
        <radialGradient id={`g${uid}`}>
          <stop offset="45%" stopColor="#FF5A1F" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow && <circle cx="60" cy="60" r="60" fill={`url(#g${uid})`} />}
      {/* задняя половина орбиты */}
      <ellipse cx="60" cy="60" rx="52" ry="16" fill="none" stroke="#FF5A1F" strokeWidth="5" opacity="0.55" transform="rotate(-22 60 60)" />
      <circle cx="60" cy="60" r="34" fill={`url(#b${uid})`} />
      {/* шов капсулы и блик */}
      <path d="M 27 62 Q 60 74 93 62" fill="none" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="2" />
      <ellipse cx="48" cy="44" rx="10" ry="6" fill="#FFFFFF" opacity="0.18" transform="rotate(-25 48 44)" />
      <circle cx="60" cy="60" r="5" fill="#FF5A1F" />
      {/* передняя половина орбиты и спутник на ней */}
      <path d="M 8 60 A 52 16 0 0 0 112 60" fill="none" stroke="#FF5A1F" strokeWidth="5" strokeLinecap="round" transform="rotate(-22 60 60)" />
      <circle cx="21" cy="84" r="6" fill="#FFFFFF" />
    </motion.svg>
  );
}
