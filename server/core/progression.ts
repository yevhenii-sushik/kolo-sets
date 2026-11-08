// Опыт, орбиты и капсулы поверх профиля: общая подготовка и итог для /api/session, /api/progress-sync,
// /api/orbit-goal, /api/achievements и покупки щита. Чистые функции (docs/specs/02-progression.md).
import type { AchievementType } from "../../src/types";
import { levelFromXp, ORBIT_BONUS } from "./xp";
import {
  expireRepair,
  MAX_SHIELDS,
  orbitFromHistory,
  repairCooledDown,
  rollTo,
  setGoal,
  weekOf,
  weekStatus,
  type OrbitEvent,
  type OrbitState,
} from "./orbit";
import { capsulesEarned, SHIELD_COST, starterCapsules } from "./loot";
import { addDays } from "./time";

export interface ProgressionState {
  xp?: number;
  level?: number;
  xpDay?: { day: string; amount: number };
  weekXp?: { week: string; amount: number };
  orbit?: OrbitState;
  legacyFlames?: number;
  longestStreak?: number;
  studyHistory?: { date: string; sessions: number; cardsStudied: number }[];
  capsules?: number;
}

export interface ProgressionPatch {
  xp: number;
  level: number;
  weekXp: { week: string; amount: number };
  orbit: OrbitState;
  capsules: number;
  legacyFlames?: number;
}

// Что клиент показывает в шапке и профиле — без служебных полей
export interface ProgressionView {
  xp: { total: number; gained: number; level: number; levelUp: boolean; into: number; next: number };
  orbit: {
    week: string;
    days: string[];
    goal: number;
    goalSet: boolean;
    nextGoal?: number;
    closed: boolean;
    streak: number;
    longest: number;
    shields: number;
    status: ReturnType<typeof weekStatus>;
    repair?: { until: string; sessions: number };
    repairReady: boolean; // если эта неделя сорвётся без щита, серию можно будет починить
  };
  capsules: { count: number; gained: number };
  events: OrbitEvent[];
}

export type Prepared = ReturnType<typeof prepare>;

// Переход со старых огоньков (один раз), итоги прошедших недель, истёкшая починка, стартовые капсулы
export function prepare(state: ProgressionState, today: string) {
  const currentWeek = weekOf(today);
  const events: OrbitEvent[] = [];
  let migrated = false;
  let xp = state.xp ?? 0;
  let orbit = state.orbit;
  let legacyFlames = state.legacyFlames;

  if (!orbit) {
    migrated = true;
    orbit = orbitFromHistory(state.studyHistory ?? [], currentWeek);
    // Опыт за прошлое: 1 за каждую пройденную карточку, без потолка
    xp += (state.studyHistory ?? []).reduce((n, d) => n + (d.cardsStudied ?? 0), 0);
    // Рекорд старых огоньков — памятная медаль
    if ((state.longestStreak ?? 0) >= 3) legacyFlames = state.longestStreak;
  }

  // Капсулы появились в 2b: при первой встрече — подарок с учётом уже набранного уровня
  const starter = state.capsules === undefined ? starterCapsules(levelFromXp(xp).level) : 0;

  orbit = expireRepair(rollTo(orbit, currentWeek, events), today);
  return { orbit, xp, legacyFlames, migrated, events, currentWeek, capsules: (state.capsules ?? 0) + starter, starter };
}

// Опыт недели (для лиг) — обнуляется в понедельник
export const addWeekXp = (weekXp: ProgressionState["weekXp"], week: string, amount: number) => ({
  week,
  amount: (weekXp?.week === week ? weekXp.amount : 0) + amount,
});

// Итог действия: опыт и уровень, капсулы за уровни, орбиту, вехи серии и крупные достижения
export function settle(
  state: ProgressionState,
  p: Prepared,
  today: string,
  change: { gained: number; orbit: OrbitState; events: OrbitEvent[]; newAchievements?: readonly AchievementType[] },
): { patch: ProgressionPatch; view: ProgressionView } {
  const xp = p.xp + change.gained;
  const levelBefore = levelFromXp(p.xp).level;
  const level = levelFromXp(xp).level;
  const earned = capsulesEarned({
    levelBefore,
    levelAfter: level,
    orbitClosed: change.events.includes("orbitClosed"),
    longestBefore: p.orbit.longest,
    longestAfter: change.orbit.longest,
    newAchievements: change.newAchievements ?? [],
  });
  const capsules = p.capsules + earned;
  return {
    patch: {
      xp,
      level,
      weekXp: addWeekXp(state.weekXp, p.currentWeek, change.gained),
      orbit: change.orbit,
      capsules,
      ...(p.legacyFlames !== undefined ? { legacyFlames: p.legacyFlames } : {}),
    },
    view: view(change.orbit, xp, change.gained, levelBefore, today, change.events, capsules, p.starter + earned),
  };
}

export function view(
  orbit: OrbitState,
  totalXp: number,
  gained: number,
  levelBefore: number,
  today: string,
  events: OrbitEvent[],
  capsules: number,
  capsulesGained: number,
): ProgressionView {
  const lvl = levelFromXp(totalXp);
  return {
    xp: { total: totalXp, gained, level: lvl.level, levelUp: lvl.level > levelBefore, into: lvl.into, next: lvl.next },
    orbit: {
      week: orbit.week,
      days: orbit.days,
      goal: orbit.goal,
      goalSet: orbit.goalSet,
      ...(orbit.nextGoal !== undefined ? { nextGoal: orbit.nextGoal } : {}),
      closed: orbit.closed,
      streak: orbit.streak,
      longest: orbit.longest,
      shields: orbit.shields,
      status: weekStatus(orbit, today),
      ...(orbit.repair ? { repair: { until: orbit.repair.until, sessions: orbit.repair.sessions } } : {}),
      repairReady: orbit.streak > 0 && repairCooledDown(orbit, addDays(orbit.week, 7)),
    },
    capsules: { count: capsules, gained: capsulesGained },
    events,
  };
}

// POST /api/progress-sync: подвести итоги без тренировки. patch = null — писать нечего.
// Опыт за прошлое при переходе не празднуем как новый уровень и капсул за него не даём (кроме стартовых)
export function syncProgress(state: ProgressionState, today: string): { patch: ProgressionPatch | null; result: ProgressionView } {
  const p = prepare(state, today);
  const { patch, view: result } = settle(state, p, today, { gained: 0, orbit: p.orbit, events: p.events });
  const changed =
    p.migrated ||
    p.starter > 0 ||
    JSON.stringify(p.orbit) !== JSON.stringify(state.orbit) ||
    p.xp !== (state.xp ?? 0);
  return { patch: changed ? patch : null, result };
}

// POST /api/orbit-goal: выбор цели; если цель уже выполнена — орбита замыкается с бонусом и капсулой
export function applyGoal(state: ProgressionState, goal: number, today: string): { patch: ProgressionPatch; result: ProgressionView } {
  const p = prepare(state, today);
  const events = [...p.events];
  const orbit = setGoal(p.orbit, goal, events);
  const gained = events.includes("orbitClosed") ? ORBIT_BONUS : 0;
  const { patch, view: result } = settle(state, p, today, { gained, orbit, events });
  return { patch, result };
}

// POST /api/dust-spend { kind: "shield" }: щит за пыль, если щитов меньше двух
export function buyShield(
  state: ProgressionState & { dust?: number },
  today: string,
): { ok: false; reason: "shields-full" | "not-enough-dust" } | { ok: true; patch: ProgressionPatch & { dust: number }; result: ProgressionView } {
  const p = prepare(state, today);
  const dust = state.dust ?? 0;
  if (p.orbit.shields >= MAX_SHIELDS) return { ok: false, reason: "shields-full" };
  if (dust < SHIELD_COST) return { ok: false, reason: "not-enough-dust" };
  const orbit = { ...p.orbit, shields: p.orbit.shields + 1 };
  const { patch, view: result } = settle(state, p, today, { gained: 0, orbit, events: p.events });
  return { ok: true, patch: { ...patch, dust: dust - SHIELD_COST }, result };
}
