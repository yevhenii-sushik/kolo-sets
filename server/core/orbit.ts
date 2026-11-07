// Недельные орбиты (docs/specs/02-progression.md → «Недельные орбиты»). Чистые функции: состояние
// копируется, исходный объект не меняется. Ключи дней — 'YYYY-MM-DD' в часовом поясе пользователя.
import { addDays, daysBetween } from "./time";

export const GOAL_MIN = 3;
export const GOAL_MAX = 7;
export const DEFAULT_GOAL = 3;
export const MAX_SHIELDS = 2;
export const SHIELD_EVERY = 4; // щит за каждые 4 орбиты подряд
export const REPAIR_SESSIONS = 3; // тренировок, чтобы починить серию
export const REPAIR_WINDOW_DAYS = 3; // пн–ср новой недели
export const REPAIR_COOLDOWN_DAYS = 30;

export interface OrbitState {
  goal: number;
  goalSet: boolean; // пользователь уже выбрал цель (иначе — показать выбор)
  nextGoal?: number; // новая цель — со следующего понедельника
  week: string; // понедельник текущей недели
  days: string[]; // засчитанные дни этой недели
  closed: boolean; // орбита этой недели замкнута
  streak: number; // орбит подряд
  longest: number;
  shields: number;
  repair?: { failedWeek: string; until: string; sessions: number; streakBefore: number };
  lastRepairDay?: string;
}

export type OrbitEvent =
  | "dayCounted"
  | "orbitClosed"
  | "shieldEarned"
  | "shieldUsed"
  | "streakBroken"
  | "repairAvailable"
  | "repaired";

// Понедельник недели, в которую входит день
export function weekOf(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 — воскресенье
  return addDays(day, -((dow + 6) % 7));
}

const clampGoal = (g: number) => Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(g)));

// Замкнуть орбиту, если дней хватает: серия +1, щит за каждую 4-ю
function closeIfReached(o: OrbitState, events: OrbitEvent[]) {
  if (o.closed || o.days.length < o.goal) return;
  o.closed = true;
  o.streak += 1;
  o.longest = Math.max(o.longest, o.streak);
  events.push("orbitClosed");
  if (o.streak % SHIELD_EVERY === 0 && o.shields < MAX_SHIELDS) {
    o.shields += 1;
    events.push("shieldEarned");
  }
}

// Прошло ли 30 дней с прошлой починки к началу недели week
export const repairCooledDown = (o: OrbitState, week: string) =>
  !o.lastRepairDay || daysBetween(o.lastRepairDay, week) >= REPAIR_COOLDOWN_DAYS;

// Подвести итоги всех прошедших недель до текущей
export function rollTo(input: OrbitState, currentWeek: string, events: OrbitEvent[]): OrbitState {
  const o: OrbitState = { ...input, days: [...input.days] };
  while (o.week < currentWeek) {
    if (!o.closed) {
      if (o.shields > 0) {
        o.shields -= 1;
        events.push("shieldUsed");
      } else {
        // Чинить можно только последнюю сорванную неделю, раз в 30 дней и если было что терять
        const lastBeforeCurrent = addDays(o.week, 7) === currentWeek;
        if (o.streak > 0 && lastBeforeCurrent && repairCooledDown(o, currentWeek)) {
          o.repair = { failedWeek: o.week, until: addDays(currentWeek, REPAIR_WINDOW_DAYS - 1), sessions: 0, streakBefore: o.streak };
          events.push("repairAvailable");
        } else {
          delete o.repair;
        }
        if (o.streak > 0) events.push("streakBroken");
        o.streak = 0;
      }
    }
    o.week = addDays(o.week, 7);
    o.days = [];
    o.closed = false;
    if (o.nextGoal !== undefined) {
      o.goal = o.nextGoal;
      delete o.nextGoal;
    }
  }
  return o;
}

// Окно починки прошло — убираем. Пустые поля удаляем, а не ставим undefined: состояние пишется в Firestore
export function expireRepair(o: OrbitState, today: string): OrbitState {
  if (!o.repair || today <= o.repair.until) return o;
  const { repair: _, ...rest } = o;
  return rest;
}

// Тренировка засчитана: день недели и прогресс починки
export function recordSession(input: OrbitState, today: string, events: OrbitEvent[]): OrbitState {
  const o: OrbitState = { ...expireRepair(input, today), days: [...input.days] };
  if (!o.days.includes(today)) {
    o.days.push(today);
    events.push("dayCounted");
  }
  closeIfReached(o, events);
  if (o.repair) {
    o.repair = { ...o.repair, sessions: o.repair.sessions + 1 };
    if (o.repair.sessions >= REPAIR_SESSIONS) {
      // Серия возвращается: прежняя + то, что успели набрать после срыва
      o.streak = o.repair.streakBefore + o.streak;
      o.longest = Math.max(o.longest, o.streak);
      o.lastRepairDay = today;
      delete o.repair;
      events.push("repaired");
    }
  }
  return o;
}

// Цель недели: первый выбор — сразу, дальше — со следующего понедельника
export function setGoal(input: OrbitState, goal: number, events: OrbitEvent[]): OrbitState {
  const g = clampGoal(goal);
  const o: OrbitState = { ...input, days: [...input.days] };
  if (!o.goalSet) {
    o.goal = g;
    o.goalSet = true;
    delete o.nextGoal;
    closeIfReached(o, events);
  } else if (g === o.goal) {
    delete o.nextGoal;
  } else {
    o.nextGoal = g;
  }
  return o;
}

// Переход со старых ежедневных огоньков: серия орбит — по истории дней с целью по умолчанию
export function orbitFromHistory(history: { date: string; sessions: number }[], currentWeek: string): OrbitState {
  const perWeek = new Map<string, Set<string>>();
  for (const d of history) {
    if (!(d.sessions > 0)) continue;
    const w = weekOf(d.date);
    if (!perWeek.has(w)) perWeek.set(w, new Set());
    perWeek.get(w)!.add(d.date);
  }
  const done = (w: string) => (perWeek.get(w)?.size ?? 0) >= DEFAULT_GOAL;

  // Подряд замкнутые недели, считая назад от прошлой
  let streak = 0;
  for (let w = addDays(currentWeek, -7); done(w); w = addDays(w, -7)) streak += 1;

  // Рекорд — самая длинная цепочка в истории
  let longest = 0;
  let run = 0;
  const weeks = [...perWeek.keys()].filter((w) => w < currentWeek).sort();
  let prev: string | null = null;
  for (const w of weeks) {
    run = done(w) ? (prev && addDays(prev, 7) === w && run > 0 ? run + 1 : 1) : 0;
    longest = Math.max(longest, run);
    prev = w;
  }

  const o: OrbitState = {
    goal: DEFAULT_GOAL,
    goalSet: false,
    week: currentWeek,
    days: [...(perWeek.get(currentWeek) ?? [])].sort(),
    closed: false,
    streak,
    longest: Math.max(longest, streak),
    shields: Math.min(MAX_SHIELDS, Math.floor(streak / SHIELD_EVERY)),
  };
  closeIfReached(o, []);
  return o;
}

// Что показать про неделю: в пути, под угрозой, замкнута, не успеть (today — ключ сегодняшнего дня)
export function weekStatus(o: OrbitState, today: string): "closed" | "onTrack" | "atRisk" | "lost" {
  if (o.closed) return "closed";
  const daysLeft = daysBetween(today, addDays(o.week, 6)) + (o.days.includes(today) ? 0 : 1);
  const need = o.goal - o.days.length;
  if (need > daysLeft) return "lost";
  return need === daysLeft ? "atRisk" : "onTrack";
}
