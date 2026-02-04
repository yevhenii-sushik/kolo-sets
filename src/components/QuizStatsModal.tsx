import { QuizStats } from '../types';
import { getTaskTypeName } from '../utils/quizGenerator';

interface QuizStatsModalProps {
  isOpen: boolean;
  stats: QuizStats;
  onClose: () => void;
  onRestart: () => void;
}

export default function QuizStatsModal({
  isOpen,
  stats,
  onClose,
  onRestart
}: QuizStatsModalProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} мин ${secs} сек`;
    }
    return `${secs} сек`;
  };

  const getPercentage = (): number => {
    return stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;
  };

  const percentage = getPercentage();
  let resultEmoji = '🎉';
  let resultText = 'Отлично!';
  let resultColor = 'text-green-600 dark:text-green-400';

  if (percentage < 50) {
    resultEmoji = '😔';
    resultText = 'Нужно еще поработать';
    resultColor = 'text-red-600 dark:text-red-400';
  } else if (percentage < 75) {
    resultEmoji = '🙂';
    resultText = 'Неплохо!';
    resultColor = 'text-yellow-600 dark:text-yellow-400';
  } else if (percentage < 100) {
    resultEmoji = '😊';
    resultText = 'Хорошо!';
    resultColor = 'text-blue-600 dark:text-blue-400';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-8 my-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{resultEmoji}</div>
          <h2 className={`text-3xl font-bold mb-2 ${resultColor}`}>
            {resultText}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Вы ответили на {stats.totalQuestions} вопросов за {formatDuration(stats.duration)}
          </p>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center border-2 border-blue-200 dark:border-blue-800">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-2">
              {stats.totalQuestions}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-400">
              Всего вопросов
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center border-2 border-green-200 dark:border-green-800">
            <div className="text-3xl font-bold text-green-700 dark:text-green-400 mb-2">
              {stats.correctAnswers}
            </div>
            <div className="text-sm text-green-700 dark:text-green-400">
              Правильных ответов
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border-2 border-red-200 dark:border-red-800">
            <div className="text-3xl font-bold text-red-700 dark:text-red-400 mb-2">
              {stats.wrongAnswers}
            </div>
            <div className="text-sm text-red-700 dark:text-red-400">
              Неправильных ответов
            </div>
          </div>
        </div>

        {/* Прогресс */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Точность ответов</span>
            <span className="font-bold">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                percentage >= 75 ? 'bg-green-500' :
                percentage >= 50 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Статистика по типам заданий */}
        {Object.keys(stats.byTaskType).length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Результаты по типам заданий:
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.byTaskType).map(([type, data]) => {
                const typePercentage = Math.round((data.correct / data.total) * 100);
                return (
                  <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {getTaskTypeName(type as any)}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {data.correct}/{data.total} ({typePercentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${typePercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ошибки */}
        {stats.mistakes.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ваши ошибки ({stats.mistakes.length}):
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.mistakes.map((mistake, index) => (
                <div key={index} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {getTaskTypeName(mistake.taskType)}
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    {mistake.question}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-red-600 dark:text-red-400">Ваш ответ:</span>{' '}
                      <span className="font-medium">{mistake.userAnswer || '(пусто)'}</span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Правильный:</span>{' '}
                      <span className="font-medium">{mistake.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Пройти еще раз
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
          >
            ← К коллекциям
          </button>
        </div>
      </div>
    </div>
  );
}
