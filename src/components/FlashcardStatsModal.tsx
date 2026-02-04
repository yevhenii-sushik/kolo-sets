import { FlashcardStats } from '../types';

interface FlashcardStatsModalProps {
  isOpen: boolean;
  stats: FlashcardStats;
  onClose: () => void;
  onRestart: () => void;
}

export default function FlashcardStatsModal({
  isOpen,
  stats,
  onClose,
  onRestart
}: FlashcardStatsModalProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins} мин ${secs} сек`;
    }
    return `${secs} сек`;
  };

  const getPercentage = (value: number): number => {
    return stats.totalCards > 0 ? Math.round((value / stats.totalCards) * 100) : 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Сессия завершена!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Вы изучили {stats.totalCards} карточек за {formatDuration(stats.duration)}
          </p>
        </div>

        {/* Статистика по категориям */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Не знаю */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-2 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">😕</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                {stats.dontKnow}
              </div>
            </div>
            <div className="text-sm text-red-700 dark:text-red-400 font-medium">
              Не знаю ({getPercentage(stats.dontKnow)}%)
            </div>
          </div>

          {/* Забыл */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border-2 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">🤔</div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {stats.forgot}
              </div>
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-400 font-medium">
              Забыл ({getPercentage(stats.forgot)}%)
            </div>
          </div>

          {/* Помню */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-2 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">🙂</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {stats.remember}
              </div>
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
              Помню ({getPercentage(stats.remember)}%)
            </div>
          </div>

          {/* Знаю */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">😊</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {stats.know}
              </div>
            </div>
            <div className="text-sm text-green-700 dark:text-green-400 font-medium">
              Знаю ({getPercentage(stats.know)}%)
            </div>
          </div>
        </div>

        {/* Прогресс-бар общий */}
        <div className="mb-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Общий прогресс:
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div className="h-full flex">
              {stats.dontKnow > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${getPercentage(stats.dontKnow)}%` }}
                />
              )}
              {stats.forgot > 0 && (
                <div
                  className="bg-orange-500"
                  style={{ width: `${getPercentage(stats.forgot)}%` }}
                />
              )}
              {stats.remember > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${getPercentage(stats.remember)}%` }}
                />
              )}
              {stats.know > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${getPercentage(stats.know)}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            🔄 Повторить сессию
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
