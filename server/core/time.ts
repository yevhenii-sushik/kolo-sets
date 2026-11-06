// Дни и часы в часовом поясе пользователя. Ключ дня — 'YYYY-MM-DD', как в истории занятий.

// Неизвестный или пустой часовой пояс — UTC, чтобы кривые данные клиента не роняли сервер
export function safeTimeZone(timeZone: unknown): string {
  if (typeof timeZone !== "string" || !timeZone) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

export function dayKey(date: Date, timeZone: string): string {
  // en-CA форматирует дату как YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function hourIn(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date));
}

// Сдвиг ключа дня на n дней — по календарю, без часов и перехода на летнее время
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Сколько календарных дней между ключами (b − a)
export function daysBetween(a: string, b: string): number {
  const toUtc = (k: string) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}
