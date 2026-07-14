import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getTodaysPuzzle, getTodayKey } from '../../data/game/puzzles';
import DailyGameModal from './DailyGameModal';

const STORAGE_KEY = (date: string) => `kolo_game_${date}`;

interface SavedState {
  foundWords: string[];
  score: number;
}

function loadSaved(date: string): SavedState | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(date)) ?? 'null');
  } catch {
    return null;
  }
}

export default function DailyGameWidget() {
  const { t } = useI18n();
  const tg = t.game;

  const puzzle = useMemo(() => getTodaysPuzzle(), []);
  const dateKey = useMemo(() => getTodayKey(), []);

  const [open, setOpen] = useState(false);
  const [localState, setLocalState] = useState<SavedState | null>(null);

  // Load local progress
  useEffect(() => {
    setLocalState(loadSaved(dateKey));
  }, [dateKey, open]); // re-check after modal closes

  const allLetters = [puzzle.center, ...puzzle.letters];
  const hasPlayed = (localState?.score ?? 0) > 0;

  return (
    <>
      {/* w-full h-full + flex items-center — <button> по умолчанию
          inline-block и НЕ растягивается на ширину/высоту родителя как div,
          отсюда был баг с пустым местом справа/снизу вне зависимости от
          брейкпоинта. items-center на кнопке центрирует единственный
          in-flow дочерний блок по вертикали, если карта окажется выше
          своего контента (сосед в сетке задаёт высоту строки). */}
      <motion.button
        whileHover={{ scale: 0.99 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(true)}
        className="w-block rounded-3xl sm:rounded-[2.5rem] w-full h-full flex items-center p-4 sm:p-6 text-left relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.04] pointer-events-none">
          <Trophy size={120} strokeWidth={1} />
        </div>

        <div className="relative z-10 flex items-center justify-between w-full gap-3">
          {/* Left: title + letters preview */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <p className="uc-title">{tg.widgetTitle}</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FF5733] text-white uppercase tracking-tighter">
                {hasPlayed ? '✓' : 'NEW'}
              </span>
            </div>

            {/* Mini hex letter preview */}
            <div className="flex flex-wrap gap-1.5 max-w-55">
              {allLetters.map((letter, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase ${
                    letter === puzzle.center
                      ? 'bg-[#FF5733] text-white'
                      : 'bg-[#EDEAE4] dark:bg-[#2E2C29] text-[#5A5650] dark:text-[#9A9590]'
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>

            {hasPlayed ? (
              <p className="text-[11px] sm:text-[12px] font-semibold text-[#7A756E] dark:text-[#8A867F] mt-2 sm:mt-2.5 truncate">
                {tg.widgetScore}: <span className="text-[#FF5733] font-black">{localState!.score}{tg.widgetPoints}</span>
                {' · '}{localState!.foundWords.length} words
              </p>
            ) : (
              <p className="text-[11px] sm:text-[12px] font-medium text-[#B5B0A8] mt-2 sm:mt-2.5">{tg.widgetSubtitle}</p>
            )}
          </div>

          {/* Right: play button */}
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md shrink-0 ${
            hasPlayed ? 'bg-[#EDEAE4] dark:bg-[#2E2C29]' : 'bg-[#FF5733]'
          }`}>
            {hasPlayed ? (
              <Trophy size={16} className="text-[#FF5733] sm:hidden" />
            ) : (
              <Play size={16} fill="white" color="white" className="ml-0.5 sm:hidden" />
            )}
            {hasPlayed ? (
              <Trophy size={18} className="text-[#FF5733] hidden sm:block" />
            ) : (
              <Play size={18} fill="white" color="white" className="ml-0.5 hidden sm:block" />
            )}
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && <DailyGameModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
