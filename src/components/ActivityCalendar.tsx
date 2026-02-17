import { StudyDay } from '../types';
import { getActivityIntensity } from '../utils/progress';

interface ActivityCalendarProps {
  data: StudyDay[];
}

export default function ActivityCalendar({ data }: ActivityCalendarProps) {
  // Группируем дни по неделям
  const weeks: StudyDay[][] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  const getColorClass = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return 'bg-gray-200 dark:bg-gray-700';
      case 1:
        return 'bg-green-200 dark:bg-green-900';
      case 2:
        return 'bg-green-400 dark:bg-green-700';
      case 3:
        return 'bg-green-600 dark:bg-green-500';
      case 4:
        return 'bg-green-800 dark:bg-green-400';
      default:
        return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day) => {
                const intensity = getActivityIntensity(day.sessions);
                const colorClass = getColorClass(intensity);

                return (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${colorClass} hover:ring-2 hover:ring-blue-500 cursor-pointer transition-all`}
                    title={`${formatDate(day.date)}: ${day.sessions} сессий, ${day.cardsStudied} карточек`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Легенда */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Меньше</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(intensity => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded-sm ${getColorClass(intensity)}`}
              />
            ))}
          </div>
          <span>Больше</span>
        </div>
      </div>
    </div>
  );
}
