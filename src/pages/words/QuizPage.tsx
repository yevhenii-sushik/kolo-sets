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
import { X, Settings } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="flex items-center justify-center h-64">
        <div className="u-title text-xl text-[#7A756E]">{t.loading}</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#F5F2ED] dark:bg-[#0F0E0C] flex flex-col overflow-hidden"
    >
      {/* Header — идентично FlashcardsPage */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div
          className="max-w-6xl mx-auto flex items-center justify-between
                   bg-white/60 dark:bg-[#1A1917]/60 backdrop-blur-xl 
                   p-2 sm:p-3 pr-4 sm:pr-5 rounded-full shadow-sm
                   border border-[#E0DBD3] dark:border-[#2E2C29]"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-xl transition-colors shrink-0 text-[#1A1714] dark:text-[#F0EDE8]"
              title="Назад"
            >
              <X size={20} />
            </button>
            <h1 className="u-title text-lg md:text-xl text-[#1A1714] dark:text-[#F0EDE8] truncate">
              {collection.name}
            </h1>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] hover:bg-[#FF5733] hover:text-white transition-colors"
            title={t.words.quiz.settings.title}
          >
            <Settings size={18} />
            <span className="hidden md:inline text-[13px] font-bold">
              {t.words.quiz.settings.title}
            </span>
          </button>
        </div>
      </div>

      {/* Progress bar — идентично FlashcardsPage */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-1">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="sub-title min-w-10 text-center">
            {currentIndex + 1} / {questions.length}
          </div>
          <div className="flex-1 bg-[#EDEAE4] dark:bg-[#242220] rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-[#FF5733] rounded-full h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="uc-title min-w-10 text-center">
            {Math.round(progress)}%
          </div>

          {/* Correct / wrong counters */}
          <div className="shrink-0 flex gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDEAE4] dark:bg-[#242220] rounded-full">
              <span className="text-sm text-[#22C55E] font-black">✓</span>
              <span className="u-title font-bold text-[#22C55E] text-base">
                {stats.correctAnswers}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EDEAE4] dark:bg-[#242220] rounded-full">
              <span className="text-sm text-red-500 font-black">✗</span>
              <span className="u-title font-bold text-red-500 text-base">
                {stats.wrongAnswers}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Вопрос */}
      <main className="flex-1 min-h-0 overflow-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
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
    </motion.div>
  );
}
