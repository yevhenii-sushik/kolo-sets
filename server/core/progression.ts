// Опыт и орбиты поверх профиля: общая подготовка для /api/session, /api/progress/sync и /api/orbit/goal.
// Чистые функции (docs/specs/02-progression.md).
import { levelFromXp, ORBIT_BONUS } from "./xp";
import { expireRepair, orbitFromHistory, repairCooledDown, rollTo, setGoal, weekOf, weekStatus, type OrbitEvent, type OrbitState } from "./orbit";
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
}

export interface ProgressionPatch {
  xp: number;
  level: number;
  weekXp: { week: string; amount: number };
  orbit: OrbitState;
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
  events: OrbitEvent[];
}

// Переход со старых огоньков (один раз), итоги прошедших недель, истёкшая починка
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

  orbit = expireRepair(rollTo(orbit, currentWeek, events), today);
  return { orbit, xp, legacyFlames, migrated, events, currentWeek };
}

// Опыт недели (для лиг) — обнуляется в понедельник
export const addWeekXp = (weekXp: ProgressionState["weekXp"], week: string, amount: number) => ({
  week,
  amount: (weekXp?.week === week ? weekXp.amount : 0) + amount,
});

export function view(
  orbit: OrbitState,
  totalXp: number,
  gained: number,
  levelBefore: number,
  today: string,
  events: OrbitEvent[],
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
    events,
  };
}

// POST /api/progress/sync: подвести итоги без тренировки. patch = null — писать нечего
export function syncProgress(state: ProgressionState, today: string): { patch: ProgressionPatch | null; result: ProgressionView } {
  const p = prepare(state, today);
  const levelBefore = levelFromXp(state.xp ?? 0).level;
  const changed =
    p.migrated || JSON.stringify(p.orbit) !== JSON.stringify(state.orbit) || p.xp !== (state.xp ?? 0);
  const patch = changed
    ? {
        xp: p.xp,
        level: levelFromXp(p.xp).level,
        weekXp: addWeekXp(state.weekXp, p.currentWeek, 0),
        orbit: p.orbit,
        ...(p.legacyFlames !== undefined ? { legacyFlames: p.legacyFlames } : {}),
      }
    : null;
  // При переходе опыт «за прошлое» не празднуем как новый уровень
  return { patch, result: view(p.orbit, p.xp, 0, p.migrated ? levelFromXp(p.xp).level : levelBefore, today, p.events) };
}

// POST /api/orbit/goal: выбор цели; если цель уже выполнена — орбита замыкается с бонусом
export function applyGoal(state: ProgressionState, goal: number, today: string): { patch: ProgressionPatch; result: ProgressionView } {
  const p = prepare(state, today);
  const events = [...p.events];
  const orbit = setGoal(p.orbit, goal, events);
  const bonus = events.includes("orbitClosed") ? ORBIT_BONUS : 0;
  const xp = p.xp + bonus;
  const levelBefore = levelFromXp(p.xp).level;
  return {
    patch: {
      xp,
      level: levelFromXp(xp).level,
      weekXp: addWeekXp(state.weekXp, p.currentWeek, bonus),
      orbit,
      ...(p.legacyFlames !== undefined ? { legacyFlames: p.legacyFlames } : {}),
    },
    result: view(orbit, xp, bonus, levelBefore, today, events),
  };
}
