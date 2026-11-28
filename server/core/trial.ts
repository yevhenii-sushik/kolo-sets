// Пробный режим (шаг 16 в docs/specs/06-audit-fixes.md): аккаунт без входа — анонимный вход Firebase.
// Прогресс такого аккаунта живёт только на устройстве: потерял устройство или очистил браузер — войти в него
// больше нельзя. Поэтому пробный аккаунт, который 30 дней никто не открывал, удаляется вместе с данными
// (обещано в Условиях и Политике). Так же удаляется новый аккаунт на почту, которую так и не подтвердили
// (решение 2026-11-28, server/core/access.ts); аккаунты до правила не трогаем.
// Чистые функции: даты сервер заранее превращает в ISO-строки.
import { VERIFY_RULE_FROM } from "./access";

const DAY_MS = 86_400_000;

// Сколько дней без входа пробный аккаунт живёт. Меняется только вместе с текстом Условий и Политики
export const TRIAL_IDLE_DAYS = 30;

export interface TrialCandidate {
  uid: string;
  providers: number; // способы входа: у пробного аккаунта их нет, после «Сохранить прогресс» — почта или Google
  providerIds?: string[]; // какие именно: «password», «google.com»
  emailVerified?: boolean;
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

// Почта, которую так и не подтвердили: вход только паролем, адрес не подтверждён, аккаунт создан после правила.
// С Google в способах входа — уже не он (Google подтверждает адрес сам)
export const isUnverifiedAccount = (a: TrialCandidate) =>
  !a.emailVerified &&
  (a.providerIds ?? []).length > 0 &&
  (a.providerIds ?? []).every((p) => p === "password") &&
  time(a.createdAt) >= Date.parse(VERIFY_RULE_FROM);

export type StaleKind = "trial" | "unverified";

// Когда аккаунт в последний раз был жив: открытие приложения обновляет токен, вход — сам вход
export const lastActive = (a: TrialCandidate) => Math.max(time(a.createdAt), time(a.lastSignInAt), time(a.lastRefreshAt));

// Кого удалить сейчас: пробные аккаунты и аккаунты с неподтверждённой почтой без активности дольше срока,
// самые давние первыми. Аккаунт без единой даты не трогаем — не можем доказать, что он заброшен
export function staleAccounts(accounts: TrialCandidate[], now: Date, idleDays = TRIAL_IDLE_DAYS): { uid: string; kind: StaleKind }[] {
  const cutoff = now.getTime() - idleDays * DAY_MS;
  return accounts
    .map((a) => ({ a, kind: isTrialAccount(a) ? ("trial" as const) : isUnverifiedAccount(a) ? ("unverified" as const) : null }))
    .filter((x): x is { a: TrialCandidate; kind: StaleKind } => x.kind !== null && lastActive(x.a) > 0 && lastActive(x.a) < cutoff)
    .sort((x, y) => lastActive(x.a) - lastActive(y.a))
    .map(({ a, kind }) => ({ uid: a.uid, kind }));
}

// Только пробные — как раньше
export const staleTrials = (accounts: TrialCandidate[], now: Date, idleDays = TRIAL_IDLE_DAYS): string[] =>
  staleAccounts(accounts, now, idleDays)
    .filter((x) => x.kind === "trial")
    .map((x) => x.uid);
