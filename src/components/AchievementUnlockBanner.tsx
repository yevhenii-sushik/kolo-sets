import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const DISPLAY_DURATION = 4.5; // seconds

export default function AchievementUnlockBanner() {
  const { pendingUnlocks, dismissUnlock } = useData();
  const current = pendingUnlocks[0] ?? null;

  // Keyboard dismiss
  useEffect(() => {
    if (!current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissUnlock(current.id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, dismissUnlock]);

  return (
    <AnimatePresence mode="wait">
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm pointer-events-auto"
          onClick={() => dismissUnlock(current.id)}
          role="button"
          aria-label="Закрыть уведомление о достижении"
        >
          <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-orange-500/30">
            {/* Gold gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500" />

            {/* Subtle glow blobs */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300/40 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-orange-300/30 rounded-full blur-2xl pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 p-5 text-white">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-85">
                  ✨ Достижение разблокировано!
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); dismissUnlock(current.id); }}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors ml-2 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Icon + text */}
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0.5, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl flex-shrink-0 shadow-lg ring-2 ring-white/20"
                >
                  {current.icon}
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className="text-[17px] font-black leading-tight">{current.name}</h3>
                  <p className="text-[12px] opacity-80 mt-0.5 leading-snug">{current.description}</p>
                </motion.div>
              </div>

              {/* Auto-dismiss progress bar */}
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white/60 rounded-full origin-left"
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: DISPLAY_DURATION, ease: 'linear' }}
                  onAnimationComplete={() => dismissUnlock(current.id)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
