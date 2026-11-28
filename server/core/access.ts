// Что можно аккаунту в зависимости от того, кто он (решения пользователя 2026-11-28, docs/specs/06-audit-fixes.md,
// «Ограничения 0.5.0»). Чистые функции: ими пользуются и сервер, и приложение — правило одно.
//
// - проба (анонимный вход): учиться можно, делиться наборами — нет, поддержка — 3 сообщения в день;
// - почта без подтверждения: неделя на подтверждение — те же ограничения, что у пробы; потом «стоп»: приложение
//   просит подтвердить почту, сервер не принимает тренировки. Данные не трогаются;
// - подтверждённая почта или Google: без ограничений, поддержка — 10 сообщений в день;
// - аккаунты, созданные до правила (до VERIFY_RULE_FROM), не трогаем бессрочно: для них всё как раньше.

const DAY_MS = 86_400_000;

// С какого момента действует правило о подтверждении почты. Аккаунты старше — без ограничений и без удаления
// (решение пользователя: существующие не трогаем). Если 0.5.0 выйдет позже — сдвинуть на день выкладки
export const VERIFY_RULE_FROM = "2026-11-28T00:00:00.000Z";
// Сколько дней даётся на подтверждение почты
export const VERIFY_GRACE_DAYS = 7;
// Сообщений в поддержку в сутки
export const SUPPORT_PER_DAY = { full: 10, limited: 3 } as const;

export interface AccountFacts {
  provider: string | null; // способ этого входа: "anonymous", "password", "google.com"…
  emailVerified: boolean;
  createdAt: string | null; // ISO, из Firebase Auth
}

// trial — проба; pending — почта ждёт подтверждения (идёт неделя); locked — неделя прошла;
// verified — почта подтверждена или Google; legacy — старый аккаунт до правила
export type Standing = "trial" | "pending" | "locked" | "verified" | "legacy";

const time = (s: string | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? t : NaN;
};

export function standing(a: AccountFacts, now: Date): Standing {
  if (a.provider === "anonymous") return "trial";
  if (a.emailVerified || a.provider !== "password") return "verified";
  const created = time(a.createdAt);
  // Без даты не наказываем: считаем старым
  if (!Number.isFinite(created) || created < Date.parse(VERIFY_RULE_FROM)) return "legacy";
  return now.getTime() - created >= VERIFY_GRACE_DAYS * DAY_MS ? "locked" : "pending";
}

// Сколько полных дней осталось на подтверждение (для баннера): 7, 6… 1; 0 — уже «стоп»
export function verifyDaysLeft(a: AccountFacts, now: Date): number {
  const created = time(a.createdAt);
  if (!Number.isFinite(created)) return 0;
  const left = VERIFY_GRACE_DAYS * DAY_MS - (now.getTime() - created);
  return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

// Полные права — подтверждённые и старые аккаунты
export const isFull = (s: Standing) => s === "verified" || s === "legacy";

// Создавать ссылки на наборы: публичная страница на нашем адресе — только у подтверждённых
export const canShare = (s: Standing) => isFull(s);

export const supportLimit = (s: Standing) => (isFull(s) ? SUPPORT_PER_DAY.full : SUPPORT_PER_DAY.limited);

// Сервер принимает тренировки у всех, кроме «стопа»
export const canStudy = (s: Standing) => s !== "locked";
