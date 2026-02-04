import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, TaskType, QuizStats, QuizSettings } from '../types';
import { getCollection, updateCollection } from '../utils/storage';
import { generateQuizQuestions, QuizQuestion } from '../utils/quizGenerator';
import QuizQuestionComponent from '../components/QuizQuestion';
import QuizStatsModal from '../components/QuizStatsModal';
import QuizSettingsModal from '../components/QuizSettingsModal';

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [stats, setStats] = useState<QuizStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    byTaskType: {},
    duration: 0,
    mistakes: []
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
      TaskType.WRITE_WORD_BY_EXPLANATION
    ]
  });

  useEffect(() => {
    if (id) {
      const loaded = getCollection(id);
      if (loaded && loaded.cards.length >= 4) {
        setCollection(loaded);
        initializeQuiz(loaded, settings);
      } else {
        navigate('/');
      }
    }
  }, [id, navigate]);

  const initializeQuiz = (coll: Collection, quizSettings: QuizSettings) => {
    const generatedQuestions = generateQuizQuestions(coll.cards, quizSettings);
    setQuestions(generatedQuestions);
    setStats(prev => ({ 
      ...prev, 
      totalQuestions: generatedQuestions.length 
    }));
  };

  if (!collection || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: string) => {
    setUserAnswer(answer);
    const correct = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    setIsCorrect(correct);
    setShowFeedback(true);

    // Обновляем статистику
    const newStats = { ...stats };
    
    if (correct) {
      newStats.correctAnswers++;
    } else {
      newStats.wrongAnswers++;
      newStats.mistakes.push({
        question: currentQuestion.question,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        taskType: currentQuestion.type
      });
    }

    // // Статистика по типам заданий
    // if (!newStats.byTaskType[currentQuestion.type]) {
    //   newStats.byTaskType[currentQuestion.type] = { correct: 0, total: 0 };
    // }
    // newStats.byTaskType[currentQuestion.type].total++;
    // if (correct) {
    //   newStats.byTaskType[currentQuestion.type].correct++;
    // }

    setStats(newStats);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer('');
      setShowFeedback(false);
      setIsCorrect(false);
    } else {
      // Quiz завершен
      const duration = Math.floor((Date.now() - startTime) / 1000);
      const updatedCollection = {
        ...collection,
        lastStudied: new Date()
      };
      updateCollection(updatedCollection);
      setStats(prev => ({ ...prev, duration }));
      setShowStats(true);
    }
  };

  const handleRestart = () => {
    initializeQuiz(collection, settings);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setStats({
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      byTaskType: {},
      duration: 0,
      mistakes: []
    });
    setShowStats(false);
  };

  const handleSettingsChange = (newSettings: QuizSettings) => {
    setSettings(newSettings);
    setShowSettings(false);
    initializeQuiz(collection, newSettings);
    setCurrentIndex(0);
    setUserAnswer('');
    setShowFeedback(false);
    setIsCorrect(false);
    setStats({
      totalQuestions: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      byTaskType: {},
      duration: 0,
      mistakes: []
    });
  };

  return (
    <div>
      {/* Заголовок и навигация */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
        >
          ← Назад к коллекциям
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {collection.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Режим: Quiz
            </p>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="Настройки Quiz"
          >
            ⚙️ Настройки
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Вопрос {currentIndex + 1} из {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Счетчик правильных/неправильных */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <span className="text-2xl">✓</span>
          <span className="font-bold text-green-700 dark:text-green-400">
            {stats.correctAnswers}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <span className="text-2xl">✗</span>
          <span className="font-bold text-red-700 dark:text-red-400">
            {stats.wrongAnswers}
          </span>
        </div>
      </div>

      {/* Вопрос */}
      <QuizQuestionComponent
        question={currentQuestion}
        userAnswer={userAnswer}
        showFeedback={showFeedback}
        isCorrect={isCorrect}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />

      {/* Модальные окна */}
      <QuizStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate('/')}
        onRestart={handleRestart}
      />

      <QuizSettingsModal
        isOpen={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsChange}
      />
    </div>
  );
}
