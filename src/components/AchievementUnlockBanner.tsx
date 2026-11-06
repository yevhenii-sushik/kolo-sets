import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useI18n } from '../contexts/I18nContext';
import { IconButton } from '../ui';

const DISPLAY_DURATION = 4.5; // секунд

// Всплывающая карточка нового достижения: по одной, сама скрывается, Esc или клик — сразу
export default function AchievementUnlockBanner() {
  const { pendingUnlocks, dismissUnlock } = useData();
  const { t } = useI18n();
  const current = pendingUnlocks[0] ?? null;

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
          role="status"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={() => dismissUnlock(current.id)}
          className="fixed bottom-6 left-1/2 z-[300] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 cursor-pointer overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl"
        >
          <div className="flex items-center gap-4 p-4 pr-2">
            <motion.span
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
              aria-hidden
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-3xl"
            >
              {current.icon}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-accent-ink">{t.shell.achievement.unlocked}</p>
              <p className="font-semibold leading-tight text-fg">{t.profile.achievementsList[current.id].name}</p>
              <p className="mt-0.5 text-sm leading-snug text-muted">{t.profile.achievementsList[current.id].description}</p>
            </div>
            <IconButton
              size="sm"
              label={t.close}
              onClick={(e) => {
                e.stopPropagation();
                dismissUnlock(current.id);
              }}
              className="self-start"
            >
              <X size={16} />
            </IconButton>
          </div>
          {/* Сколько осталось до автоскрытия */}
          <div className="h-1 bg-track">
            <motion.div
              className="h-full origin-left bg-accent"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: DISPLAY_DURATION, ease: 'linear' }}
              onAnimationComplete={() => dismissUnlock(current.id)}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
