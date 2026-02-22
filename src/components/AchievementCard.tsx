import { Achievement } from '../types';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

export default function AchievementCard({
  achievement,
  isUnlocked,
  progress
}: AchievementCardProps) {
  // Выполненной считаем если пришел флаг ИЛИ если прогресс реально дошел до цели
  const completed = isUnlocked || progress.percentage >= 100;

  return (
    <div
      className={`rounded-3xl p-5 border-2 transition-all duration-500 transform ${
        completed
          ? 'bg-gradient-to-br from-yellow-400/10 via-orange-400/5 to-transparent border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)] dark:border-yellow-600/50'
          : 'bg-white/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-70'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Контейнер для иконки с эффектом свечения при выполнении */}
        <div className="relative">
          <div className={`text-4xl transition-all duration-700 ${
            completed ? 'scale-110 rotate-[5deg] drop-shadow-md' : 'grayscale opacity-50'
          }`}>
            {achievement.icon}
          </div>
          {completed && (
             <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-bold transition-colors ${
            completed ? 'text-yellow-700 dark:text-yellow-400' : 'text-gray-900 dark:text-gray-300'
          } mb-0.5 truncate`}>
            {achievement.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 leading-tight">
            {achievement.description}
          </p>

          {/* Логика прогресс-бара или даты выполнения */}
          {!completed ? (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold tracking-wider uppercase text-gray-400 dark:text-gray-500">
                <span>
                  {progress.current} / {progress.target}
                </span>
                <span>{Math.min(progress.percentage, 99)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-yellow-600/80 dark:text-yellow-500/80 bg-yellow-500/10 w-fit px-2 py-0.5 rounded-lg border border-yellow-500/20">
              <span className="text-xs">✦</span>
              {achievement.unlockedAt 
                ? `Разблокировано ${new Date(achievement.unlockedAt).toLocaleDateString()}`
                : 'Достижение получено'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}