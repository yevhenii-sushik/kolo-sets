import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collection, TaskType, QuizStats, QuizSettings } from "../../types";
import { getCollection, updateCollectionMeta } from "../../utils/storage";
import { AnswerVerdict, checkAnswer } from "../../utils/answerCheck";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { playSound } from "../../utils/sounds";
import { generateQuizQuestions, QuizQuestion } from "../../utils/quizGenerator";
import QuizQuestionComponent from "../../components/quiz/QuizQuestion";
import QuizStatsModal from "../../components/quiz/QuizStatsModal";
import QuizSettingsModal from "../../components/quiz/QuizSettingsModal";
import { Check, Settings, X } from "lucide-react";
import { IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import SessionLoadError from "../../components/session/SessionLoadError";
import { useI18n } from "../../contexts/I18nContext";

// Учесть ответ в статистике. Без мутаций: StrictMode вызывает апдейтер дважды, и ошибки задваивались
function tally(prev: QuizStats, type: TaskType, correct: boolean, mistake?: QuizStats["mistakes"][number]): QuizStats {
  const byType = prev.byTaskType[type] ?? { correct: 0, total: 0 };
  return {
    ...prev,
    correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
    wrongAnswers: prev.wrongAnswers + (correct ? 0 : 1),
    mistakes: !correct && mistake ? [...prev.mistakes, mistake] : prev.mistakes,
    byTaskType: { ...prev.byTaskType, [type]: { correct: byType.correct + (correct ? 1 : 0), total: byType.total + 1 } },
  };
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { reportSession } = useData();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  // Разбор письменного ответа: «почти» (артикль, диакритика, опечатка) тоже засчитывается
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [stats, setStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    byTaskType: {},
    duration: 0,
    mistakes: [],
  });
  const [startTime] = useState(Date.now());
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    enabledTaskTypes: [
      TaskType.WORD_BY_TRANSLATION,
      TaskType.TRANSLATION_BY_WORD,
      TaskType.WORD_BY_EXPLANATION,
      TaskType.WRITE_WORD_BY_TRANSLATION,
      TaskType.WRITE_WORD_BY_EXPLANATION,
    ],
  });

  useEffect(() => {
    const loadCollection = async () => {
      if (!id) return;
      setLoadError(false);
      try {
        const loaded = await getCollection(id);
        if (loaded && loaded.cards.length >= 4) {
          setCollection(loaded);
          initializeQuiz(loaded, settings);
        } else {
          navigate("/");
        }
      } catch (err) {
        console.error("Не удалось загрузить набор", err);
        setLoadError(true);
      }
    };
    loadCollection();
  }, [id, navigate, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeQuiz = (coll: Collection, quizSettings: QuizSettings) => {
    const generatedQuestions = generateQuizQuestions(coll.cards, quizSettings);
    setQuestions(generatedQuestions);
    setStats((prev) => ({
      ...prev,
      totalQuestions: generatedQuestions.length,
    }));
  };

  if (loadError) return <SessionLoadError onRetry={() => setReloadKey((k) => k + 1)} onExit={() => navigate(-1)} />;
  if (!collection || questions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">{t.loading}</div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    // Matching completes its own UI flow — just update stats silently
    if (currentQuestion.type === TaskType.MATCHING) {
      setStats(prev => tally(prev, currentQuestion.type, true));
      return;
    }

    setUserAnswer(answer);
    const isWrite = currentQuestion.type === TaskType.WRITE_WORD_BY_TRANSLATION || currentQuestion.type === TaskType.WRITE_WORD_BY_EXPLANATION;
    // Варианты ответа сравниваем как есть; письменный ответ — мягко (src/utils/answerCheck.ts).
    // Слова других карточек передаём, чтобы «hand» вместо «hund» не сошло за опечатку
    const result: AnswerVerdict = isWrite
      ? checkAnswer(answer, currentQuestion.correctAnswer, collection.cards.map((c) => c.word))
      : { result: answer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase() ? "exact" : "wrong" };
    const correct = result.result !== "wrong";
    setVerdict(result);
    setIsCorrect(correct);
    setShowFeedback(true);

    playSound(correct ? "answer-correct" : "answer-wrong");

    setStats(prev =>
      tally(prev, currentQuestion.type, correct, {
        question: currentQuestion.question,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        taskType: currentQuestion.type,
      }),
    );
  };

  // «Мой ответ верный»: проверка не знает всех синонимов — даём засчитать ответ вручную
  const handleOverride = () => {
    if (!showFeedback || isCorrect) return;
    playSound("answer-correct");
    setIsCorrect(true);
    setVerdict({ result: "exact" });
    setStats((prev) => {
      const byType = prev.byTaskType[currentQuestion.type];
      return {
        ...prev,
        correctAnswers: prev.correctAnswers + 1,
        wrongAnswers: prev.wrongAnswers - 1,
        mistakes: prev.mistakes.slice(0, -1),
        byTaskType: byType ? { ...prev.byTaskType, [currentQuestion.type]: { ...byType, correct: byType.correct + 1 } } : prev.byTaskType,
      };
    });
  };

  // Тест завершается один раз, даже если «Далее» нажали дважды
  const finishedRef = useRef(false);

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setShowFeedback(false);
      setIsCorrect(false);
      setVerdict(null);
    } else {
      if (finishedRef.current) return;
      finishedRef.current = true;
      // Quiz завершен
      const duration = Math.floor((Date.now() - startTime) / 1000);
      // Только дата занятия, а не весь набор: старая копия карточек затёрла бы интервалы, обновлённые
      // в другой вкладке. Не ждём сети — офлайн итоги иначе не показались бы
      updateCollectionMeta(collection, { lastStudied: new Date() }).catch((err) =>
        console.error("Не удалось сохранить дату занятия", err),
      );

      const finalStats = { ...stats, duration };
      setStats(finalStats);

      // Итоги — сразу; прогресс, серию и достижения начисляет сервер в фоне
      playSound("session-complete");
      setShowStats(true);

      if (user && collection) {
        await reportSession({
          kind: "quiz",
          collectionIds: [collection.id],
          cards: finalStats.totalQuestions,
          correct: finalStats.correctAnswers,
          durationSec: duration,
        });
      }

    }
  };

  const handleRestart = () => {
    finishedRef.current = false;
    initializeQuiz(collection, settings);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setIsCorrect(false);
    setVerdict(null);
    setStats({
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      byTaskType: {},
      duration: 0,
      mistakes: [],
    });
    setShowStats(false);
  };

  const handleSettingsChange = (newSettings: QuizSettings) => {
    finishedRef.current = false;
    setSettings(newSettings);
    setShowSettings(false);
    initializeQuiz(collection, newSettings);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setIsCorrect(false);
    setVerdict(null);
    setStats({
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      byTaskType: {},
      duration: 0,
      mistakes: [],
    });
  };

  return (
    <SessionShell
      title={collection.name}
      onClose={() => navigate(-1)}
      action={
        <IconButton label={t.words.quiz.settings.title} onClick={() => setShowSettings(true)}>
          <Settings size={20} />
        </IconButton>
      }
      progress={(currentIndex + 1) / questions.length}
      meta={
        <>
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="flex items-center gap-1 text-success">
            <Check size={15} strokeWidth={3} />
            {stats.correctAnswers}
          </span>
          <span className="flex items-center gap-1 text-danger">
            <X size={15} strokeWidth={3} />
            {stats.wrongAnswers}
          </span>
        </>
      }
    >
      {/* my-auto — по центру, пока помещается; иначе прокрутка */}
      <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6 sm:px-6">
        <div className="my-auto">
        <QuizQuestionComponent
          question={currentQuestion}
          userAnswer={userAnswer}
          showFeedback={showFeedback}
          isCorrect={isCorrect}
          verdict={verdict}
          onOverride={handleOverride}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
        </div>
      </main>

      {/* Модальные окна */}
      <QuizStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate(-1)}
        onRestart={handleRestart}
      />
      <QuizSettingsModal
        isOpen={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsChange}
      />
    </SessionShell>
  );
}
