import { StudyDay } from '../types';

// Получить сегодняшнюю дату в формате YYYY-MM-DD
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Получить вчерашнюю дату в формате YYYY-MM-DD
export const getYesterdayString = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Рассчитать текущий стрик
export const calculateStreak = (studyHistory: StudyDay[]): number => {
  if (studyHistory.length === 0) return 0;

  // Сортируем историю по дате (от новых к старым)
  const sorted = [...studyHistory].sort((a, b) => b.date.localeCompare(a.date));

  const today = getTodayString();
  const yesterday = getYesterdayString();

  // Если сегодня не занимались и вчера тоже - стрик = 0
  if (sorted[0].date !== today && sorted[0].date !== yesterday) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date();

  // Считаем дни подряд с сегодня (или вчера) назад
  for (const day of sorted) {
    const expectedDate = currentDate.toISOString().split('T')[0];
    
    if (day.date === expectedDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Обновить или добавить день изучения
export const updateStudyDay = (
  studyHistory: StudyDay[],
  cardsStudied: number,
  timeSpent: number
): StudyDay[] => {
  const today = getTodayString();
  const existingDayIndex = studyHistory.findIndex(d => d.date === today);

  if (existingDayIndex >= 0) {
    // Обновляем существующий день
    const updated = [...studyHistory];
    updated[existingDayIndex] = {
      ...updated[existingDayIndex],
      sessions: updated[existingDayIndex].sessions + 1,
      cardsStudied: updated[existingDayIndex].cardsStudied + cardsStudied,
      timeSpent: updated[existingDayIndex].timeSpent + timeSpent
    };
    return updated;
  } else {
    // Добавляем новый день
    return [
      ...studyHistory,
      {
        date: today,
        sessions: 1,
        cardsStudied,
        timeSpent
      }
    ];
  }
};

// Получить данные для календаря активности (последние N дней)
export const getActivityCalendarData = (
  studyHistory: StudyDay[],
  days: number = 90
): StudyDay[] => {
  const result: StudyDay[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const existingDay = studyHistory.find(d => d.date === dateStr);

    result.push(
      existingDay || {
        date: dateStr,
        sessions: 0,
        cardsStudied: 0,
        timeSpent: 0
      }
    );
  }

  return result;
};

// Получить интенсивность для календаря (0-4)
export const getActivityIntensity = (sessions: number): number => {
  if (sessions === 0) return 0;
  if (sessions === 1) return 1;
  if (sessions <= 3) return 2;
  if (sessions <= 5) return 3;
  return 4;
};

// Форматировать время
export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}с`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}м`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}ч ${remainingMinutes}м`;
};

// Получить статистику за неделю
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
