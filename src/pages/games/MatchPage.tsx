import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Collection } from "../../types";
import { getCollection } from "../../utils/storage";
import { shuffle } from "../../utils/gameUtils";
import { X, Link2, Timer, RotateCcw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  playCorrectIfEnabled,
  playIncorrectIfEnabled,
  playSessionCompleteIfEnabled,
} from "../../utils/sounds";

const PAIRS_PER_ROUND = 6;

type TileState = "idle" | "selected" | "matched" | "wrong";

interface Tile {
  id: string;
  cardId: string;
  text: string;
  state: TileState;
}

function buildColumns(cards: Card[]): { words: Tile[]; translations: Tile[] } {
  const words: Tile[] = cards.map(c => ({
    id: `${c.id}-w`,
    cardId: c.id,
    text: c.word,
    state: "idle",
  }));
  const translations: Tile[] = shuffle(cards).map(c => ({
    id: `${c.id}-t`,
    cardId: c.id,
    text: c.translation,
    state: "idle",
  }));
  return { words, translations };
}

// Матчим по cardId, поэтому в раунде не должно быть двух карточек с одинаковым
// переводом — иначе игрок выбирает визуально неотличимую плитку «не той»
// карточки и получает ошибку за верный ответ.
function pickRoundCards(cards: Card[], count: number): Card[] {
  const seen = new Set<string>();
  const picked: Card[] = [];
  for (const c of shuffle(cards)) {
    const key = c.translation.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(c);
    if (picked.length === count) break;
  }
  return picked;
}

type Phase = "loading" | "playing" | "finished";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [roundCards, setRoundCards] = useState<Card[]>([]);
  const [words, setWords] = useState<Tile[]>([]);
  const [translations, setTranslations] = useState<Tile[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedTrans, setSelectedTrans] = useState<string | null>(null);
  const [matched, setMatched] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [checking, setChecking] = useState(false);

  const pickRound = (col: Collection) => {
    const picked = pickRoundCards(col.cards, PAIRS_PER_ROUND);
    const { words: w, translations: t } = buildColumns(picked);
    setRoundCards(picked);
    setWords(w);
    setTranslations(t);
    setSelectedWord(null);
    setSelectedTrans(null);
    setMatched(0);
    setMistakes(0);
    setElapsed(0);
    setChecking(false);
    setPhase("playing");
  };

  useEffect(() => {
    if (!id) return;
    getCollection(id).then(col => {
      if (!col || col.cards.length < 4) { navigate(-1); return; }
      setCollection(col);
      pickRound(col);
    });
  }, [id]);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const tryMatch = (wordId: string, transId: string) => {
    if (checking) return;
    setChecking(true);

    const wTile = words.find(w => w.id === wordId)!;
    const tTile = translations.find(t => t.id === transId)!;
    const isMatch = wTile.cardId === tTile.cardId;

    if (isMatch) {
      playCorrectIfEnabled();
      setWords(prev =>
        prev.map(w => (w.id === wordId ? { ...w, state: "matched" } : w))
      );
      setTranslations(prev =>
        prev.map(t => (t.id === transId ? { ...t, state: "matched" } : t))
      );
      setSelectedWord(null);
      setSelectedTrans(null);

      const newMatched = matched + 1;
      setMatched(newMatched);
      setChecking(false);

      if (newMatched >= roundCards.length) {
        playSessionCompleteIfEnabled();
        setTimeout(() => setPhase("finished"), 500);
      }
    } else {
      playIncorrectIfEnabled();
      setMistakes(m => m + 1);
      setWords(prev =>
        prev.map(w => (w.id === wordId ? { ...w, state: "wrong" } : w))
      );
      setTranslations(prev =>
        prev.map(t => (t.id === transId ? { ...t, state: "wrong" } : t))
      );
      setTimeout(() => {
        setWords(prev =>
          prev.map(w => (w.id === wordId ? { ...w, state: "idle" } : w))
        );
        setTranslations(prev =>
          prev.map(t => (t.id === transId ? { ...t, state: "idle" } : t))
        );
        setSelectedWord(null);
        setSelectedTrans(null);
        setChecking(false);
      }, 650);
    }
  };

  const handleWordClick = (tileId: string) => {
    if (checking) return;
    const tile = words.find(w => w.id === tileId);
    if (!tile || tile.state === "matched" || tile.state === "wrong") return;
    if (selectedWord === tileId) { setSelectedWord(null); return; }
    setSelectedWord(tileId);
    if (selectedTrans) tryMatch(tileId, selectedTrans);
  };

  const handleTransClick = (tileId: string) => {
    if (checking) return;
    const tile = translations.find(t => t.id === tileId);
    if (!tile || tile.state === "matched" || tile.state === "wrong") return;
    if (selectedTrans === tileId) { setSelectedTrans(null); return; }
    setSelectedTrans(tileId);
    if (selectedWord) tryMatch(selectedWord, tileId);
  };

  const tileStyle = (tile: Tile, isSelected: boolean): string => {
    const base =
      "w-full py-3.5 px-3.5 rounded-2xl border-2 text-sm font-bold text-left transition-all duration-150 leading-snug";
    if (tile.state === "matched")
      return `${base} bg-[#22C55E]/10 border-[#22C55E] text-[#22C55E] pointer-events-none`;
    if (tile.state === "wrong")
      return `${base} bg-red-500/10 border-red-500 text-red-500 pointer-events-none`;
    if (isSelected)
      return `${base} bg-[#FF5733]/10 border-[#FF5733] text-[#1A1714] dark:text-[#F0EDE8]`;
    return `${base} bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733]/40`;
  };

  if (phase === "loading" || !collection) return null;

  const score = mistakes === 0 ? "Perfect!" : `${mistakes} mistake${mistakes !== 1 ? "s" : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#F5F2ED] dark:bg-[#0F0E0C] flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="max-w-2xl mx-auto flex items-center gap-3 bg-white/70 dark:bg-[#1A1917]/70 backdrop-blur-xl rounded-4xl px-4 py-3 border border-[#E0DBD3] dark:border-[#2E2C29]">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-[#F0EDE8] dark:hover:bg-[#242220] text-[#7A756E] transition-colors shrink-0"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            <Link2 size={15} className="text-[#FF5733]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-[#7A756E]">
              Match
            </span>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm font-bold text-[#7A756E]">
            <span className="flex items-center gap-1.5">
              <Timer size={14} />
              {formatTime(elapsed)}
            </span>
            <span className="tabular-nums">
              {matched}/{roundCards.length}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="shrink-0 px-4 pb-3">
        <div className="max-w-2xl mx-auto h-1.5 bg-[#E0DBD3] dark:bg-[#2E2C29] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#22C55E] rounded-full"
            animate={{
              width: `${(matched / Math.max(roundCards.length, 1)) * 100}%`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            {/* Left — words */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-2 pl-1">
                Word
              </p>
              {words.map(tile => (
                <motion.button
                  key={tile.id}
                  onClick={() => handleWordClick(tile.id)}
                  animate={
                    tile.state === "wrong"
                      ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
                      : tile.state === "matched"
                      ? { opacity: 0.5 }
                      : {}
                  }
                  transition={{ duration: 0.35 }}
                  className={tileStyle(tile, selectedWord === tile.id)}
                >
                  {tile.text}
                </motion.button>
              ))}
            </div>

            {/* Right — translations */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-2 pl-1">
                Translation
              </p>
              {translations.map(tile => (
                <motion.button
                  key={tile.id}
                  onClick={() => handleTransClick(tile.id)}
                  animate={
                    tile.state === "wrong"
                      ? { x: [0, -7, 7, -5, 5, -3, 3, 0] }
                      : tile.state === "matched"
                      ? { opacity: 0.5 }
                      : {}
                  }
                  transition={{ duration: 0.35 }}
                  className={tileStyle(tile, selectedTrans === tile.id)}
                >
                  {tile.text}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Results overlay ── */}
      <AnimatePresence>
        {phase === "finished" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A1714]/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-4xl p-7 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-[#F0FDF4] dark:bg-[#0D2015] rounded-3xl flex items-center justify-center mx-auto mb-5">
                <Trophy size={28} className="text-[#22C55E]" />
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-1">
                Time
              </p>
              <h2 className="text-5xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] mb-1">
                {formatTime(elapsed)}
                <span className="text-[#FF5733]">.</span>
              </h2>
              <p className="text-sm font-bold text-[#7A756E] mb-6">{score}</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Pairs", value: roundCards.length },
                  { label: "Mistakes", value: mistakes },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl p-3"
                  >
                    <div
                      className={`text-xl font-black ${
                        s.label === "Mistakes" && mistakes === 0
                          ? "text-[#22C55E]"
                          : "text-[#1A1714] dark:text-[#F0EDE8]"
                      }`}
                    >
                      {s.value}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-[#B5B0A8] mt-0.5">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 py-3 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] text-xs font-black uppercase tracking-widest text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                >
                  Exit
                </button>
                <button
                  onClick={() => collection && pickRound(collection)}
                  className="flex-1 py-3 rounded-2xl bg-[#FF5733] text-white text-xs font-black uppercase tracking-widest hover:bg-[#E54D2A] transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} /> New round
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
