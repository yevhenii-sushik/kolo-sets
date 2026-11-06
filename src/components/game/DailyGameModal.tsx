import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Shuffle, Delete, ChevronRight, HelpCircle } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
  getTodaysPuzzle,
  getTodayKey,
  calcPangramBonus,
  type WordEntry,
} from '../../data/game/puzzles';
import {
  submitGameScore,
  getGameLeaderboard,
  type GameScore,
} from '../../firebase/firestore';
import { getLanguageInfo } from '../../locales/languages';
import { plural } from '../../utils/plural';
import { Badge, Button, Heading, IconButton, Spinner, cx } from '../../ui';

interface Props {
  onClose: () => void;
}

type Tab = 'game' | 'words' | 'leaderboard';
type FeedbackType = 'correct' | 'pangram' | 'already' | 'short' | 'noCenter' | 'invalid' | null;

const STORAGE_KEY = (date: string) => `kolo_game_${date}`;

interface SavedState {
  foundWords: string[];
  score: number;
}

function loadSaved(date: string): SavedState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(date)) ?? 'null') ?? { foundWords: [], score: 0 };
  } catch {
    return { foundWords: [], score: 0 };
  }
}

function saveSaved(date: string, state: SavedState) {
  try { localStorage.setItem(STORAGE_KEY(date), JSON.stringify(state)); } catch {}
}

function getLevelLabel(score: number, maxScore: number, labels: Record<string, string>): string {
  const pct = maxScore > 0 ? score / maxScore : 0;
  if (pct >= 0.9) return labels.levelGenius;
  if (pct >= 0.7) return labels.levelAmazing;
  if (pct >= 0.5) return labels.levelGreat;
  if (pct >= 0.3) return labels.levelNice;
  if (pct >= 0.1) return labels.levelGood;
  return labels.levelBeginner;
}

export default function DailyGameModal({ onClose }: Props) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { profile } = useData();
  const tg = t.game;

  const puzzle = useMemo(() => getTodaysPuzzle(), []);
  const dateKey = useMemo(() => getTodayKey(), []);

  const [shuffled, setShuffled] = useState(() => [...puzzle.letters]);
  const [current, setCurrent] = useState('');
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [feedbackWord, setFeedbackWord] = useState('');
  const [tab, setTab] = useState<Tab>('game');
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [selectedWordDef, setSelectedWordDef] = useState<WordEntry | null>(null);
  const [showRules, setShowRules] = useState(false);

  const maxScore = useMemo(
    () => puzzle.words.reduce((s, w) => s + w.points + (w.isPangram ? 7 : 0), 0),
    [puzzle],
  );

  const wordMap = useMemo(() => {
    const m = new Map<string, WordEntry>();
    puzzle.words.forEach(w => m.set(w.word, w));
    return m;
  }, [puzzle]);

  // Load saved progress
  useEffect(() => {
    const saved = loadSaved(dateKey);
    setFoundWords(saved.foundWords);
    setScore(saved.score);
  }, [dateKey]);

  // Load leaderboard when tab opens
  useEffect(() => {
    if (tab !== 'leaderboard') return;
    setLeaderboardLoading(true);
    getGameLeaderboard(dateKey).then(rows => {
      setLeaderboard(rows);
      setLeaderboardLoading(false);
    }).catch(() => setLeaderboardLoading(false));
  }, [tab, dateKey]);

  // Submit score to Firestore whenever foundWords changes
  useEffect(() => {
    if (!user || foundWords.length === 0) return;
    const hasPangram = foundWords.some(w => calcPangramBonus(w, puzzle));
    // Никогда не публикуем email: лидерборд читают все залогиненные.
    // Auth displayName задаётся при регистрации; profile.displayName — null,
    // пока пользователь сам не отредактирует профиль.
    submitGameScore(
      dateKey,
      user.uid,
      profile?.displayName ?? user.displayName ?? 'Player',
      profile?.photoURL ?? null,
      score,
      foundWords.length,
      hasPangram,
    ).catch(() => {});
  }, [foundWords, score, dateKey, user, profile, puzzle]);

  const shuffle = useCallback(() => {
    setShuffled(prev => [...prev].sort(() => Math.random() - 0.5));
  }, []);

  const addLetter = useCallback((letter: string) => {
    setCurrent(prev => prev + letter);
  }, []);

  const deleteLetter = useCallback(() => {
    setCurrent(prev => prev.slice(0, -1));
  }, []);

  const showFeedback = useCallback((type: FeedbackType, word = '') => {
    setFeedback(type);
    setFeedbackWord(word);
    setTimeout(() => setFeedback(null), 1200);
  }, []);

  const submitWord = useCallback(() => {
    const word = current.toUpperCase();
    setCurrent('');

    if (word.length < 4) { showFeedback('short'); return; }
    if (!word.includes(puzzle.center)) { showFeedback('noCenter'); return; }
    if (foundWords.includes(word)) { showFeedback('already'); return; }

    const entry = wordMap.get(word);
    if (!entry) { showFeedback('invalid'); return; }

    const isPangram = calcPangramBonus(word, puzzle);
    const pts = entry.points + (isPangram ? 7 : 0);

    const newFound = [...foundWords, word];
    const newScore = score + pts;
    setFoundWords(newFound);
    setScore(newScore);
    saveSaved(dateKey, { foundWords: newFound, score: newScore });
    showFeedback(isPangram ? 'pangram' : 'correct', word);
    setSelectedWordDef(entry);
  }, [current, puzzle, foundWords, wordMap, score, dateKey, showFeedback]);

  // Keyboard input
  useEffect(() => {
    const valid = new Set([puzzle.center, ...puzzle.letters]);
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') { submitWord(); return; }
      if (e.key === 'Backspace' || e.key === 'Delete') { deleteLetter(); return; }
      const k = e.key.toUpperCase();
      if (k.length === 1 && valid.has(k)) addLetter(k);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [submitWord, deleteLetter, addLetter, puzzle]);

  const level = getLevelLabel(score, maxScore, tg as unknown as Record<string, string>);
  const allLetters = [puzzle.center, ...shuffled];
  const locale = getLanguageInfo(language).htmlLang;

  const feedbackTone =
    feedback === 'pangram' ? 'bg-warning-soft text-warning' : feedback === 'correct' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';

  const feedbackMessage = feedback === 'pangram' ? tg.pangramBadge
    : feedback === 'correct' ? `+${wordMap.get(feedbackWord)?.points ?? ''} ${tg.correctWord}`
    : feedback === 'already' ? tg.alreadyFound
    : feedback === 'short' ? tg.tooShort
    : feedback === 'noCenter' ? tg.missingCenter
    : feedback === 'invalid' ? tg.notAWord
    : '';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'game', label: tg.tabs.play },
    { id: 'words', label: tg.tabs.words },
    { id: 'leaderboard', label: tg.tabs.top },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-game-title"
      className="fixed inset-0 z-200 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-4xl border border-line bg-surface shadow-2xl sm:max-h-[90dvh] sm:max-w-md sm:rounded-4xl"
      >
        {/* Шапка: название, уровень и счёт, правила, закрыть */}
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pb-4 pt-6">
          <div className="min-w-0">
            <Heading size={3} as="h2" id="daily-game-title">
              {tg.modalTitle}
            </Heading>
            <p className="mt-0.5 text-sm text-muted tabular-nums">
              {level} · {score}
              {tg.pointsSuffix}
            </p>
          </div>
          <div className="-mr-2 -mt-1 flex items-center">
            <IconButton label={tg.modalRules} aria-expanded={showRules} onClick={() => setShowRules((r) => !r)}>
              <HelpCircle size={20} />
            </IconButton>
            <IconButton label={t.close} onClick={onClose}>
              <X size={20} />
            </IconButton>
          </div>
        </div>

        <AnimatePresence>
          {showRules && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mx-6 mb-4 shrink-0 rounded-2xl bg-accent-soft p-4 text-sm leading-relaxed text-accent-ink"
            >
              {tg.rulesText}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Вкладки */}
        <div role="tablist" className="mx-6 mb-4 grid shrink-0 grid-cols-3 gap-1 rounded-full bg-inset p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cx(
                'h-9 truncate rounded-full px-2 text-sm font-semibold transition-colors',
                tab === id ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {tab === 'game' && (
            <div className="grid justify-items-center">
              {/* Отклик на слово */}
              <div className="mb-2 flex h-8 items-center justify-center">
                <AnimatePresence>
                  {feedback && (
                    <motion.span
                      key={feedback}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className={cx('rounded-full px-4 py-1.5 text-sm font-semibold', feedbackTone)}
                    >
                      {feedbackMessage}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Набранное слово; центральная буква — оранжевая */}
              <div className="mb-6 flex min-h-12 items-center justify-center text-center">
                {current ? (
                  <span className="font-display text-3xl font-semibold tracking-wider text-fg">
                    {current.split('').map((ch, i) => (
                      <span key={i} className={ch === puzzle.center ? 'text-accent-ink' : undefined}>
                        {ch}
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-sm text-muted">{tg.modalCenterHint}</span>
                )}
              </div>

              <div className="mb-6">
                <HoneyComb letters={allLetters} center={puzzle.center} onPress={addLetter} />
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button variant="secondary" iconLeft={<Delete size={16} />} onClick={deleteLetter} disabled={!current}>
                  {tg.modalDeleteBtn}
                </Button>
                <IconButton variant="surface" label={tg.modalShuffleBtn} onClick={shuffle}>
                  <Shuffle size={18} />
                </IconButton>
                <Button iconRight={<ChevronRight size={16} />} onClick={submitWord} disabled={!current}>
                  {tg.modalSubmitBtn}
                </Button>
              </div>

              {/* Значение только что найденного слова */}
              <AnimatePresence>
                {selectedWordDef && feedback === null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 grid w-full gap-1 rounded-3xl bg-inset p-4"
                  >
                    <p className="text-xs font-semibold text-muted">{tg.wordDefinition}</p>
                    <p className="font-display text-lg font-semibold text-fg">{selectedWordDef.word}</p>
                    <p className="text-sm leading-snug text-muted">{selectedWordDef.def.no}</p>
                    {language !== 'no' && (
                      <p className="text-sm italic leading-snug text-faint">
                        {selectedWordDef.def[language as 'en' | 'ru' | 'uk'] ?? selectedWordDef.def.en}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tab === 'words' && (
            <div className="grid gap-3">
              <p className="text-sm text-muted tabular-nums">
                {tg.modalFoundWords} · {foundWords.length}/{puzzle.words.length}
              </p>
              {foundWords.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">{tg.noWordsYet}</p>
              ) : (
                <div className="grid gap-2">
                  {foundWords.map((w) => {
                    const entry = wordMap.get(w);
                    const isPangram = entry?.isPangram || calcPangramBonus(w, puzzle);
                    const open = selectedWordDef?.word === w;
                    return (
                      <button
                        key={w}
                        type="button"
                        aria-expanded={open}
                        onClick={() => setSelectedWordDef(open ? null : entry ?? null)}
                        className="flex w-full items-start justify-between gap-3 rounded-2xl bg-inset p-3 text-left transition-colors hover:bg-track"
                      >
                        <div className="grid min-w-0 gap-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-fg">{w}</span>
                            {isPangram && <Badge tone="warning">{tg.pangramBadge}</Badge>}
                          </span>
                          {open && <span className="text-sm text-muted">{entry?.def.no}</span>}
                        </div>
                        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold tabular-nums text-muted">
                          +{entry ? entry.points + (isPangram ? 7 : 0) : '?'}
                          <BookOpen size={14} className="text-faint" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div className="grid gap-3">
              <p className="text-sm text-muted">{tg.modalLeaderboard}</p>
              {leaderboardLoading ? (
                <div className="grid place-items-center py-8 text-muted">
                  <Spinner size={20} />
                  <span className="sr-only">{tg.loadingLeaderboard}</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">{tg.noScoresYet}</p>
              ) : (
                <ol className="grid gap-2">
                  {leaderboard.map((row, i) => {
                    const isMe = user?.uid === row.userId;
                    return (
                      <li key={row.userId} className={cx('flex items-center gap-3 rounded-2xl p-3', isMe ? 'bg-accent-soft' : 'bg-inset')}>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted">
                          {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>
                        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-accent-ink">
                          {row.photoURL ? <img src={row.photoURL} className="h-full w-full object-cover" alt="" /> : row.displayName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-fg">
                            {row.displayName}
                            {isMe && <span className="ml-1 font-normal text-accent-ink">({tg.modalYou})</span>}
                          </p>
                          <p className="text-xs text-muted">
                            {plural(locale, row.wordsFound, tg.widgetWords)}
                            {row.foundPangram && ` · ${tg.pangramBadge}`}
                          </p>
                        </div>
                        <span className="font-display text-base font-semibold tabular-nums text-accent-ink">{row.score}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Honeycomb component ───────────────────────────────────────────────────
// Layout: letters[0]=center, letters[1..6]=outer
//   Row 1 (top):    outer[0]  outer[1]          (offset right)
//   Row 2 (mid):    outer[2]  center  outer[3]
//   Row 3 (bot):    outer[4]  outer[5]          (offset right)

function HoneyComb({ letters, center, onPress }: {
  letters: string[];
  center: string;
  onPress: (l: string) => void;
}) {
  const outer = letters.slice(1); // 6 outer letters

  const Hex = ({ letter, isCenter }: { letter: string; isCenter: boolean }) => (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onPress(letter)}
      type="button"
      aria-label={letter}
      className={cx(
        'flex h-17 w-17 select-none items-center justify-center rounded-3xl font-display text-xl font-semibold uppercase transition-colors',
        isCenter ? 'bg-accent text-on-accent' : 'bg-inset text-fg hover:bg-track',
      )}
    >
      {letter}
    </motion.button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Row 1: 2 tiles, offset by half a tile width to the right */}
      <div className="flex gap-2 ml-17.5">
        <Hex letter={outer[0]} isCenter={false} />
        <Hex letter={outer[1]} isCenter={false} />
      </div>
      {/* Row 2: 3 tiles (center row) */}
      <div className="flex gap-2">
        <Hex letter={outer[2]} isCenter={false} />
        <Hex letter={center} isCenter={true} />
        <Hex letter={outer[3]} isCenter={false} />
      </div>
      {/* Row 3: 2 tiles, offset right */}
      <div className="flex gap-2 ml-17.5">
        <Hex letter={outer[4]} isCenter={false} />
        <Hex letter={outer[5]} isCenter={false} />
      </div>
    </div>
  );
}
