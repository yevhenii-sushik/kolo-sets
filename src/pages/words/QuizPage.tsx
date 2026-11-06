import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collection, TaskType, QuizStats, QuizSettings } from "../../types";
import { getCollection, updateCollection } from "../../utils/storage";
import { updateQuizStats } from "../../firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import {
  playCorrectIfEnabled,
  playIncorrectIfEnabled,
  playSessionCompleteIfEnabled,
} from "../../utils/sounds";
import { generateQuizQuestions, QuizQuestion } from "../../utils/quizGenerator";
import QuizQuestionComponent from "../../components/quiz/QuizQuestion";
import QuizStatsModal from "../../components/quiz/QuizStatsModal";
import QuizSettingsModal from "../../components/quiz/QuizSettingsModal";
import { Check, Settings, X } from "lucide-react";
import { IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import { useI18n } from "../../contexts/I18nContext";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { checkAchievements, profile } = useData();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
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
      if (id) {
        const loaded = await getCollection(id);
        if (loaded && loaded.cards.length >= 4) {
          setCollection(loaded);
          initializeQuiz(loaded, settings);
        } else {
          navigate("/");
        }
      }
    };
    loadCollection();
  }, [id, navigate]);

  const initializeQuiz = (coll: Collection, quizSettings: QuizSettings) => {
    const generatedQuestions = generateQuizQuestions(coll.cards, quizSettings);
    setQuestions(generatedQuestions);
    setStats((prev) => ({
      ...prev,
      totalQuestions: generatedQuestions.length,
    }));
  };

  if (!collection || questions.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted">{t.loading}</div>
    );
  }

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    // Matching completes its own UI flow — just update stats silently
    if (currentQuestion.type === TaskType.MATCHING) {
      setStats(prev => {
        const next = { ...prev };
        next.correctAnswers++;
        if (!next.byTaskType[currentQuestion.type]) {
          next.byTaskType[currentQuestion.type] = { correct: 0, total: 0 };
        }
        next.byTaskType[currentQuestion.type]!.total++;
        next.byTaskType[currentQuestion.type]!.correct++;
        return next;
      });
      return;
    }

    setUserAnswer(answer);
    const correct =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      playCorrectIfEnabled();
    } else {
      playIncorrectIfEnabled();
    }

    setStats(prev => {
      const next = { ...prev };
      if (correct) {
        next.correctAnswers++;
      } else {
        next.wrongAnswers++;
        next.mistakes.push({
          question: currentQuestion.question,
          userAnswer: answer,
          correctAnswer: currentQuestion.correctAnswer,
          taskType: currentQuestion.type,
        });
      }
      if (!next.byTaskType[currentQuestion.type]) {
        next.byTaskType[currentQuestion.type] = { correct: 0, total: 0 };
      }
      next.byTaskType[currentQuestion.type]!.total++;
      if (correct) next.byTaskType[currentQuestion.type]!.correct++;
      return next;
    });
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Quiz завершен
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const updatedCollection = {
        ...collection,
        lastStudied: new Date(),
      };
      await updateCollection(updatedCollection);

      const finalStats = { ...stats, duration };
      setStats(finalStats);

      // Сохраняем статистику и проверяем достижения
      if (user) {
        try {
          const lastStudy = profile?.lastStudyDate
            ? new Date(
                typeof profile.lastStudyDate.toDate === 'function'
                  ? profile.lastStudyDate.toDate()
                  : profile.lastStudyDate
              )
            : null;
          const isComeback = lastStudy
            ? Date.now() - lastStudy.getTime() > 7 * 24 * 60 * 60 * 1000
            : false;

          await updateQuizStats(
            user.uid,
            finalStats.totalQuestions,
            finalStats.correctAnswers,
            duration,
          );
          checkAchievements({
            duration,
            quizQuestions: finalStats.totalQuestions,
            isComeback,
          });
        } catch (error) {
          console.error("Error updating quiz stats:", error);
        }
      }

      // Воспроизводим звук завершения квиза
      playSessionCompleteIfEnabled();

      setShowStats(true);
    }
  };

  const handleRestart = () => {
    initializeQuiz(collection, settings);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setIsCorrect(false);
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
    setSettings(newSettings);
    setShowSettings(false);
    initializeQuiz(collection, newSettings);
    setCurrentIndex(0);
    setUserAnswer("");
    setShowFeedback(false);
    setIsCorrect(false);
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
