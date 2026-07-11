import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Collection } from "../../types";
import { getCollection } from "../../utils/storage";
import { shuffle, makeChoices } from "../../utils/gameUtils";
import { X, Heart, RotateCcw, Shield } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#F5F2ED] dark:bg-[#0F0E0C] flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3 bg-white/70 dark:bg-[#1A1917]/70 backdrop-blur-xl rounded-4xl px-4 py-3 border border-[#E0DBD3] dark:border-[#2E2C29]">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-[#F0EDE8] dark:hover:bg-[#242220] text-[#7A756E] transition-colors shrink-0"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            <Shield size={15} className="text-[#FF5733]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-[#7A756E]">
              Survival
            </span>
          </div>

          {/* ── Lives ── */}
          <motion.div
            animate={shakingLives ? { x: [0, -5, 5, -4, 4, 0] } : {}}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-1"
          >
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i < lives ? 1 : 0.65 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Heart
                  size={18}
                  className={
                    i < lives
                      ? "fill-red-500 text-red-500"
                      : "text-[#D0CBC4] fill-[#D0CBC4]"
                  }
                />
              </motion.div>
            ))}
          </motion.div>

          <span className="ml-auto text-sm font-black text-[#1A1714] dark:text-[#F0EDE8]">
            {score}
          </span>
        </div>
      </div>

      {/* ── Question ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={qIdx}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-3">
              Translate
            </p>
            <h2 className="text-4xl md:text-5xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-tight">
              {currentCard.word}
              <span className="text-[#FF5733]">.</span>
            </h2>
            {currentCard.explanation && (
              <p className="mt-3 text-sm text-[#7A756E] italic leading-snug line-clamp-2">
                {currentCard.explanation}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── Choices ── */}
        <div className="w-full max-w-lg grid grid-cols-2 gap-3">
          {choices.map((choice, i) => {
            const isChosen = feedback?.chosen === choice;
            const isCorrectChoice = choice === currentCard.translation;

            let cls =
              "bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] hover:border-[#FF5733]/40 text-[#1A1714] dark:text-[#F0EDE8]";
            if (isChosen && feedback?.correct)
              cls = "bg-[#22C55E] border-[#22C55E] text-white";
            else if (isChosen && !feedback?.correct)
              cls = "bg-red-500 border-red-500 text-white";
            else if (feedback && isCorrectChoice && !feedback.correct)
              cls = "bg-[#22C55E]/15 border-[#22C55E] text-[#1A1714] dark:text-[#F0EDE8]";

            return (
              <motion.button
                key={`${qIdx}-${i}`}
                onClick={() => handleAnswer(choice)}
                whileTap={feedback ? {} : { scale: 0.97 }}
                className={`relative py-4 px-4 rounded-2xl border-2 text-left font-bold text-sm transition-all ${cls} ${
                  feedback ? "pointer-events-none" : ""
                }`}
              >
                <span className="absolute top-1.5 left-2.5 text-[9px] font-black text-current opacity-40">
                  {i + 1}
                </span>
                <span className="block pt-1">{choice}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-5 text-[11px] font-bold text-[#B5B0A8]">
          <span>✓ {correct}</span>
          {streak > 1 && <span className="text-[#FF5733]">🔥 {streak}</span>}
        </div>
      </div>

      {/* ── Game over overlay ── */}
      <AnimatePresence>
        {phase === "gameover" && (
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
              <div className="flex justify-center gap-2 mb-5">
                {Array.from({ length: MAX_LIVES }).map((_, i) => (
                  <Heart key={i} size={22} className="fill-[#E0DBD3] text-[#E0DBD3]" />
                ))}
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-1">
                Score
              </p>
              <h2 className="text-5xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] mb-6">
                {score}
                <span className="text-[#FF5733]">.</span>
              </h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Correct", value: correct },
                  { label: "Best streak", value: maxStreak },
                ].map(s => (
                  <div
                    key={s.label}
                    className="bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl p-3"
                  >
                    <div className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
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
                  onClick={restart}
                  className="flex-1 py-3 rounded-2xl bg-[#FF5733] text-white text-xs font-black uppercase tracking-widest hover:bg-[#E54D2A] transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} /> Try again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
