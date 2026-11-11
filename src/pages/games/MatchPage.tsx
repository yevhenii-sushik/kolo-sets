import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Collection } from "../../types";
import { getCollection } from "../../utils/storage";
import { shuffle } from "../../utils/gameUtils";
import { Timer, Trophy } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import SessionShell from "../../components/session/SessionShell";
import SessionResult from "../../components/session/SessionResult";
import { motion } from "framer-motion";
import { playSound } from "../../utils/sounds";
import { useRoundReport } from "../../components/session/useRoundReport";

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
  const { t, language } = useI18n();
  const ss = t.words.session;

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

  useRoundReport(phase === "finished", () =>
    collection
      ? { kind: "match", collectionIds: [collection.id], cards: roundCards.length, correct: roundCards.length, durationSec: Math.max(elapsed, 1) }
      : null,
  );

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
      const newMatched = matched + 1;
      // Последняя пара сразу звучит итогом раунда, без «верно» поверх него
      playSound(newMatched >= roundCards.length ? "session-complete" : "answer-correct");
      setWords(prev =>
        prev.map(w => (w.id === wordId ? { ...w, state: "matched" } : w))
      );
      setTranslations(prev =>
        prev.map(t => (t.id === transId ? { ...t, state: "matched" } : t))
      );
      setSelectedWord(null);
      setSelectedTrans(null);

      setMatched(newMatched);
      setChecking(false);

      if (newMatched >= roundCards.length) {
        setTimeout(() => setPhase("finished"), 500);
      }
    } else {
      playSound("answer-wrong");
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
    // Выбор плитки — тихий «поп»; если пара собрана, вместо него прозвучит результат
    if (selectedTrans) tryMatch(tileId, selectedTrans);
    else playSound("ui-tap");
  };

  const handleTransClick = (tileId: string) => {
    if (checking) return;
    const tile = translations.find(t => t.id === tileId);
    if (!tile || tile.state === "matched" || tile.state === "wrong") return;
    if (selectedTrans === tileId) { setSelectedTrans(null); return; }
    setSelectedTrans(tileId);
    if (selectedWord) tryMatch(selectedWord, tileId);
    else playSound("ui-tap");
  };

  const tileStyle = (tile: Tile, isSelected: boolean): string => {
    const base = "min-h-12 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold leading-snug transition-colors duration-150";
    if (tile.state === "matched") return `${base} pointer-events-none border-success bg-success-soft text-success`;
    if (tile.state === "wrong") return `${base} pointer-events-none border-danger bg-danger-soft text-danger`;
    if (isSelected) return `${base} border-accent bg-accent-soft text-accent-ink`;
    return `${base} border-line bg-surface text-fg hover:border-accent/50`;
  };

  if (phase === "loading" || !collection) return null;

  const column = (title: string, tiles: Tile[], selected: string | null, onClick: (id: string) => void) => (
    <div className="grid content-start gap-2">
      <p className="pl-1 text-sm font-medium text-muted">{title}</p>
      {tiles.map((tile) => (
        <motion.button
          key={tile.id}
          type="button"
          onClick={() => onClick(tile.id)}
          animate={tile.state === "wrong" ? { x: [0, -7, 7, -5, 5, -3, 3, 0] } : tile.state === "matched" ? { opacity: 0.55 } : {}}
          transition={{ duration: 0.35 }}
          className={tileStyle(tile, selected === tile.id)}
        >
          {tile.text}
        </motion.button>
      ))}
    </div>
  );

  return (
    <SessionShell
      title={t.words.collectionCard.modal.match}
      subtitle={collection.name}
      onClose={() => navigate(-1)}
      progress={matched / Math.max(roundCards.length, 1)}
      progressTone="success"
      meta={
        <>
          <span className="flex items-center gap-1.5">
            <Timer size={15} />
            {formatTime(elapsed)}
          </span>
          <span>
            {matched}/{roundCards.length}
          </span>
        </>
      }
    >
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto grid max-w-2xl grid-cols-2 gap-3">
          {column(ss.word, words, selectedWord, handleWordClick)}
          {column(ss.translation, translations, selectedTrans, handleTransClick)}
        </div>
      </main>

      <SessionResult
        open={phase === "finished"}
        icon={<Trophy size={26} />}
        tone="success"
        title={ss.matchDone}
        subtitle={mistakes === 0 ? ss.perfect : plural(getLanguageInfo(language).htmlLang, mistakes, ss.mistakesCount)}
        metrics={[
          { label: ss.time, value: formatTime(elapsed), tone: "accent" },
          { label: ss.pairs, value: roundCards.length },
          { label: ss.mistakes, value: mistakes, tone: mistakes === 0 ? "success" : "danger" },
        ]}
        againLabel={ss.newRound}
        exitLabel={ss.exit}
        onAgain={() => collection && pickRound(collection)}
        onExit={() => navigate(-1)}
      />
    </SessionShell>
  );
}
