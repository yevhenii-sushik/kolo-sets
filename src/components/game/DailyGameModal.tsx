import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Shuffle, Delete, ChevronRight } from 'lucide-react';
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

  const feedbackColor = feedback === 'pangram' ? '#FFB800'
    : feedback === 'correct' ? '#22C55E'
    : '#FF5733';

  const feedbackMessage = feedback === 'pangram' ? tg.pangramBadge
    : feedback === 'correct' ? `+${foundWords.length > 0 ? (wordMap.get(feedbackWord)?.points ?? '') : ''} ${tg.correctWord}`
    : feedback === 'already' ? tg.alreadyFound
    : feedback === 'short' ? tg.tooShort
    : feedback === 'noCenter' ? tg.missingCenter
    : feedback === 'invalid' ? tg.notAWord
    : '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-md bg-[#FAF8F5] dark:bg-[#1A1917] rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 flex-shrink-0">
          <div>
            <h2 className="u-title text-[22px] leading-tight">{tg.modalTitle}</h2>
            <p className="text-[11px] font-semibold text-[#B5B0A8] mt-0.5">{level} · {score}{tg.pointsSuffix}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(r => !r)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#B5B0A8] hover:bg-[#EDEAE4] dark:hover:bg-[#242220] transition-colors text-[11px] font-bold"
            >
              ?
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#B5B0A8] hover:bg-[#EDEAE4] dark:hover:bg-[#242220] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Rules tooltip */}
        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mx-6 mb-4 p-4 rounded-2xl bg-[#FF5733]/10 text-[12px] text-[#FF5733] leading-relaxed font-medium flex-shrink-0"
            >
              {tg.rulesText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 mb-4 p-1 rounded-xl bg-[#EDEAE4] dark:bg-[#242220] flex-shrink-0">
          {(['game', 'words', 'leaderboard'] as Tab[]).map(tabId => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                tab === tabId
                  ? 'bg-white dark:bg-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] shadow-sm'
                  : 'text-[#B5B0A8]'
              }`}
            >
              {tabId === 'game' ? '🎮' : tabId === 'words' ? '📖' : '🏆'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'game' && (
            <div className="px-6 pb-6">
              {/* Feedback toast */}
              <div className="h-8 flex items-center justify-center mb-2">
                <AnimatePresence>
                  {feedback && (
                    <motion.span
                      key={feedback}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="text-[13px] font-bold px-4 py-1.5 rounded-full"
                      style={{ background: `${feedbackColor}20`, color: feedbackColor }}
                    >
                      {feedbackMessage}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* Current word display */}
              <div className="text-center mb-6">
                <div className="min-h-[48px] flex items-center justify-center">
                  {current ? (
                    <span className="u-title text-[32px] tracking-[0.1em]">
                      {current.split('').map((ch, i) => (
                        <span
                          key={i}
                          style={{ color: ch === puzzle.center ? '#FF5733' : undefined }}
                        >
                          {ch}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-[#B5B0A8] text-[14px] font-medium">{tg.modalCenterHint}</span>
                  )}
                </div>
              </div>

              {/* Honeycomb */}
              <div className="flex justify-center mb-6">
                <HoneyComb
                  letters={allLetters}
                  center={puzzle.center}
                  onPress={addLetter}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={deleteLetter}
                  disabled={!current}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold border border-[#E0DBD3] dark:border-[#2E2C29] disabled:opacity-30 transition-opacity"
                >
                  <Delete size={14} /> {tg.modalDeleteBtn}
                </button>
                <button
                  onClick={shuffle}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#E0DBD3] dark:border-[#2E2C29]"
                >
                  <Shuffle size={16} className="text-[#B5B0A8]" />
                </button>
                <button
                  onClick={submitWord}
                  disabled={!current}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold bg-[#FF5733] text-white disabled:opacity-30 transition-opacity"
                >
                  {tg.modalSubmitBtn} <ChevronRight size={14} />
                </button>
              </div>

              {/* Recent find definition */}
              <AnimatePresence>
                {selectedWordDef && feedback === null && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 p-4 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220]"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8] mb-1">{tg.wordDefinition}</p>
                    <p className="u-title text-[18px] mb-1">{selectedWordDef.word}</p>
                    <p className="text-[12px] font-medium text-[#5A5650] dark:text-[#9A9590] leading-snug">{selectedWordDef.def.no}</p>
                    {language !== 'no' && (
                      <p className="text-[12px] font-medium text-[#B5B0A8] mt-1 leading-snug italic">
                        {selectedWordDef.def[language as 'en' | 'ru' | 'uk']}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {tab === 'words' && (
            <div className="px-6 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B5B0A8] mb-4">
                {tg.modalFoundWords} · {foundWords.length}/{puzzle.words.length}
              </p>
              {foundWords.length === 0 ? (
                <p className="text-[13px] text-[#B5B0A8] text-center py-8">—</p>
              ) : (
                <div className="space-y-2">
                  {foundWords.map(w => {
                    const entry = wordMap.get(w);
                    const isPangram = entry?.isPangram || calcPangramBonus(w, puzzle);
                    return (
                      <motion.button
                        key={w}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedWordDef(entry ?? null)}
                        className="w-full flex items-center justify-between p-3 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220] text-left"
                      >
                        <div>
                          <span className="font-bold text-[15px]">{w}</span>
                          {isPangram && (
                            <span className="ml-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FFB800] text-white uppercase">
                              {tg.pangramBadge}
                            </span>
                          )}
                          {selectedWordDef?.word === w && (
                            <p className="text-[11px] text-[#7A756E] mt-0.5">{entry?.def.no}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#B5B0A8]">
                            +{entry ? entry.points + (isPangram ? 7 : 0) : '?'}
                          </span>
                          <BookOpen size={13} className="text-[#B5B0A8]" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div className="px-6 pb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#B5B0A8] mb-4">{tg.modalLeaderboard}</p>
              {leaderboardLoading ? (
                <p className="text-[13px] text-[#B5B0A8] text-center py-8">{tg.loadingLeaderboard}</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-[13px] text-[#B5B0A8] text-center py-8">{tg.noScoresYet}</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((row, i) => {
                    const isMe = user?.uid === row.userId;
                    return (
                      <div
                        key={row.userId}
                        className={`flex items-center gap-3 p-3 rounded-2xl ${
                          isMe
                            ? 'bg-[#FF5733]/10 border border-[#FF5733]/20'
                            : 'bg-[#EDEAE4] dark:bg-[#242220]'
                        }`}
                      >
                        <span className="text-[13px] font-black w-6 text-center text-[#B5B0A8]">
                          {i + 1 <= 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                        </span>
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[#EDEAE4] dark:bg-[#2E2C29] flex items-center justify-center">
                          {row.photoURL ? (
                            <img src={row.photoURL} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-sm">🧑</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold truncate">
                            {row.displayName}
                            {isMe && <span className="ml-1 text-[10px] text-[#FF5733] font-black">({tg.modalYou})</span>}
                          </p>
                          <p className="text-[10px] text-[#B5B0A8]">
                            {row.wordsFound} words{row.foundPangram ? ' · 🌟 Pangram' : ''}
                          </p>
                        </div>
                        <span className="text-[15px] font-black text-[#FF5733]">{row.score}</span>
                      </div>
                    );
                  })}
                </div>
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
      className={`w-17 h-17 flex items-center justify-center rounded-[20px] select-none font-black text-[22px] uppercase transition-colors ${
        isCenter
          ? 'bg-[#FF5733] text-white shadow-lg'
          : 'bg-[#EDEAE4] dark:bg-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:bg-[#E0DBD3] dark:hover:bg-[#3A3836]'
      }`}
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
