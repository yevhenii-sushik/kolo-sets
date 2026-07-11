const REMINDER_KEY = 'kolo_reminder_v1';

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

export const getReminderSettings = (): ReminderSettings => {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_KEY) ?? 'null') ?? DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
};

export const saveReminderSettings = (s: ReminderSettings): void => {
  localStorage.setItem(REMINDER_KEY, JSON.stringify(s));
};

export type NotificationAccess = NotificationPermission | 'unsupported';

export const getNotificationAccess = (): NotificationAccess => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;

export const cancelReminder = (): void => {
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
};

// dueCount считаем колбэком В МОМЕНТ срабатывания (а не при планировании),
// иначе число протухает за часы ожидания таймера. Геттер регистрирует
// ReminderScheduler в App; SettingsPage может перепланировать, не зная о нём.
let dueCountGetter: () => number = () => 0;

export const registerDueCountGetter = (fn: () => number): void => {
  dueCountGetter = fn;
};

export const scheduleReminder = (settings: ReminderSettings): void => {
  cancelReminder();
  if (!settings.enabled || !('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const target = new Date();
  target.setHours(settings.hour, settings.minute, 0, 0);
  // Время на сегодня уже прошло — планируем на завтра
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  scheduledTimer = setTimeout(() => {
    scheduledTimer = null;
    try {
      const dueCount = dueCountGetter();
      new Notification('Kolo Sets', {
        body: dueCount > 0
          ? `You have ${dueCount} cards due for review. Keep your streak alive!`
          : 'Time to study! Open Kolo Sets to keep your streak going.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'kolo-daily-reminder',
      });
    } catch {
      // Some browsers restrict Notification constructor
    }
    // Ежедневный повтор: перепланируем на следующее срабатывание,
    // пока вкладка жива
    scheduleReminder(settings);
  }, target.getTime() - now.getTime());
};
