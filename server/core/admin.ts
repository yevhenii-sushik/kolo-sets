// Админ-панель: чистая логика без сети и базы (docs/specs/admin.md).
// На входе — обычный JSON: метки времени Firestore сервер заранее превращает в ISO-строки.
import type { StudyDay } from "../../src/types";

const DAY_MS = 86_400_000;

// Права админа — только claim в подписанном токене; любое другое значение, кроме true, — не админ
export const isAdminClaims = (claims: unknown) =>
  !!claims && typeof claims === "object" && (claims as Record<string, unknown>).admin === true;

// ── Поиск пользователя ──

export type Lookup = { by: "email" | "username" | "uid"; value: string };

// Как в src/utils/username.ts: имя хранится в нижнем регистре
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
// uid в Firebase Auth — до 128 символов; у обычных аккаунтов 28 букв и цифр
const UID_RE = /^[A-Za-z0-9_-]{6,128}$/;

// Что искать по строке из поиска. Порядок важен: строка вида «anna_k» может быть и именем, и uid,
// поэтому сначала пробуем имя, затем uid
export function lookupCandidates(raw: unknown): Lookup[] {
  if (typeof raw !== "string") return [];
  const q = raw.trim();
  if (!q || q.length > 254) return [];
  if (q.includes("@") && !q.startsWith("@")) return [{ by: "email", value: q.toLowerCase() }];
  const at = q.startsWith("@");
  const name = (at ? q.slice(1) : q).toLowerCase();
  const out: Lookup[] = [];
  if (USERNAME_RE.test(name)) out.push({ by: "username", value: name });
  if (!at && UID_RE.test(q)) out.push({ by: "uid", value: q });
  return out;
}

// ── Аккаунты (Firebase Auth) ──

export interface AccountLite {
  uid: string;
  email: string | null;
  name: string | null;
  createdAt: string | null; // ISO
  lastActiveAt: string | null; // ISO; последнее обновление токена — человек открывал приложение
  providers: string[]; // "password", "google.com"…
  verified: boolean;
  disabled: boolean;
}

export interface AccountsSummary {
  total: number;
  verified: number;
  disabled: number;
  new7: number;
  new30: number;
  active1: number;
  active7: number;
  active30: number;
  providers: Record<string, number>;
  byDay: { day: string; signups: number }[]; // дни по UTC, от старого к сегодняшнему
}

const ms = (iso: string | null) => (iso ? Date.parse(iso) : NaN);
const within = (iso: string | null, now: Date, days: number) => {
  const t = ms(iso);
  return Number.isFinite(t) && now.getTime() - t < days * DAY_MS;
};

// Дни — по UTC: у команды и пользователей разные пояса, а сводке нужна одна шкала
export function summarizeAccounts(list: AccountLite[], now: Date, days = 30): AccountsSummary {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const byDay = Array.from({ length: days }, (_, i) => ({
    day: new Date(today - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10),
    signups: 0,
  }));
  const index = new Map(byDay.map((d, i) => [d.day, i]));
  const providers: Record<string, number> = {};
  const s: AccountsSummary = { total: list.length, verified: 0, disabled: 0, new7: 0, new30: 0, active1: 0, active7: 0, active30: 0, providers, byDay };

  for (const a of list) {
    if (a.verified) s.verified++;
    if (a.disabled) s.disabled++;
    if (within(a.createdAt, now, 7)) s.new7++;
    if (within(a.createdAt, now, 30)) s.new30++;
    if (within(a.lastActiveAt, now, 1)) s.active1++;
    if (within(a.lastActiveAt, now, 7)) s.active7++;
    if (within(a.lastActiveAt, now, 30)) s.active30++;
    for (const p of a.providers.length ? a.providers : ["other"]) providers[p] = (providers[p] ?? 0) + 1;
    const i = a.createdAt ? index.get(a.createdAt.slice(0, 10)) : undefined;
    if (i !== undefined) byDay[i].signups++;
  }
  return s;
}

export const newestAccounts = (list: AccountLite[], n: number) =>
  [...list].sort((a, b) => (ms(b.createdAt) || 0) - (ms(a.createdAt) || 0)).slice(0, n);

// ── Профиль ──

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" && v ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export interface OrbitView {
  week: string;
  days: number; // дней с занятиями на этой неделе
  goal: number;
  goalSet: boolean;
  closed: boolean;
  streak: number;
  longest: number;
  shields: number;
}

export interface ProfileView {
  username: string | null;
  displayName: string | null;
  timezone: string | null;
  createdAt: string | null;
  joinedAt: string | null;
  legalVersion: string | null;
  activeCourseId: string | null;
  courses: string[];
  level: number;
  xp: number;
  orbit: OrbitView | null;
  legacyFlames: number;
  loot: { capsules: number; dust: number; pity: number; items: number; medals: string[] };
  achievements: number;
  stats: {
    flashcardSessions: number;
    quizzesTaken: number;
    perfectQuizzes: number;
    gamesPlayed: number;
    totalStudyTime: number; // секунды
    cardsLearned: number;
  };
  lastStudyDay: string | null;
  history: StudyDay[]; // последние дни с занятиями, новые сверху
}

const HISTORY_DAYS = 14;

function orbitView(v: unknown): OrbitView | null {
  if (!isRecord(v) || typeof v.week !== "string") return null;
  return {
    week: v.week,
    days: Array.isArray(v.days) ? v.days.length : 0,
    goal: num(v.goal),
    goalSet: v.goalSet === true,
    closed: v.closed === true,
    streak: num(v.streak),
    longest: num(v.longest),
    shields: num(v.shields),
  };
}

// Профиль может быть старым или неполным: ничего не предполагаем, недостающее — ноль или null
export function profileView(data: unknown): ProfileView {
  const d = isRecord(data) ? data : {};
  const stats = isRecord(d.stats) ? d.stats : {};
  const inventory = isRecord(d.inventory) ? d.inventory : {};
  const history = (Array.isArray(d.studyHistory) ? d.studyHistory : [])
    .filter((h): h is Record<string, unknown> => isRecord(h) && typeof h.date === "string")
    .map((h) => ({ date: h.date as string, sessions: num(h.sessions), cardsStudied: num(h.cardsStudied), timeSpent: num(h.timeSpent) }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, HISTORY_DAYS);

  return {
    username: str(d.username),
    displayName: str(d.displayName),
    timezone: str(d.timezone),
    createdAt: str(d.createdAt),
    joinedAt: str(d.joinedAt),
    legalVersion: isRecord(d.legalAcceptance) ? str(d.legalAcceptance.version) : null,
    activeCourseId: str(d.activeCourseId),
    courses: (Array.isArray(d.courses) ? d.courses : []).map((c) => (isRecord(c) ? str(c.id) : null)).filter((id): id is string => !!id),
    level: num(d.level) || 1,
    xp: num(d.xp),
    orbit: orbitView(d.orbit),
    legacyFlames: num(d.legacyFlames),
    loot: {
      capsules: num(d.capsules),
      dust: num(d.dust),
      pity: num(d.pity),
      items: Object.values(inventory).filter((v) => isRecord(v) && num(v.n) > 0).length,
      medals: (Array.isArray(d.medals) ? d.medals : []).filter((m): m is string => typeof m === "string"),
    },
    achievements: Array.isArray(d.achievements) ? d.achievements.length : 0,
    stats: {
      flashcardSessions: num(stats.flashcardSessions),
      quizzesTaken: num(stats.quizzesTaken),
      perfectQuizzes: num(stats.perfectQuizzes),
      gamesPlayed: num(stats.gamesPlayed),
      totalStudyTime: num(stats.totalStudyTime),
      cardsLearned: num(stats.cardsLearned),
    },
    lastStudyDay: str(d.lastStudyDay),
    history,
  };
}

// ── Учёба: только счётчики ──
// Названия наборов и карточки — личные данные (Политика: «word sets stay private»), в панель не попадают

export interface LearningView {
  sets: number;
  cards: number;
  byCourse: { courseId: string | null; sets: number; cards: number }[]; // null — старые наборы без курса
}

export function learningView(sets: { courseId: unknown; cards: number }[]): LearningView {
  const groups = new Map<string | null, { courseId: string | null; sets: number; cards: number }>();
  for (const s of sets) {
    const id = str(s.courseId);
    const g = groups.get(id) ?? { courseId: id, sets: 0, cards: 0 };
    g.sets++;
    g.cards += s.cards;
    groups.set(id, g);
  }
  return {
    sets: sets.length,
    cards: sets.reduce((n, s) => n + s.cards, 0),
    byCourse: [...groups.values()].sort((a, b) => b.cards - a.cards),
  };
}

// ── Тренировки ──

export interface SessionRow {
  id: string;
  kind: string;
  cards: number;
  correct: number | null;
  durationSec: number;
  day: string | null;
  createdAt: string | null;
  xp: number | null; // сколько опыта начислено
}

export function sessionRow(id: string, data: unknown): SessionRow {
  const d = isRecord(data) ? data : {};
  const result = isRecord(d.result) ? d.result : {};
  const progression = isRecord(result.progression) ? result.progression : {};
  const xp = isRecord(progression.xp) ? progression.xp : {};
  return {
    id,
    kind: str(d.kind) ?? "unknown",
    cards: num(d.cards),
    correct: typeof d.correct === "number" ? d.correct : null,
    durationSec: num(d.durationSec),
    day: str(d.day),
    createdAt: str(d.createdAt),
    xp: typeof xp.gained === "number" ? xp.gained : null,
  };
}
