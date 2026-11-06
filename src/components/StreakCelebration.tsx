import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { Ring } from "../ui";

export const STREAK_CELEBRATION_EVENT = "kolo:streak-extended";

// Глобальный хост: слушает событие и показывает празднование. Подключён на уровне App —
// страницы тренировок (без MainLayout) отправляют событие, когда основной макет не смонтирован.
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

  return <StreakCelebration isOpen={state.open} streak={state.streak} onClose={() => setState((s) => ({ ...s, open: false }))} />;
}

interface Props {
  isOpen: boolean;
  streak: number;
  onClose: () => void;
}

// Серия продлена: кольцо замыкается вокруг числа дней — тот же образ орбиты, что в знаке Kolo
export default function StreakCelebration({ isOpen, streak, onClose }: Props) {
  const { t, language } = useI18n();
  const st = t.shell.streak;
  const [filled, setFilled] = useState(false);

  // Кольцо стартует пустым и замыкается; через 4 секунды окно закрывается само
  useEffect(() => {
    if (!isOpen) {
      setFilled(false);
      return;
    }
    const fill = setTimeout(() => setFilled(true), 120);
    const close = setTimeout(onClose, 4000);
    return () => {
      clearTimeout(fill);
      clearTimeout(close);
    };
  }, [isOpen, onClose]);

  const cheer = streak >= 30 ? st.tier30 : streak >= 14 ? st.tier14 : streak >= 7 ? st.tier7 : st.tier1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          onClick={onClose}
          role="dialog"
          aria-live="polite"
          className="fixed inset-0 z-[500] grid place-items-center bg-scrim/60 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="grid w-full max-w-xs justify-items-center gap-4 rounded-4xl border border-line bg-surface p-8 text-center shadow-2xl"
          >
            <Ring value={filled ? 1 : 0} size={148} stroke={10} label={plural(getLanguageInfo(language).htmlLang, streak, st.days)}>
              <span className="grid justify-items-center">
                <Flame size={26} className="fill-accent text-accent" />
                <span className="font-display text-5xl font-extrabold leading-none text-fg">{streak}</span>
              </span>
            </Ring>
            <div className="grid gap-1">
              <p className="text-sm font-semibold text-accent-ink">{st.extended}</p>
              <h2 className="font-display text-2xl font-extrabold text-fg">{plural(getLanguageInfo(language).htmlLang, streak, st.days)}</h2>
              <p className="text-sm text-muted">{cheer}</p>
            </div>
            <p className="text-xs text-faint">{st.tap}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
