import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Settings, X, Zap } from "lucide-react";
import { Card, Collection, KnowledgeLevel } from "../../types";
import { getCollection } from "../../utils/storage";
import { AnswerVerdict, checkAnswer } from "../../utils/answerCheck";
import { AnswerOutcome, isNewCard, levelForAnswer, memoryStrength } from "../../utils/srs";
import { shuffle } from "../../utils/gameUtils";
import { useSrsWriter } from "../../components/session/useSrsWriter";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { getSoundEnabled, playSound, semitones } from "../../utils/sounds";
import { hasVoiceFor } from "../../utils/tts";
import {
  QuizQuestion,
  QuizSettings,
  SetProgress,
  buildQuestions,
  isSetPassed,
  isTyping,
  pickQuizCards,
  portionSize,
  questionFor,
  recordHistory,
  setProgress,
  streakPitch,
  synonymsOf,
} from "../../quiz/plan";
import { markAnswer, readChecks, readHistory, readQuizPrefs, saveHistory, saveQuizPrefs } from "../../quiz/storage";
import QuizQuestionComponent, { QuizFeedback } from "../../components/quiz/QuizQuestion";
import QuizStatsModal, { QuizContext, QuizGrowth } from "../../components/quiz/QuizStatsModal";
import QuizSettingsModal from "../../components/quiz/QuizSettingsModal";
import { Badge, IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import SessionLoadError from "../../components/session/SessionLoadError";
import SessionLoading from "../../components/session/SessionLoading";
import LeaveSessionDialog from "../../components/session/LeaveSessionDialog";

const AUTO_NEXT_MS = 650; // как в Perigee: успеть увидеть зелёный, и дальше

// Тест или работа над ошибками после него (docs/specs/perigee.md, «Тест: понятность и честность»)
interface Run {
  practice: boolean;
  questions: QuizQuestion[]; // в работе над ошибками неверно отвеченное слово добавляется в конец
  words: number; // разных слов
}

// Первый ответ на слово — в тесте он один на слово, в работе над ошибками — первый из попыток
interface Answer {
  question: QuizQuestion;
  answer: string;
  correct: boolean;
  overruled: boolean;
}

// Расписание: версия карточки до первого ответа — для «Мой ответ верный» и итогов «стали крепче»
interface First {
  before: Card;
  level?: KnowledgeLevel; // что записано; нет — ответ в расписание не пошёл (ошибка на новом слове)
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const q = t.words.quiz;
  const { reportSession, voiceForCollection } = useData();
  const writer = useSrsWriter();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [prefs, setPrefs] = useState<QuizSettings>(readQuizPrefs);
  const [run, setRun] = useState<Run | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<QuizFeedback | null>(null);
  const [synonym, setSynonym] = useState<{ word: string; translation: string } | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [cleared, setCleared] = useState(0); // работа над ошибками: слов, отвеченных верно
  const [finished, setFinished] = useState(false);
  const [duration, setDuration] = useState(0);
  const [growth, setGrowth] = useState<QuizGrowth | null>(null);
  const [context, setContext] = useState<QuizContext | null>(null);
  const [setInfo, setSetInfo] = useState<SetProgress | null>(null); // путь по набору на начало теста — в шапке
  // Серия верных ответов подряд. Ответы проверены, а не оценены самим человеком, поэтому серию можно
  // показывать (правило: никаких серий за самооценку). «Мой ответ верный» серию не продлевает
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [nextCount, setNextCount] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const startRef = useRef(Date.now());
  const askedRef = useRef(new Set<string>()); // слова, уже спрошенные в тестах этого захода — для «Следующих 20»
  const firstRef = useRef(new Map<string, First>());
  const finishedRef = useRef(false); // тест завершается один раз, даже если «Дальше» нажали дважды
  const timer = useRef<ReturnType<typeof setTimeout>>();
  // Автопереход вызывает свежую версию next: за 650 мс ответ уже попал в состояние
  const nextRef = useRef<() => void>(() => {});

  useEffect(() => () => clearTimeout(timer.current), []);

  // Актуальные карточки: после ответов writer держит новые интервалы — по ним приоритеты следующего теста
  const latestCards = (col: Collection) => writer.collections().find((c) => c.id === col.id)?.cards ?? col.cards;

  const reset = () => {
    clearTimeout(timer.current);
    setIndex(0);
    setFeedback(null);
    setSynonym(null);
    setAnswers([]);
    setCleared(0);
    setFinished(false);
    setGrowth(null);
    setContext(null);
    setStreak(0);
    setBestStreak(0);
    setConfirmLeave(false);
    finishedRef.current = false;
    firstRef.current.clear();
    startRef.current = Date.now();
  };

  // Вопрос на слух — только если есть голос для языка набора и звук не выключен в настройках
  const canListen = (col: Collection) => getSoundEnabled() && hasVoiceFor(voiceForCollection(col));

  const startTest = (col: Collection, settings: QuizSettings) => {
    const cards = latestCards(col);
    const checks = readChecks(col.id);
    const picked = pickQuizCards(cards, { length: settings.length, checks, exclude: askedRef.current });
    reset();
    setSetInfo(setProgress(cards, checks));
    setRun({ practice: false, questions: buildQuestions(picked, settings.answers, cards, { canListen: canListen(col) }), words: picked.length });
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoadError(false);
    getCollection(id)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded || loaded.cards.length < 4) {
          navigate("/");
          return;
        }
        writer.load([loaded]);
        askedRef.current.clear();
        setCollection(loaded);
        startTest(loaded, prefs);
      })
      .catch((err) => {
        console.error("Не удалось загрузить набор", err);
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) return <SessionLoadError onRetry={() => setReloadKey((k) => k + 1)} onExit={() => navigate(-1)} />;
  if (!collection || !run || run.questions.length === 0) return <SessionLoading onExit={() => navigate(-1)} />;

  const col = collection;
  const current = run.questions[Math.min(index, run.questions.length - 1)];
  const pool = col.cards;
  const correctCount = answers.filter((a) => a.correct).length;

  // Первый ответ на слово в тесте — в расписание Perigee. Ошибка на слове, которого человек ещё не видел,
  // туда не идёт: она ничего не говорит о памяти, а сразу ставила бы новое слово «на завтра» в обход
  // дневного лимита новых слов. Познакомит с ним Perigee — карточкой, как положено
  const recordFirst = (card: Card, outcome: AnswerOutcome) => {
    const before = writer.card(col.id, card.id) ?? card;
    const level = levelForAnswer(outcome);
    if (isNewCard(before) && level === KnowledgeLevel.FORGOT) {
      firstRef.current.set(card.id, { before });
      return;
    }
    writer.record(col.id, card.id, level);
    firstRef.current.set(card.id, { before, level });
  };

  const handleAnswer = (answer: string) => {
    if (feedback || finished) return;
    const question = current;
    const card = question.card;
    const typing = isTyping(question.type);
    // Варианты сравниваем как есть; письменный ответ — мягко (src/utils/answerCheck.ts).
    // Слова других карточек передаём, чтобы «hand» вместо «hund» не сошло за опечатку
    const verdict: AnswerVerdict = typing
      ? checkAnswer(answer, question.correctAnswer, pool.map((c) => c.word))
      : { result: answer === question.correctAnswer ? "exact" : "wrong" };

    // Другое слово набора с тем же переводом — не ошибка, но спрашиваем это слово: подсказка, поле открыто
    if (typing && verdict.result === "wrong") {
      const other = synonymsOf(card, pool).find((w) => checkAnswer(answer, w).result !== "wrong");
      if (other) {
        setSynonym({ word: other, translation: card.translation });
        return;
      }
    }

    const correct = verdict.result !== "wrong";
    const first = !answers.some((a) => a.question.card.id === card.id);
    if (first) {
      setAnswers((prev) => [...prev, { question, answer, correct, overruled: false }]);
      if (!run.practice) {
        recordFirst(card, typing ? { kind: "type", result: verdict.result } : { kind: "choice", correct });
        markAnswer(col.id, card.id, correct, pool.map((c) => c.id));
      }
    }
    // Серия — только в самом тесте; звук «верно» с каждой ступенью серии чуть выше
    const nextStreak = !run.practice && correct ? streak + 1 : 0;
    if (!run.practice) {
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
    }
    if (run.practice) {
      // Работа над ошибками: неверно — слово вернётся в конце, пока не ответишь верно
      if (correct) setCleared((n) => n + 1);
      else setRun((r) => r && { ...r, questions: [...r.questions, questionFor(card, prefs.answers, pool, { canListen: canListen(col) })] });
    }

    const auto = verdict.result === "exact";
    setSynonym(null);
    setFeedback({ answer, verdict, correct, auto });
    if (correct) playSound("answer-correct", { rate: semitones(streakPitch(nextStreak)) });
    else playSound("answer-wrong");
    if (auto) timer.current = setTimeout(() => nextRef.current(), AUTO_NEXT_MS);
  };

  // «Мой ответ верный»: проверка не знает всех синонимов — даём засчитать ответ вручную. В расписании —
  // «Помню», как за ответ с опечаткой. В бонус за тест без ошибок такой ответ не идёт: это самооценка
  const handleOverride = () => {
    if (!feedback || feedback.correct) return;
    const question = current;
    const card = question.card;
    playSound("answer-correct");
    setFeedback({ ...feedback, correct: true, overruled: true, verdict: { result: "exact" }, auto: false });
    setAnswers((prev) => prev.map((a) => (a.question === question ? { ...a, correct: true, overruled: true } : a)));
    if (run.practice) {
      // Слово уже поставлено в конец как ошибка — убираем этот повтор
      setCleared((n) => n + 1);
      setRun((r) => {
        if (!r) return r;
        const last = r.questions.map((x) => x.card.id).lastIndexOf(card.id);
        return last > index ? { ...r, questions: r.questions.filter((_, i) => i !== last) } : r;
      });
      return;
    }
    const f = firstRef.current.get(card.id);
    if (f) {
      if (f.level) writer.restore(col.id, f.before);
      writer.record(col.id, card.id, KnowledgeLevel.REMEMBER);
      firstRef.current.set(card.id, { ...f, level: KnowledgeLevel.REMEMBER });
    }
    markAnswer(col.id, card.id, true, pool.map((c) => c.id));
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationSec = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    setDuration(durationSec);

    if (!run.practice) {
      // Оценки вместе с датой занятия сохраняет writer. Сети не ждём: офлайн итоги иначе не показались бы
      writer.commit();
      for (const question of run.questions) askedRef.current.add(question.card.id);
      const g: QuizGrowth = { introduced: 0, grew: 0, tomorrow: 0 };
      for (const [cardId, f] of firstRef.current) {
        if (!f.level) continue;
        const after = writer.card(col.id, cardId);
        const before = memoryStrength(f.before);
        const now = after ? memoryStrength(after) : before;
        if (before === 0 && now > 0) g.introduced += 1;
        else if (before > 0 && now > before) g.grew += 1;
        if (f.level === KnowledgeLevel.FORGOT) g.tomorrow += 1;
      }
      setGrowth(g);

      // Счёт в контексте: прошлый тест по набору, рекорд, путь по набору и «Набор сдан»
      const cards = latestCards(col);
      const progress = setProgress(cards, readChecks(col.id));
      const pct = answers.length > 0 ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : 0;
      const { history, previous, record } = recordHistory(readHistory(col.id), pct, answers.length, cards.length);
      saveHistory(col.id, history);
      setContext({ previous, record, bestStreak, set: progress, passed: isSetPassed(progress) });
    }
    const remaining = latestCards(col).filter((c) => !askedRef.current.has(c.id)).length;
    setNextCount(remaining > 0 ? portionSize(remaining, prefs.length) : 0);

    playSound("session-complete");
    setFinished(true);

    // Прогресс, серию и достижения начисляет сервер в фоне. Засчитанное вручную в счёт не идёт: иначе
    // «Мой ответ верный» открывал бы бонус за тест без ошибок. Работа над ошибками — практика, не тест
    if (user) {
      const right = answers.filter((a) => a.correct && !a.overruled).length;
      reportSession({
        kind: "quiz",
        collectionIds: [col.id],
        cards: answers.length,
        correct: right,
        durationSec,
        ...(run.practice ? { practice: true } : {}),
      }).catch((err) => console.error("Не удалось отправить тренировку", err));
    }
  };

  const next = () => {
    clearTimeout(timer.current);
    if (!feedback || finishedRef.current) return;
    if (index < run.questions.length - 1) {
      setIndex(index + 1);
      setFeedback(null);
      setSynonym(null);
    } else {
      finish();
    }
  };
  nextRef.current = next;

  const startPractice = () => {
    const missed = answers.filter((a) => !a.correct).map((a) => a.question.card);
    reset();
    setRun({ practice: true, questions: buildQuestions(shuffle(missed), prefs.answers, pool, { canListen: canListen(col) }), words: missed.length });
  };

  // Пока не дан первый ответ, новые настройки пересобирают тест сразу; потом — со следующего теста
  const locked = run.practice || answers.length > 0 || !!feedback;
  const changePrefs = (nextPrefs: QuizSettings) => {
    setPrefs(nextPrefs);
    saveQuizPrefs(nextPrefs);
    if (!locked && !finished) startTest(col, nextPrefs);
  };

  // «Начал — закончи»: брошенный тест не засчитывается, поэтому с середины спрашиваем. Работа над
  // ошибками — по желанию, тест уже засчитан
  const exit = () => navigate(-1);
  const requestExit = () => (!run.practice && !finished && answers.length > 0 ? setConfirmLeave(true) : exit());

  const progress = run.practice ? cleared / run.words : answers.length / run.words;
  const voice = voiceForCollection(col);
  // Путь по набору в шапке — когда тест уже что-то проверил: цель «сдать набор» видна с начала
  const setLine =
    setInfo && setInfo.right + setInfo.wrong > 0 ? q.setLine.replace("{n}", String(setInfo.right)).replace("{total}", String(setInfo.total)) : undefined;

  return (
    <SessionShell
      perigee={!run.practice}
      title={col.name}
      subtitle={run.practice ? q.practiceTitle : setLine}
      onClose={requestExit}
      action={
        <IconButton label={q.settings.title} onClick={() => setShowSettings(true)}>
          <Settings size={20} />
        </IconButton>
      }
      progress={progress}
      meta={
        run.practice ? (
          <span>
            {cleared} / {run.words}
          </span>
        ) : (
          <>
            <span>
              {Math.min(index + 1, run.questions.length)} / {run.questions.length}
            </span>
            <span className="flex items-center gap-1 text-success">
              <Check size={15} strokeWidth={3} />
              {correctCount}
            </span>
            <span className="flex items-center gap-1 text-danger">
              <X size={15} strokeWidth={3} />
              {answers.length - correctCount}
            </span>
            {/* Серия с трёх подряд; каждое новое верное — короткий «щелчок» значка */}
            {streak >= 3 && (
              <motion.span key={streak} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                <Badge tone="accent">
                  <Zap size={12} />
                  {q.streak.replace("{n}", String(streak))}
                </Badge>
              </motion.span>
            )}
          </>
        )
      }
    >
      {/* my-auto — по центру, пока помещается; иначе прокрутка */}
      <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6 sm:px-6">
        <div className="my-auto">
          <QuizQuestionComponent
            key={`${run.practice ? "p" : "t"}${index}`}
            question={current}
            feedback={feedback}
            synonym={synonym}
            voice={voice}
            speakable={hasVoiceFor(voice)}
            onOverride={handleOverride}
            onAnswer={handleAnswer}
            onNext={next}
          />
        </div>
      </main>

      <QuizStatsModal
        isOpen={finished}
        practice={run.practice}
        total={run.practice ? run.words : answers.length}
        correct={correctCount}
        duration={duration}
        mistakes={answers.filter((a) => !a.correct)}
        growth={growth}
        context={context}
        nextCount={nextCount}
        onPractise={startPractice}
        onNext={() => startTest(col, prefs)}
        onClose={exit}
      />
      <QuizSettingsModal isOpen={showSettings} settings={prefs} locked={locked && !finished} onClose={() => setShowSettings(false)} onChange={changePrefs} />
      <LeaveSessionDialog
        open={confirmLeave && !finished}
        done={answers.length}
        total={run.words}
        onStay={() => setConfirmLeave(false)}
        onLeave={exit}
      />
    </SessionShell>
  );
}
