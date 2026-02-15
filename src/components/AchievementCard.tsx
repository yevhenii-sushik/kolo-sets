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
  return (
    <div
      className={`rounded-lg p-4 border-2 transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-400 dark:border-yellow-600'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`text-4xl ${!isUnlocked && 'grayscale'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            {achievement.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {achievement.description}
          </p>

          {/* Прогресс */}
          {!isUnlocked && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>
                  {progress.current} / {progress.target}
                </span>
                <span>{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Разблокировано */}
          {isUnlocked && achievement.unlockedAt && (
            <div className="text-xs text-yellow-700 dark:text-yellow-400">
              ✓ Разблокировано {new Date(achievement.unlockedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
