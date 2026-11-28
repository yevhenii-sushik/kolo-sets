// Пробный режим (шаг 16 в docs/specs/06-audit-fixes.md): аккаунт без входа — анонимный вход Firebase.
// Прогресс такого аккаунта живёт только на устройстве: потерял устройство или очистил браузер — войти в него
// больше нельзя. Поэтому пробный аккаунт, который 30 дней никто не открывал, удаляется вместе с данными
// (обещано в Условиях и Политике). Чистые функции: даты сервер заранее превращает в ISO-строки.

const DAY_MS = 86_400_000;

// Сколько дней без входа пробный аккаунт живёт. Меняется только вместе с текстом Условий и Политики
export const TRIAL_IDLE_DAYS = 30;

export interface TrialCandidate {
  uid: string;
  providers: number; // способы входа: у пробного аккаунта их нет, после «Сохранить прогресс» — почта или Google
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  lastRefreshAt: string | null; // последнее обновление токена — приложение было открыто
}

const time = (s: string | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : 0;
};

// Пробный — ни одного способа входа и нет почты. Сохранённый аккаунт (почта или Google) не трогаем никогда
export const isTrialAccount = (a: TrialCandidate) => a.providers === 0 && !a.email;

// Когда аккаунт в последний раз был жив: открытие приложения обновляет токен, вход — сам вход
export const lastActive = (a: TrialCandidate) => Math.max(time(a.createdAt), time(a.lastSignInAt), time(a.lastRefreshAt));

// Кого удалить сейчас: пробные аккаунты без активности дольше срока, самые давние первыми.
// Аккаунт без единой даты не трогаем — не можем доказать, что он заброшен
export function staleTrials(accounts: TrialCandidate[], now: Date, idleDays = TRIAL_IDLE_DAYS): string[] {
  const cutoff = now.getTime() - idleDays * DAY_MS;
  return accounts
    .filter((a) => isTrialAccount(a) && lastActive(a) > 0 && lastActive(a) < cutoff)
    .sort((a, b) => lastActive(a) - lastActive(b))
    .map((a) => a.uid);
}
