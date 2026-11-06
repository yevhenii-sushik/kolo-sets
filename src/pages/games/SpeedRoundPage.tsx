import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Collection } from "../../types";
import { getCollection } from "../../utils/storage";
import { shuffle, makeChoices } from "../../utils/gameUtils";
import { Check, Flame, Trophy } from "lucide-react";
import { Badge } from "../../ui";
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

const ROUND_DURATION = 60;

function multiplierFor(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

type Phase = "loading" | "playing" | "finished";
interface Feedback { chosen: string; correct: boolean; }

export default function SpeedRoundPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const ss = t.words.session;

  const [phase, setPhase] = useState<Phase>("loading");
  const [collection, setCollection] = useState<Collection | null>(null);
  const [queue, setQueue] = useState<Card[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [choices, setChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    getCollection(id).then(col => {
      if (!col || col.cards.length < 4) { navigate(-1); return; }
      setCollection(col);
      const shuffled = shuffle(col.cards);
      setQueue(shuffled);
      setChoices(makeChoices(shuffled[0], col.cards));
      setPhase("playing");
    });
  }, [id]);

  // Апдейтер — чистый (StrictMode вызывает его дважды);
  // завершение раунда обрабатывает отдельный эффект ниже
  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" || timeLeft > 0) return;
    clearInterval(timerRef.current!);
    playSessionCompleteIfEnabled();
    setPhase("finished");
  }, [timeLeft, phase]);

  const advance = useCallback((nextIdx: number, col: Collection, q: Card[]) => {
    const card = q[nextIdx % q.length];
    setChoices(makeChoices(card, col.cards));
    setQIdx(nextIdx);
    setFeedback(null);
    answeredRef.current = false;
  }, []);

  const handleAnswer = useCallback((choice: string) => {
    if (answeredRef.current || phase !== "playing" || !collection) return;
    answeredRef.current = true;

    const card = queue[qIdx % queue.length];
    const isCorrect = choice === card.translation;

    isCorrect ? playCorrectIfEnabled() : playIncorrectIfEnabled();

    setFeedback({ chosen: choice, correct: isCorrect });
    setTotal(t => t + 1);

    // Никаких side-effects внутри апдейтеров: StrictMode вызывает их дважды,
    // и счёт удваивался бы. Считаем новую серию снаружи.
    const nextStreak = isCorrect ? streak + 1 : 0;
    setStreak(nextStreak);
    setMaxStreak(m => Math.max(m, nextStreak));
    if (isCorrect) {
      setScore(s => s + 10 * multiplierFor(nextStreak));
      setCorrect(c => c + 1);
    }

    setTimeout(() => advance(qIdx + 1, collection, queue), 500);
  }, [phase, collection, queue, qIdx, streak, advance]);

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
    clearInterval(timerRef.current!);
    setQueue(shuffled);
    setQIdx(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setCorrect(0);
    setTotal(0);
    setTimeLeft(ROUND_DURATION);
    setFeedback(null);
    answeredRef.current = false;
    setChoices(makeChoices(shuffled[0], collection.cards));
    // phase === "finished" → "playing" перезапускает таймер-эффект
    setPhase("playing");
  };

  if (phase === "loading" || !collection || queue.length === 0) return null;

  const currentCard = queue[qIdx % queue.length];
  const mult = multiplierFor(streak);
  const hurry = timeLeft <= 10;

  return (
    <SessionShell
      title={t.words.collectionCard.modal.speed}
      subtitle={collection.name}
      onClose={() => navigate(-1)}
      action={
        mult > 1 ? (
          <motion.span key={mult} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Badge tone={mult >= 4 ? "special" : mult >= 3 ? "info" : "accent"}>×{mult}</Badge>
          </motion.span>
        ) : undefined
      }
      progress={timeLeft / ROUND_DURATION}
      progressTone={hurry ? "danger" : "accent"}
      meta={
        <>
          <span className="text-fg">{ss.score}: {score}</span>
          <span className={hurry ? "text-danger" : undefined}>{ss.seconds.replace("{n}", String(timeLeft))}</span>
        </>
      }
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
            <Check size={16} /> {correct}/{total}
          </span>
          {streak > 1 && (
            <span className="flex items-center gap-1.5 text-accent-ink">
              <Flame size={16} /> {streak}
            </span>
          )}
        </div>
      </main>

      <SessionResult
        open={phase === "finished"}
        icon={<Trophy size={26} />}
        title={ss.timeUp}
        metrics={[
          { label: ss.score, value: score, tone: "accent" },
          { label: ss.correct, value: `${correct}/${total}`, tone: "success" },
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
