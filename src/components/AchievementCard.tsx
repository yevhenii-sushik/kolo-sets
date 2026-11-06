import { Check } from 'lucide-react';
import { Achievement } from '../types';
import { useI18n } from '../contexts/I18nContext';
import { Badge, Card, cx } from '../ui';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
}

// Достижение: значок, название, условие; ниже — «Получено» или прогресс до цели
export default function AchievementCard({ achievement, isUnlocked, progress }: AchievementCardProps) {
  const { t } = useI18n();
  const text = t.profile.achievementsList[achievement.id];
  // Выполненным считаем и по флагу, и если прогресс уже дошёл до цели
  const completed = isUnlocked || progress.percentage >= 100;
  // У разовых достижений (ночная тренировка, без ошибок…) шкала «0 / 1» ничего не говорит
  const showProgress = !completed && progress.target > 1;

  return (
    <Card padding="sm" radius="lg" className="flex items-start gap-4">
      <span
        aria-hidden
        className={cx(
          'grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl',
          completed ? 'bg-accent-soft' : 'bg-inset opacity-60 grayscale',
        )}
      >
        {achievement.icon}
      </span>

      <div className="grid min-w-0 flex-1 gap-1">
        <h3 className="font-semibold leading-snug text-fg">{text.name}</h3>
        <p className="text-sm leading-snug text-muted">{text.description}</p>

        {completed && (
          <Badge tone="success" className="mt-1.5 w-fit">
            <Check size={12} strokeWidth={3} />
            {t.profile.unlocked}
          </Badge>
        )}

        {showProgress && (
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums text-faint">
              {progress.current} / {progress.target}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
