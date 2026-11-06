import { StudyDay } from '../types';

// YYYY-MM-DD по местной дате (toISOString дал бы дату по UTC — в UTC+ это вчера)
export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Получить недели (Пн→Вс) для календаря активности: ровно `weeksCount` недель,
// заканчивая текущей неделей. Недели всегда начинаются с понедельника и
// заканчиваются воскресеньем — чтобы в сетке верхняя строка всегда была
// понедельником, а нижняя воскресеньем, независимо от того, какой сегодня
// день. Дни ПОСЛЕ сегодняшнего (в ещё не закончившейся текущей неделе) — null,
// компонент рисует их как пустую заглушку, а не "0 занятий".
export const getActivityWeeks = (
  studyHistory: StudyDay[],
  weeksCount: number
): (StudyDay | null)[][] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ISO день недели: понедельник = 1 ... воскресенье = 7
  const isoDayOfWeek = (d: Date) => ((d.getDay() + 6) % 7) + 1;

  const currentMonday = new Date(today);
  currentMonday.setDate(currentMonday.getDate() - (isoDayOfWeek(today) - 1));

  const startMonday = new Date(currentMonday);
  startMonday.setDate(startMonday.getDate() - (weeksCount - 1) * 7);

  const historyByDate = new Map(studyHistory.map(d => [d.date, d]));

  const weeks: (StudyDay | null)[][] = [];
  for (let w = 0; w < weeksCount; w++) {
    const week: (StudyDay | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(date.getDate() + w * 7 + d);

      if (date > today) {
        week.push(null);
        continue;
      }

      const dateStr = localDateKey(date);
      week.push(
        historyByDate.get(dateStr) ?? {
          date: dateStr,
          sessions: 0,
          cardsStudied: 0,
          timeSpent: 0
        }
      );
    }
    weeks.push(week);
  }

  return weeks;
};

// Получить интенсивность для календаря (0-4)
export const getActivityIntensity = (sessions: number): number => {
  if (sessions === 0) return 0;
  if (sessions === 1) return 1;
  if (sessions <= 3) return 2;
  if (sessions <= 5) return 3;
  return 4;
};

// Длительность на языке интерфейса: «45 s», «12 мин», «1 t 5 min»
export const formatDuration = (locale: string, seconds: number): string => {
  const unit = (value: number, unit: 'second' | 'minute' | 'hour') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(value);
  if (seconds < 60) return unit(Math.round(seconds), 'second');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return unit(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${unit(hours, 'hour')} ${unit(rest, 'minute')}` : unit(hours, 'hour');
};

export const getWeekStats = (studyHistory: StudyDay[]): {
  totalSessions: number;
  totalCards: number;
  totalTime: number;
} => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weekData = studyHistory.filter(day => {
    const dayDate = new Date(day.date);
    return dayDate >= weekAgo && dayDate <= today;
  });

  return {
    totalSessions: weekData.reduce((sum, day) => sum + day.sessions, 0),
    totalCards: weekData.reduce((sum, day) => sum + day.cardsStudied, 0),
    totalTime: weekData.reduce((sum, day) => sum + day.timeSpent, 0)
  };
};
