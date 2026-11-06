import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Play, Trophy } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getTodaysPuzzle, getTodayKey } from '../../data/game/puzzles';
import { getLanguageInfo } from '../../locales/languages';
import { plural } from '../../utils/plural';
import { Badge, cx } from '../../ui';
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

// Карточка игры дня на главной: буквы сегодняшней головоломки и счёт, если уже играли
export default function DailyGameWidget() {
  const { t, language } = useI18n();
  const tg = t.game;

  const puzzle = useMemo(() => getTodaysPuzzle(), []);
  const dateKey = useMemo(() => getTodayKey(), []);

  const [open, setOpen] = useState(false);
  const [localState, setLocalState] = useState<SavedState | null>(null);

  // Прогресс берём из localStorage и перечитываем после закрытия игры
  useEffect(() => {
    setLocalState(loadSaved(dateKey));
  }, [dateKey, open]);

  const allLetters = [puzzle.center, ...puzzle.letters];
  const hasPlayed = (localState?.score ?? 0) > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group grid w-full content-start gap-4 rounded-4xl border border-line bg-surface p-6 text-left transition-colors hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-fg">{tg.widgetTitle}</h2>
            <Badge tone={hasPlayed ? 'success' : 'accent'}>{hasPlayed ? tg.widgetPlayed : tg.widgetNew}</Badge>
          </div>
          <span
            className={cx(
              'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors',
              hasPlayed ? 'bg-inset text-accent-ink' : 'bg-accent text-on-accent group-hover:bg-accent-hover',
            )}
          >
            {hasPlayed ? <Trophy size={18} /> : <Play size={18} className="ml-0.5 fill-current" />}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {allLetters.map((letter, i) => (
            <span
              key={i}
              className={cx(
                'grid h-8 w-8 place-items-center rounded-lg font-display text-sm font-extrabold uppercase',
                letter === puzzle.center ? 'bg-accent text-on-accent' : 'bg-inset text-fg',
              )}
            >
              {letter}
            </span>
          ))}
        </div>

        {hasPlayed ? (
          <p className="text-sm text-muted">
            {tg.widgetScore}: <span className="font-semibold text-accent-ink">{localState!.score} {tg.widgetPoints}</span>
            {' · '}
            {plural(getLanguageInfo(language).htmlLang, localState!.foundWords.length, tg.widgetWords)}
          </p>
        ) : (
          <p className="text-sm text-muted">{tg.widgetSubtitle}</p>
        )}
      </button>

      <AnimatePresence>{open && <DailyGameModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
