import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Collection } from "../../types";
import { getCollection } from "../../utils/storage";
import { shuffle, makeChoices } from "../../utils/gameUtils";
import { Check, Flame, Heart } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import SessionShell from "../../components/session/SessionShell";
import SessionResult from "../../components/session/SessionResult";
import ChoiceButton, { choiceState } from "../../components/session/ChoiceButton";
import { motion, AnimatePresence } from "framer-motion";
import {
  playCorrectIfEnabled,
  playIncorrectIfEnabled,
  playSessionCompleteIfEnabled,
} from "../../utils/sounds";

const MAX_LIVES = 3;

type Phase = "playing" | "gameover";
interface Feedback { chosen: string; correct: boolean; }

export default function SurvivalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const ss = t.words.session;

  const [phase, setPhase] = useState<Phase>("playing");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [shakingLives, setShakingLives] = useState(false);

  const answeredRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    getCollection(id).then(col => {
      if (!col || col.cards.length < 4) { navigate(-1); return; }
      setCollection(col);
      const shuffled = shuffle(col.cards);
      setQueue(shuffled);
      setChoices(makeChoices(shuffled[0], col.cards));
    });
  }, [id]);

  const advance = useCallback((nextIdx: number, col: Collection, q: Card[]) => {
    let finalQueue = q;
    let finalIdx = nextIdx;
    if (nextIdx >= q.length) {
      finalQueue = shuffle(q);
      finalIdx = 0;
      setQueue(finalQueue);
    }
    setQIdx(finalIdx);
    setChoices(makeChoices(finalQueue[finalIdx], col.cards));
    setFeedback(null);
    answeredRef.current = false;
  }, []);

  const handleAnswer = useCallback((choice: string) => {
    if (answeredRef.current || phase !== "playing" || !collection) return;
    answeredRef.current = true;

    const card = queue[qIdx];
    const isCorrect = choice === card.translation;

    isCorrect ? playCorrectIfEnabled() : playIncorrectIfEnabled();
    setFeedback({ chosen: choice, correct: isCorrect });

    // Никаких side-effects внутри апдейтеров: StrictMode вызывает их дважды,
    // и счёт удваивался бы. streak и lives берём из state (они в deps),
    // answeredRef гарантирует один вызов на вопрос.
    const nextStreak = isCorrect ? streak + 1 : 0;
    setStreak(nextStreak);
    setMaxStreak(m => Math.max(m, nextStreak));
    if (isCorrect) {
      setScore(s => s + 10 + nextStreak * 2);
      setCorrect(c => c + 1);
    }

    if (!isCorrect) {
      setShakingLives(true);
      setTimeout(() => setShakingLives(false), 400);
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => {
          playSessionCompleteIfEnabled();
          setPhase("gameover");
        }, 500);
        return;
      }
    }

    setTimeout(() => advance(qIdx + 1, collection, queue), 500);
  }, [phase, collection, queue, qIdx, streak, lives, advance]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "playing") return;
      const i = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (i !== -1 && choices[i]) handleAnswer(choices[i]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, choices, handleAnswer]);

  const restart = () => {
    if (!collection) return;
    const shuffled = shuffle(collection.cards);
    setQueue(shuffled);
    setQIdx(0);
    setLives(MAX_LIVES);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrect(0);
    setFeedback(null);
    answeredRef.current = false;
    setShakingLives(false);
    setChoices(makeChoices(shuffled[0], collection.cards));
    setPhase("playing");
  };

  if (!collection || queue.length === 0) return null;

  const currentCard = queue[qIdx];

  return (
    <SessionShell
      title={t.words.collectionCard.modal.survival}
      subtitle={collection.name}
      onClose={() => navigate(-1)}
      action={
        <motion.div
          animate={shakingLives ? { x: [0, -5, 5, -4, 4, 0] } : {}}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-1"
          role="img"
          aria-label={`${ss.lives}: ${lives}/${MAX_LIVES}`}
        >
          {Array.from({ length: MAX_LIVES }).map((_, i) => (
            <motion.span key={i} animate={{ scale: i < lives ? 1 : 0.7 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Heart size={20} className={i < lives ? "fill-danger text-danger" : "fill-track text-track"} />
            </motion.span>
          ))}
        </motion.div>
      }
      meta={<span className="text-fg">{ss.score}: {score}</span>}
    >
      <main className="flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-4 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg text-center"
          >
            <p className="text-sm font-medium text-muted">{ss.translate}</p>
            <h2 className="mt-2 font-display text-4xl font-semibold leading-tight text-fg md:text-5xl">{currentCard.word}</h2>
            {currentCard.explanation && <p className="mt-3 line-clamp-2 text-sm italic leading-snug text-muted">{currentCard.explanation}</p>}
          </motion.div>
        </AnimatePresence>

        <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
          {choices.map((choice, i) => (
            <ChoiceButton
              key={`${qIdx}-${i}`}
              label={choice}
              hint={String(i + 1)}
              state={choiceState(choice, feedback?.chosen ?? null, currentCard.translation)}
              onClick={() => handleAnswer(choice)}
            />
          ))}
        </div>

        <div className="flex items-center gap-5 text-sm font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <Check size={16} /> {correct}
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1.5 text-accent-ink">
              <Flame size={16} /> {streak}
            </span>
          )}
        </div>
      </main>

      <SessionResult
        open={phase === "gameover"}
        icon={<Heart size={26} />}
        tone="danger"
        title={ss.gameOver}
        metrics={[
          { label: ss.score, value: score, tone: "accent" },
          { label: ss.correct, value: correct, tone: "success" },
          { label: ss.bestStreak, value: maxStreak },
        ]}
        againLabel={ss.again}
        exitLabel={ss.exit}
        onAgain={restart}
        onExit={() => navigate(-1)}
      />
    </SessionShell>
  );
}
