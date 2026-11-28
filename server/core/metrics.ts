// Метрики удержания для админ-панели (docs/specs/admin.md → «Удержание»; шаг 8 в docs/specs/06-audit-fixes.md).
// Только сводные числа из того, что сервис и так хранит: дата регистрации из Auth, дни занятий из профиля,
// число наборов и карточек. Ни слов, ни названий наборов, ни отдельных людей на выходе нет.
// Чистые функции: метки времени сервер заранее превращает в ISO-строки.
import { DEFAULT_GOAL, weekOf } from "./orbit";
import { addDays, dayKey, daysBetween, safeTimeZone } from "./time";
import { rolesOf } from "./admin";

const DAY_MS = 86_400_000;

// Сколько недель регистраций показываем. D30 видна у когорт старше ~8,5 недели (день 59 + неделя когорты)
export const METRIC_WEEKS = 12;

// Окна возврата: «второй день», «вторая неделя», «второй месяц». Окно — дни от регистрации, обе границы
// включительно; день 0 — день регистрации по часовому поясу человека
export const WINDOWS = {
  d1: [1, 1],
  d7: [7, 13],
  d30: [30, 59],
} as const satisfies Record<string, readonly [number, number]>;
export type WindowId = keyof typeof WINDOWS;

// Шаг «Первых шагов» — 5 слов (src/components/onboarding/FirstSteps.tsx, WORDS_GOAL)
export const FUNNEL_WORDS = 5;

export const FUNNEL = ["account", "course", "set", "words", "session", "week2"] as const;
export type FunnelId = (typeof FUNNEL)[number];

// Человек в виде, нужном метрикам. Собирает его metricUser из аккаунта, профиля и наборов
export interface MetricUser {
  signupDay: string; // день регистрации по часовому поясу человека
  today: string; // сегодня по тому же поясу
  courses: number;
  sets: number;
  cards: number;
  studyDays: string[]; // дни с занятиями, без повторов, по возрастанию
  firstOrbit: boolean; // хоть раз замкнул орбиту недели
}

export interface MetricAccount {
  createdAt: string | null; // ISO, из Firebase Auth
  disabled: boolean;
  claims: unknown;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Кого не считаем: команду (её занятия — проверки, а не учёба) и отключённые аккаунты
export type Excluded = "team" | "disabled" | null;
export function excludedReason(a: MetricAccount): Excluded {
  if (rolesOf(a.claims).staff) return "team";
  if (a.disabled) return "disabled";
  return null;
}

// Попадает ли регистрация в окно метрик. С запасом в неделю: точную неделю когорты решает
// день по часовому поясу человека, а его сервер узнает только из профиля
export function signedUpWithin(createdAt: string | null, now: Date, weeks = METRIC_WEEKS): boolean {
  const t = createdAt ? Date.parse(createdAt) : NaN;
  return Number.isFinite(t) && now.getTime() - t < (weeks + 1) * 7 * DAY_MS;
}

// Замкнул ли первую орбиту. Если орбиты в профиле ещё нет (человек не открывал приложение с их появления),
// то по тому же правилу, по которому их заведёт переход со старой истории (orbitFromHistory): неделя
// с занятиями хотя бы в DEFAULT_GOAL дней
function closedAnOrbit(orbit: unknown, history: { date: string; sessions: number }[]): boolean {
  if (isRecord(orbit) && typeof orbit.week === "string") return num(orbit.longest) >= 1 || orbit.closed === true;
  const perWeek = new Map<string, number>();
  for (const d of history) if (d.sessions > 0) perWeek.set(weekOf(d.date), (perWeek.get(weekOf(d.date)) ?? 0) + 1);
  return [...perWeek.values()].some((n) => n >= DEFAULT_GOAL);
}

// profile — профиль как JSON (null, если профиля нет: человек зарегистрировался и не открыл приложение);
// setCards — сколько карточек в каждом наборе
export function metricUser(account: MetricAccount, profile: unknown, setCards: number[], now: Date): MetricUser | null {
  const created = account.createdAt ? Date.parse(account.createdAt) : NaN;
  if (!Number.isFinite(created)) return null;
  const p = isRecord(profile) ? profile : {};
  const tz = safeTimeZone(p.timezone);
  const history = (Array.isArray(p.studyHistory) ? p.studyHistory : [])
    .filter((h): h is Record<string, unknown> => isRecord(h) && typeof h.date === "string" && DAY_RE.test(h.date))
    .map((h) => ({ date: h.date as string, sessions: num(h.sessions) }));
  return {
    signupDay: dayKey(new Date(created), tz),
    today: dayKey(now, tz),
    courses: Array.isArray(p.courses) ? p.courses.length : 0,
    sets: setCards.length,
    cards: setCards.reduce((sum, n) => sum + n, 0),
    // День в истории есть, только если в нём была тренировка: закрепление (sessions: 0) — тоже занятие
    studyDays: [...new Set(history.map((h) => h.date))].sort(),
    firstOrbit: closedAnOrbit(p.orbit, history),
  };
}

// ── Подсчёт ──

// hit из of; of — у кого окно уже закончилось (молодые когорты не занижают долю)
export interface Rate {
  hit: number;
  of: number;
}

export interface CohortRow {
  week: string; // понедельник недели регистрации
  users: number;
  d1: Rate;
  d7: Rate;
  d30: Rate;
  orbit: Rate; // of — все в когорте: орбиту можно замкнуть в любой момент
}

export interface FunnelStep {
  id: FunnelId;
  reached: number;
  of: number; // у шагов до «вторая неделя» — все; у неё — у кого вторая неделя уже прошла
}

export interface Metrics {
  weeks: number;
  from: string; // первый понедельник окна
  total: Omit<CohortRow, "week">;
  cohorts: CohortRow[]; // от новых к старым
  funnel: FunnelStep[];
}

const windowEnded = (u: MetricUser, w: WindowId) => daysBetween(u.signupDay, u.today) > WINDOWS[w][1];

export function returnedIn(u: MetricUser, w: WindowId): boolean {
  const [from, to] = WINDOWS[w];
  return u.studyDays.some((d) => {
    const n = daysBetween(u.signupDay, d);
    return n >= from && n <= to;
  });
}

const emptyRow = () => ({ users: 0, d1: { hit: 0, of: 0 }, d7: { hit: 0, of: 0 }, d30: { hit: 0, of: 0 }, orbit: { hit: 0, of: 0 } });

function add(row: Omit<CohortRow, "week">, u: MetricUser) {
  row.users++;
  for (const w of Object.keys(WINDOWS) as WindowId[]) {
    if (!windowEnded(u, w)) continue;
    row[w].of++;
    if (returnedIn(u, w)) row[w].hit++;
  }
  row.orbit.of++;
  if (u.firstOrbit) row.orbit.hit++;
}

// Воронка новичка строгая: шаг засчитан, только если пройдены и все шаги до него.
// Человек, который потренировался на наборе из трёх слов, остановится на «5 слов» — так видно,
// где именно путь из «Первых шагов» не держит
const STEP_DONE: Record<Exclude<FunnelId, "account" | "week2">, (u: MetricUser) => boolean> = {
  course: (u) => u.courses > 0,
  set: (u) => u.sets > 0,
  words: (u) => u.cards >= FUNNEL_WORDS,
  session: (u) => u.studyDays.length > 0,
};

function funnelOf(users: MetricUser[]): FunnelStep[] {
  const steps: FunnelStep[] = [{ id: "account", reached: users.length, of: users.length }];
  let alive = users;
  for (const id of ["course", "set", "words", "session"] as const) {
    alive = alive.filter(STEP_DONE[id]);
    steps.push({ id, reached: alive.length, of: users.length });
  }
  const week2Base = users.filter((u) => windowEnded(u, "d7"));
  steps.push({ id: "week2", reached: alive.filter((u) => windowEnded(u, "d7") && returnedIn(u, "d7")).length, of: week2Base.length });
  return steps;
}

// Когорты — по неделе регистрации (пн–вс) по часовому поясу человека, за последние weeks недель,
// считая текущую; окно недель — по UTC, одна шкала для всех
export function retentionMetrics(users: MetricUser[], now: Date, weeks = METRIC_WEEKS): Metrics {
  const thisWeek = weekOf(dayKey(now, "UTC"));
  const from = addDays(thisWeek, -7 * (weeks - 1));
  const rows = new Map<string, CohortRow>();
  for (let i = 0; i < weeks; i++) {
    const week = addDays(thisWeek, -7 * i);
    rows.set(week, { week, ...emptyRow() });
  }
  const total = emptyRow();
  const inWindow: MetricUser[] = [];
  for (const u of users) {
    // Восточнее UTC понедельник наступает раньше: такая регистрация — в текущей неделе, а не в будущей
    const week = weekOf(u.signupDay);
    const row = rows.get(week > thisWeek ? thisWeek : week);
    if (!row) continue;
    inWindow.push(u);
    add(row, u);
    add(total, u);
  }
  return { weeks, from, total, cohorts: [...rows.values()], funnel: funnelOf(inWindow) };
}
