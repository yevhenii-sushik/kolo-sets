import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const STREAK_CELEBRATION_EVENT = "kolo:streak-extended";

// Global host: listens for the event and renders the celebration.
// Must be mounted at App level — study pages (EmptyLayout routes) dispatch
// the event while MainLayout is unmounted.
export function StreakCelebrationHost() {
  const [state, setState] = useState({ open: false, streak: 0 });

  useEffect(() => {
    const handler = (e: Event) => {
      const streak = (e as CustomEvent<{ streak: number }>).detail?.streak ?? 1;
      setState({ open: true, streak });
    };
    window.addEventListener(STREAK_CELEBRATION_EVENT, handler);
    return () => window.removeEventListener(STREAK_CELEBRATION_EVENT, handler);
  }, []);

  return (
    <StreakCelebration
      isOpen={state.open}
      streak={state.streak}
      onClose={() => setState((s) => ({ ...s, open: false }))}
    />
  );
}

// Deterministic sparks — 42 particles in varying sizes, angles, colors, distances
const SPARKS = Array.from({ length: 42 }, (_, i) => {
  const colors = ["#FF5733", "#FF8C00", "#FFB800", "#FFF0ED", "#FF3D00", "#FFCC00"];
  const angle = (i / 42) * 360 + (i % 3) * 4;
  return {
    id: i,
    angle,
    dist: 100 + (i % 5) * 38,
    color: colors[i % colors.length],
    size: 5 + (i % 5) * 2.5,
    delay: (i % 9) * 0.025,
    duration: 0.7 + (i % 4) * 0.15,
  };
});

// 3 expanding shockwave rings
const RINGS = [
  { delay: 0,    scale: 5,   duration: 1.0 },
  { delay: 0.18, scale: 7,   duration: 1.2 },
  { delay: 0.35, scale: 9.5, duration: 1.4 },
];

interface Props {
  isOpen: boolean;
  streak: number;
  onClose: () => void;
}

function Spark({ angle, dist, color, size, delay, duration }: (typeof SPARKS)[0]) {
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * dist;
  const y = Math.sin(rad) * dist;

  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: `0 0 ${size * 2.5}px ${color}80`,
        pointerEvents: "none",
      }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
      animate={{
        x: [0, x * 0.6, x],
        y: [0, y * 0.6, y],
        scale: [0, 1.8, 0],
        opacity: [1, 1, 0],
      }}
      transition={{ duration, delay, ease: "easeOut" }}
    />
  );
}

export default function StreakCelebration({ isOpen, streak, onClose }: Props) {
  // Auto-dismiss after 4s
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className="fixed inset-0 z-[500] flex items-center justify-center overflow-hidden"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,87,51,0.18) 0%, rgba(26,23,20,0.92) 70%)",
            }}
          />

          {/* Deep glow orb behind content */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255,87,51,0.35) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Shockwave rings */}
          {RINGS.map((ring, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-[#FF5733]/50 pointer-events-none"
              style={{ width: 96, height: 96 }}
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: ring.scale, opacity: 0 }}
              transition={{
                duration: ring.duration,
                delay: ring.delay,
                ease: "easeOut",
              }}
            />
          ))}

          {/* Spark particles */}
          {SPARKS.map((spark) => (
            <Spark key={spark.id} {...spark} />
          ))}

          {/* Main content */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 18, stiffness: 140, delay: 0.05 }}
            className="relative flex flex-col items-center gap-2 select-none pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header label */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: "0.1em" }}
              animate={{ opacity: 1, letterSpacing: "0.35em" }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-[#FF5733] text-[11px] font-black uppercase"
            >
              ударный режим
            </motion.p>

            {/* Fire + Number row */}
            <div className="flex items-center gap-4">
              {/* Left fire */}
              <motion.span
                initial={{ x: -60, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 80, delay: 0.2 }}
                className="text-6xl"
                style={{ filter: "drop-shadow(0 0 20px rgba(255,140,0,0.8))" }}
              >
                🔥
              </motion.span>

              {/* Streak number */}
              <motion.span
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: [0, 1.5, 1.25, 1.35, 1.3], rotate: [0, 0] }}
                transition={{
                  type: "spring",
                  damping: 8,
                  stiffness: 70,
                  delay: 0.28,
                }}
                className="font-black leading-none"
                style={{
                  fontSize: "clamp(100px, 22vw, 140px)",
                  color: "#FF5733",
                  textShadow:
                    "0 0 40px rgba(255,87,51,0.7), 0 0 100px rgba(255,87,51,0.35)",
                  WebkitTextStroke: "2px rgba(255,255,255,0.15)",
                }}
              >
                {streak}
              </motion.span>

              {/* Right fire */}
              <motion.span
                initial={{ x: 60, opacity: 0, scale: 0.5 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 10, stiffness: 80, delay: 0.2 }}
                className="text-6xl"
                style={{ filter: "drop-shadow(0 0 20px rgba(255,140,0,0.8))" }}
              >
                🔥
              </motion.span>
            </div>

            {/* "дней подряд!" */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="text-white text-3xl font-black tracking-tight"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}
            >
              {streak === 1 ? "первый день!" : "дней подряд!"}
            </motion.p>

            {/* Sub-text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-white text-[13px] font-medium mt-1"
            >
              {streak >= 30
                ? "Невероятно! Ты легенда 🏆"
                : streak >= 14
                ? "Ты на огне! Не останавливайся 💪"
                : streak >= 7
                ? "Отличная неделя! Так держать!"
                : "Продолжай в том же духе!"}
            </motion.p>

            {/* Dismiss hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1.5 }}
              className="text-white text-[10px] mt-4 uppercase tracking-widest"
            >
              нажмите, чтобы закрыть
            </motion.p>
          </motion.div>

          {/* Persistent pulsing glow ring around number */}
          <motion.div
            className="absolute rounded-full pointer-events-none border-2 border-[#FF5733]/20"
            style={{ width: 200, height: 200 }}
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
