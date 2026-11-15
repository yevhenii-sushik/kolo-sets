import { ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, Pause, Play, Settings, SlidersHorizontal, Sparkles, Trophy } from "lucide-react";
import { Card, Collection, TaskType } from "../../types";
import { getCollection } from "../../utils/storage";
import { levelForAnswer, memoryStrength } from "../../utils/srs";
import { getSoundEnabled, playSound, semitones } from "../../utils/sounds";
import { hasVoiceFor, speakWord, voicesReady } from "../../utils/tts";
import { plural } from "../../utils/plural";
import { getLanguageInfo } from "../../locales/languages";
import { posLabel } from "../../data/partsOfSpeech";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { Button, IconButton, cx } from "../../ui";
import {
  BLITZ_SECONDS,
  BlitzHistory,
  BlitzMode,
  BlitzQuestion,
  COUNTDOWN,
  CORRECT_MS,
  STREAK_STEP,
  WRONG_MS,
  blitzQuestion,
  blitzTier,
  feedsSchedule,
  multiplierFor,
  nextQueue,
  pickBlitzDeck,
  pointsFor,
  recordBlitz,
  startQueue,
} from "../../blitz/plan";
import { readBlitzHistory, readBlitzPrefs, saveBlitzHistory, saveBlitzPrefs } from "../../blitz/storage";
import { GAME_MIN_ANSWERS } from "../../../server/core/xp";
import { useSrsWriter } from "../../components/session/useSrsWriter";
import SessionShell from "../../components/session/SessionShell";
import SessionLoadError from "../../components/session/SessionLoadError";
import SessionLoading from "../../components/session/SessionLoading";
import LeaveSessionDialog from "../../components/session/LeaveSessionDialog";
import ChoiceButton, { choiceState } from "../../components/session/ChoiceButton";
import QuestionCard, { ListenButton, QuestionPrompt, QuestionTag, StreakChip } from "../../components/session/QuestionCard";
import BlitzSettingsModal from "../../components/blitz/BlitzSettingsModal";
import BlitzResultModal, { BlitzOutcome } from "../../components/blitz/BlitzResultModal";

// Блиц (docs/specs/perigee.md, «Блиц: понятность и честность», «Блиц, шаг 2»): минута на мгновенное узнавание.
// Экран старта (что будет, рекорд, как спрашивать) → отсчёт 3-2-1 → раунд → честный итог.
// Свернул приложение — пауза и снова отсчёт: минута идёт, только пока ты на неё смотришь

type Phase = "ready" | "countdown" | "playing" | "paused" | "finished";
interface Feedback {
  chosen: string; // "" — «Не знаю»
  correct: boolean;
}

const TOTAL_MS = BLITZ_SECONDS * 1000;
const KEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];

export default function BlitzPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const b = t.words.blitz;
  const q = t.words.quiz;
  const ss = t.words.session;
  const { reportSession, voiceForCollection } = useData();
  const writer = useSrsWriter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [prefs, setPrefs] = useState(readBlitzPrefs);
  const [phase, setPhase] = useState<Phase>("ready");
  const [deck, setDeck] = useState<Card[]>([]);
  const [question, setQuestion] = useState<BlitzQuestion | null>(null);
  const [turn, setTurn] = useState(0); // номер вопроса — ключ анимации слова
  const [count, setCount] = useState(COUNTDOWN);
  const [remaining, setRemaining] = useState(TOTAL_MS);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answers, setAnswers] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [mistakes, setMistakes] = useState<Card[]>([]);
  const [history, setHistory] = useState<BlitzHistory>({});
  const [outcome, setOutcome] = useState<BlitzOutcome | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const queueRef = useRef<Card[]>([]);
  const deckRef = useRef<Card[]>([]);
  const gradedRef = useRef(new Set<string>()); // первый ответ на слово за раунд — в расписание
  const playedRef = useRef(new Set<string>()); // верно с первого раза в этот заход: «Сыграть ещё» возьмёт следующие слова
  const advanceRef = useRef<ReturnType<typeof setTimeout>>();
  const finishedRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});

  // Переход к следующему вопросу не переживает выход и новый раунд: раньше «Сыграть ещё» сразу после
  // конца ловил старый таймер, и варианты не совпадали со словом
  useEffect(() => () => clearTimeout(advanceRef.current), []);

  const latestCards = (col: Collection) => writer.collections().find((c) => c.id === col.id)?.cards ?? col.cards;
  // На слух — только если есть голос для языка набора и звук не выключен; иначе слово на экране
  const listenable = (col: Collection) => getSoundEnabled() && hasVoiceFor(voiceForCollection(col));
  const modeFor = (col: Collection, mode: BlitzMode): BlitzMode => (mode === "listen" && !listenable(col) ? "forward" : mode);
  const ask = (card: Card | undefined, col: Collection, mode: BlitzMode) =>
    card ? blitzQuestion(card, latestCards(col), mode, { canListen: listenable(col) }) : null;

  // Новый раунд: колода по важности, счёт с нуля, экран старта
  const prepare = (col: Collection, mode: BlitzMode) => {
    clearTimeout(advanceRef.current);
    const d = pickBlitzDeck(latestCards(col), { exclude: playedRef.current });
    const queue = startQueue(d);
    deckRef.current = d;
    queueRef.current = queue;
    gradedRef.current = new Set();
    finishedRef.current = false;
    setDeck(d);
    setQuestion(ask(queue[0], col, mode));
    setTurn(0);
    setRemaining(TOTAL_MS);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswers(0);
    setCorrect(0);
    setFeedback(null);
    setMistakes([]);
    setOutcome(null);
    setConfirmLeave(false);
    setHistory(readBlitzHistory(col.id, mode));
    setPhase("ready");
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadError(false);
    // Голоса ждём вместе с набором: иначе «На слух» в первом раунде не нашёл бы голоса (Chrome отдаёт их не сразу)
    Promise.all([getCollection(id), voicesReady()])
      .then(([loaded]) => {
        if (cancelled) return;
        if (!loaded || loaded.cards.length < 4) {
          navigate(-1);
          return;
        }
        writer.load([loaded]);
        playedRef.current.clear();
        setCollection(loaded);
        prepare(loaded, modeFor(loaded, prefs.mode));
      })
      .catch((err) => {
        console.error("Не удалось загрузить набор", err);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Отсчёт 3-2-1: таймер стартует, когда глаза уже на экране. Каждая цифра — тик, выше и выше
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      setPhase("playing");
      return;
    }
    playSound("timer-tick", { rate: semitones((COUNTDOWN - count) * 2) });
    const timer = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(timer);
  }, [phase, count]);

  // Минута идёт, пока идёт раунд; окно «Закончить?» её останавливает. Считаем по реальному времени,
  // а не по тикам: интервалы в фоне и под нагрузкой опаздывают
  const running = phase === "playing" && !confirmLeave;
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setRemaining((r) => Math.max(0, r - dt));
    }, 100);
    return () => clearInterval(timer);
  }, [running]);

  const seconds = Math.ceil(remaining / 1000);

  // Последние 10 секунд тикают часы, последние три — на тон выше
  useEffect(() => {
    if (phaseRef.current === "playing" && seconds > 0 && seconds <= 10) playSound("timer-tick", { rate: seconds <= 3 ? semitones(2) : 1 });
  }, [seconds]);

  // Свернул приложение или ушёл на другую вкладку — пауза: раньше минута тикала и без тебя
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && (phaseRef.current === "playing" || phaseRef.current === "countdown")) setPhase("paused");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  // Вопрос на слух: слово звучит, как только вопрос на экране (и снова — после паузы)
  const playing = phase === "playing";
  useEffect(() => {
    if (playing && question?.type === TaskType.LISTEN && collection) speakWord(question.card.word, voiceForCollection(collection));
  }, [playing, question]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (deckRef.current.length === 0) return;
    setCount(COUNTDOWN);
    setPhase("countdown");
  };

  const finish = () => {
    if (finishedRef.current || !collection) return;
    finishedRef.current = true;
    clearTimeout(advanceRef.current);
    writer.commit();
    const col = collection;
    const mode = modeFor(col, prefs.mode);
    // Засчитывается раунд от GAME_MIN_ANSWERS ответов — так же решает и сервер
    const counted = answers >= GAME_MIN_ANSWERS;
    const prev = readBlitzHistory(col.id, mode);
    const { history: next, previous, record } = recordBlitz(prev, score, counted);
    if (counted) saveBlitzHistory(col.id, mode, next);
    setOutcome({ tier: blitzTier({ answers, correct, record }), score, answers, correct, bestStreak, previous, best: prev.best, mistakes });
    // Колокол «время вышло», следом — итог (праздничные звуки идут по очереди); рекорд — фанфара
    playSound("time-up");
    if (counted) playSound(record ? "achievement" : "session-complete");
    setPhase("finished");
    if (counted && user) {
      reportSession({ kind: "speed", collectionIds: [col.id], cards: answers, correct, durationSec: BLITZ_SECONDS }).catch((err) =>
        console.error("Не удалось отправить раунд", err),
      );
    }
  };

  useEffect(() => {
    if (phase === "playing" && remaining <= 0) finish();
  }, [phase, remaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = (right: boolean) => {
    if (!collection) return;
    const queue = nextQueue(queueRef.current, deckRef.current, right);
    queueRef.current = queue;
    setQuestion(ask(queue[0], collection, modeFor(collection, prefs.mode)));
    setTurn((n) => n + 1);
    setFeedback(null);
  };

  const handleAnswer = (choice: string) => {
    if (phase !== "playing" || feedback || !question || !collection || confirmLeave) return;
    const col = collection;
    const card = question.card;
    const right = choice === question.correctAnswer;

    // Первый ответ на слово за раунд — в расписание Perigee, если слово уже учится. Новые слова — только
    // для игры: угаданный в спешке перевод о памяти не говорит, а знакомит со словом Perigee
    if (!gradedRef.current.has(card.id)) {
      gradedRef.current.add(card.id);
      if (feedsSchedule(writer.card(col.id, card.id) ?? card)) writer.record(col.id, card.id, levelForAnswer({ kind: "choice", correct: right }));
      if (right) playedRef.current.add(card.id);
    }
    if (!right) setMistakes((m) => (m.some((c) => c.id === card.id) ? m : [...m, card]));

    // Никаких side-effects внутри апдейтеров: StrictMode вызывает их дважды, и счёт удваивался бы
    const nextStreak = right ? streak + 1 : 0;
    const nextMult = multiplierFor(nextStreak);
    if (!right) playSound("answer-wrong");
    else if (nextMult > multiplierFor(streak)) playSound("streak-up", { rate: semitones(STREAK_STEP[nextMult]) });
    else playSound("answer-correct");

    setFeedback({ chosen: choice, correct: right });
    setAnswers((n) => n + 1);
    setStreak(nextStreak);
    setBestStreak((s) => Math.max(s, nextStreak));
    if (right) {
      setScore((s) => s + pointsFor(nextStreak));
      setCorrect((c) => c + 1);
    }
    // Ошибка держит верный ответ на экране дольше, а минута идёт: угадывать невыгодно
    advanceRef.current = setTimeout(() => advance(right), right ? CORRECT_MS : WRONG_MS);
  };

  // Клавиши: 1–4 — вариант, Enter — старт и «Продолжить» после паузы
  keyRef.current = (e: KeyboardEvent) => {
    if (showSettings || confirmLeave) return;
    if (phase === "playing" && !feedback && question) {
      const i = KEYS.indexOf(e.code);
      if (i !== -1 && question.options[i]) handleAnswer(question.options[i]);
    } else if (
      (phase === "ready" || phase === "paused") &&
      e.key === "Enter" &&
      !e.repeat &&
      // Enter на кнопке нажимает её саму: на «Как спрашивать» он открывал бы настройки и сразу запускал раунд
      !(e.target instanceof HTMLElement && e.target.closest("button, a, input, textarea, select"))
    ) {
      e.preventDefault();
      start();
    }
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loadError) return <SessionLoadError onRetry={() => setReloadKey((k) => k + 1)} onExit={() => navigate(-1)} />;
  if (!collection) return <SessionLoading onExit={() => navigate(-1)} />;

  const col = collection;
  const mode = modeFor(col, prefs.mode);
  const canListen = listenable(col);
  const voice = voiceForCollection(col);
  const htmlLang = getLanguageInfo(language).htmlLang;
  const hurry = playing && seconds <= 10;
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const mult = multiplierFor(streak);
  const modeLabel = { forward: b.settings.forward, reverse: b.settings.reverse, mixed: b.settings.mixed, listen: b.settings.listen }[mode];

  // «Начал — закончи»: брошенный раунд не засчитывается, поэтому с середины спрашиваем
  const exit = () => navigate(-1);
  const inRound = phase === "playing" || phase === "paused" || phase === "countdown";
  const requestExit = () => (inRound && answers > 0 ? setConfirmLeave(true) : exit());

  const changePrefs = (next: { mode: BlitzMode }) => {
    setPrefs(next);
    saveBlitzPrefs(next);
    if (phase === "ready") prepare(col, modeFor(col, next.mode));
  };

  // Рекорд набора — в шапке с самого старта; побил его по ходу раунда — видно сразу
  const beaten = history.best !== undefined && score > history.best;
  const subtitle = beaten ? (
    <span className="text-success">
      {b.title} · {b.newRecord}
    </span>
  ) : history.best !== undefined ? (
    `${b.title} · ${b.recordShort.replace("{n}", String(history.best))}`
  ) : (
    b.title
  );

  let body: ReactNode;
  if (phase === "ready") {
    const hasNew = deck.some((c) => !feedsSchedule(c));
    body = (
      <>
        <QuestionCard label={b.ready.label}>
          <QuestionPrompt>{b.title}</QuestionPrompt>
          <p className="relative max-w-sm text-sm text-muted">{b.ready.text}</p>
        </QuestionCard>
        <div className="grid gap-2">
          <InfoRow icon={<Layers size={16} />}>{deck.length > 0 ? plural(htmlLang, deck.length, b.ready.deck) : t.words.collectionCard.modal.needMore}</InfoRow>
          {hasNew && <InfoRow icon={<Sparkles size={16} />}>{b.ready.newOnly}</InfoRow>}
          {history.best !== undefined && (
            <InfoRow icon={<Trophy size={16} />}>
              {b.ready.record.replace("{n}", String(history.best))}
              {history.last !== undefined && ` · ${b.ready.last.replace("{n}", String(history.last))}`}
            </InfoRow>
          )}
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2.5 rounded-2xl bg-inset px-3.5 py-3 text-left text-sm transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <SlidersHorizontal size={16} className="shrink-0 text-accent-ink" />
            <span className="flex-1 text-muted">{b.settings.mode}</span>
            <span className="font-semibold text-fg">{modeLabel}</span>
          </button>
        </div>
        <Button size="lg" fullWidth iconLeft={<Play size={18} />} onClick={start} disabled={deck.length === 0}>
          {b.ready.start}
        </Button>
      </>
    );
  } else if (phase === "countdown") {
    body = (
      <QuestionCard label={b.countdown}>
        <motion.span
          key={count}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="relative font-display text-7xl font-extrabold tabular-nums text-accent-ink"
        >
          {Math.max(1, count)}
        </motion.span>
      </QuestionCard>
    );
  } else if (phase === "paused") {
    body = (
      <>
        <QuestionCard label={b.paused}>
          <Pause size={44} className="relative text-accent-ink" />
          <p className="relative max-w-sm text-sm text-muted">{b.pausedText}</p>
        </QuestionCard>
        <Button size="lg" fullWidth iconLeft={<Play size={18} />} onClick={start}>
          {b.resume}
        </Button>
      </>
    );
  } else if (question) {
    const listening = question.type === TaskType.LISTEN;
    body = (
      <>
        <QuestionCard
          label={q.prompts[question.type]}
          strength={memoryStrength(writer.card(col.id, question.card.id) ?? question.card)}
          // Серия с трёх подряд — с множителем очков
          badge={
            streak >= 3 ? (
              <StreakChip value={streak}>{b.streak.replace("{m}", String(mult)).replace("{n}", String(streak))}</StreakChip>
            ) : undefined
          }
        >
          <motion.div
            key={turn}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="relative grid justify-items-center gap-3"
          >
            {listening && !feedback ? (
              <ListenButton label={q.listenAgain} onClick={() => speakWord(question.card.word, voice)} />
            ) : (
              <QuestionPrompt>{question.prompt}</QuestionPrompt>
            )}
            {question.card.partOfSpeech && <QuestionTag>{posLabel(question.card.partOfSpeech, t.words.pos)}</QuestionTag>}
          </motion.div>
        </QuestionCard>
        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {question.options.map((option, i) => (
              <ChoiceButton
                key={`${turn}-${option}`}
                label={option}
                hint={String(i + 1)}
                state={choiceState(option, feedback ? feedback.chosen : null, question.correctAnswer)}
                onClick={() => handleAnswer(option)}
              />
            ))}
          </div>
          {/* Не знаешь — честная ошибка вместо угадывания. Во время подсветки ответа кнопка прячется, но место
              держит: иначе карточка прыгала бы на каждом вопросе */}
          <Button variant="ghost" size="sm" onClick={() => handleAnswer("")} className={cx("justify-self-center", feedback && "invisible")}>
            {q.dontKnow}
          </Button>
        </div>
      </>
    );
  }

  return (
    <SessionShell
      perigee
      title={col.name}
      subtitle={subtitle}
      onClose={requestExit}
      // Настройки — до старта: пауза посреди минуты ради них давала бы время подумать над вопросом
      action={
        phase === "ready" ? (
          <IconButton label={b.settings.title} onClick={() => setShowSettings(true)}>
            <Settings size={20} />
          </IconButton>
        ) : undefined
      }
      progress={remaining / TOTAL_MS}
      progressTone={hurry ? "danger" : "accent"}
      meta={
        <>
          <span className="text-fg">
            {ss.score} {score}
          </span>
          <span className={hurry ? "text-danger" : undefined}>{clock}</span>
        </>
      }
    >
      {/* На телефоне карточка занимает свободное место, ответы — внизу; на широком экране всё по центру */}
      <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-6 pt-3 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 sm:my-auto sm:flex-none">{body}</div>
      </main>

      <BlitzResultModal
        open={phase === "finished"}
        outcome={outcome}
        voice={voice}
        speakable={hasVoiceFor(voice)}
        onAgain={() => prepare(col, mode)}
        onExit={exit}
      />
      <BlitzSettingsModal isOpen={showSettings} settings={{ mode }} canListen={canListen} onClose={() => setShowSettings(false)} onChange={changePrefs} />
      <LeaveSessionDialog
        open={confirmLeave && phase !== "finished"}
        done={BLITZ_SECONDS - seconds}
        total={BLITZ_SECONDS}
        left={plural(htmlLang, seconds, b.leftSeconds)}
        reward={b.leaveReward.replace("{n}", String(GAME_MIN_ANSWERS))}
        onStay={() => setConfirmLeave(false)}
        onLeave={exit}
      />
    </SessionShell>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-inset px-3.5 py-3 text-sm text-muted">
      <span className="mt-0.5 shrink-0 text-accent-ink">{icon}</span>
      <p className="leading-snug">{children}</p>
    </div>
  );
}
