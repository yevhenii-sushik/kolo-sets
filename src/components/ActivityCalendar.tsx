import { useEffect, useMemo, useRef, useState } from 'react';
import { StudyDay } from '../types';
import { getActivityIntensity, getActivityWeeks } from '../utils/progress';

interface ActivityCalendarProps {
  studyHistory: StudyDay[];
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const IDEAL_CELL = 13;
const GAP = 3;
const LABEL_COL_WIDTH = 20;
const MIN_WEEKS = 8;
const MAX_WEEKS = 53;

export default function ActivityCalendar({ studyHistory }: ActivityCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Сколько недель уместится + какой размер клетки, чтобы сетка ровно
  // заполняла всю ширину блока без пустого хвоста справа
  const { weeksCount, cellSize } = useMemo(() => {
    const availableForCells = Math.max(containerWidth - LABEL_COL_WIDTH, 0);
    if (availableForCells <= 0) return { weeksCount: MIN_WEEKS, cellSize: IDEAL_CELL };

    const idealWeeks = Math.floor((availableForCells + GAP) / (IDEAL_CELL + GAP));
    const weeks = Math.min(Math.max(idealWeeks, MIN_WEEKS), MAX_WEEKS);
    const size = (availableForCells - (weeks - 1) * GAP) / weeks;

    return { weeksCount: weeks, cellSize: size };
  }, [containerWidth]);

  const weeks = useMemo(
    () => getActivityWeeks(studyHistory, weeksCount),
    [studyHistory, weeksCount],
  );

  const getColorClass = (intensity: number): string => {
    switch (intensity) {
      case 0: return 'bg-gray-200 dark:bg-gray-700';
      case 1: return 'bg-green-200 dark:bg-green-900';
      case 2: return 'bg-green-400 dark:bg-green-700';
      case 3: return 'bg-green-600 dark:bg-green-500';
      case 4: return 'bg-green-800 dark:bg-green-400';
      default: return 'bg-gray-200 dark:bg-gray-700';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex gap-0.75">
        {/* Подписи дней недели: сверху понедельник, снизу воскресенье */}
        <div
          className="flex flex-col gap-0.75 shrink-0"
          style={{ width: LABEL_COL_WIDTH }}
        >
          {DAY_LABELS.map((label) => (
            <span
              key={label}
              className="text-[9px] font-medium text-gray-400 dark:text-gray-500 leading-none flex items-center"
              style={{ height: cellSize }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Недели — колонки слева направо, старые → новые */}
        <div className="flex gap-0.75 flex-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.75 flex-1">
              {week.map((day, dayIndex) =>
                day === null ? (
                  <div
                    key={dayIndex}
                    style={{ height: cellSize }}
                    className="rounded-sm"
                  />
                ) : (
                  <div
                    key={day.date}
                    style={{ height: cellSize }}
                    className={`rounded-sm ${getColorClass(getActivityIntensity(day.sessions))} hover:ring-2 hover:ring-blue-500 cursor-pointer transition-colors`}
                    title={`${formatDate(day.date)}: ${day.sessions} сессий, ${day.cardsStudied} карточек`}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <span>Меньше</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(intensity => (
            <div
              key={intensity}
              className={`w-3.5 h-3.5 rounded-sm ${getColorClass(intensity)}`}
            />
          ))}
        </div>
        <span>Больше</span>
      </div>
    </div>
  );
}
