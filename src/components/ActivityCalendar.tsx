import { useEffect, useMemo, useRef, useState } from 'react';
import { StudyDay } from '../types';
import { getActivityIntensity, getActivityWeeks } from '../utils/progress';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageInfo } from '../locales/languages';
import { plural } from '../utils/plural';

interface ActivityCalendarProps {
  studyHistory: StudyDay[];
}

const IDEAL_CELL = 13;
const GAP = 3;
const LABEL_COL_WIDTH = 26;
const MIN_WEEKS = 8;
const MAX_WEEKS = 53;

// Ступени яркости: от пустой дорожки до полного оранжевого
const INTENSITY = ['bg-track', 'bg-accent/25', 'bg-accent/50', 'bg-accent/75', 'bg-accent'];

// Подписи только у пн, ср и пт — как в привычных календарях активности, иначе тесно
const LABELED_ROWS = new Set([0, 2, 4]);

// «Пн», «Mon», «man» — по языку интерфейса; 1 января 2024 — понедельник
const weekdayLabels = (locale: string) =>
  Array.from({ length: 7 }, (_, i) => {
    const label = new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  });

// Дата из ключа YYYY-MM-DD как местная (new Date('YYYY-MM-DD') — это полночь по UTC)
const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function ActivityCalendar({ studyHistory }: ActivityCalendarProps) {
  const { t, language } = useI18n();
  const c = t.profile.calendar;
  const locale = getLanguageInfo(language).htmlLang;
  const dayLabels = useMemo(() => weekdayLabels(locale), [locale]);

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

  const weeks = useMemo(() => getActivityWeeks(studyHistory, weeksCount), [studyHistory, weeksCount]);

  const describe = (day: StudyDay) => {
    const date = parseKey(day.date).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return `${date}: ${plural(locale, day.sessions, c.sessions)}, ${plural(locale, day.cardsStudied, c.cards)}`;
  };

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex gap-0.75">
        {/* Подписи дней недели: сверху понедельник, снизу воскресенье */}
        <div className="flex shrink-0 flex-col gap-0.75" style={{ width: LABEL_COL_WIDTH }}>
          {dayLabels.map((label, i) => (
            <span key={label} className="flex items-center text-2xs leading-none text-faint" style={{ height: cellSize }}>
              {LABELED_ROWS.has(i) ? label : ''}
            </span>
          ))}
        </div>

        {/* Недели — колонки слева направо, старые → новые */}
        <div className="flex flex-1 gap-0.75">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-1 flex-col gap-0.75">
              {week.map((day, dayIndex) =>
                day === null ? (
                  <div key={dayIndex} style={{ height: cellSize }} />
                ) : (
                  <div
                    key={day.date}
                    style={{ height: cellSize }}
                    className={`rounded-sm ${INTENSITY[getActivityIntensity(day.sessions)]}`}
                    title={describe(day)}
                  />
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs text-faint">
        <span>{c.less}</span>
        <div className="flex gap-1">
          {INTENSITY.map((cls) => (
            <div key={cls} className={`h-3 w-3 rounded-sm ${cls}`} />
          ))}
        </div>
        <span>{c.more}</span>
      </div>
    </div>
  );
}
