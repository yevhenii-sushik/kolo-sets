// Ядро начисления за тренировку: чистые функции без сети и базы (docs/specs/00-server.md).
// Одинаково работают в Netlify Functions сейчас и в Cloud Functions потом.

import { AchievementType } from "../../src/types";
import { checkAndUnlockAchievements } from "../../src/utils/achievements";
import { addDays, dayKey, daysBetween, hourIn, safeTimeZone } from "./time";
import { achievementXp, capDaily, FIRST_SESSION_BONUS, levelFromXp, ORBIT_BONUS, sessionXp } from "./xp";
import { recordSession, type OrbitEvent } from "./orbit";
import { addWeekXp, prepare, view, type ProgressionPatch, type ProgressionState, type ProgressionView } from "./progression";

export const SESSION_KINDS = ["flashcards", "review", "quiz", "speed", "survival", "match"] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];
const GAMES: readonly SessionKind[] = ["speed", "survival", "match"];

export interface SessionInput {
  id: string;
  kind: SessionKind;
  collectionIds: string[];
  cards: number;
  correct?: number;
  allKnow?: boolean;
  durationSec: number;
  timezone: string;
}

export interface StudyDay {
  date: string;
  sessions: number;
  cardsStudied: number;
  timeSpent: number;
}

export interface Stats {
  totalCards: number;
  cardsLearned: number;
  quizzesTaken: number;
  flashcardSessions: number;
  totalStudyTime: number;
  perfectQuizzes: number;
  gamesPlayed: number;
}

// Профиль — только поля, которые считает сервер (этап 0 + опыт и орбиты этапа 2)
export interface ProgressState extends Omit<ProgressionState, "studyHistory"> {
  stats?: Partial<Stats>;
  currentStreak?: number;
  longestStreak?: number;
  lastStudyDate?: Date | null;
  lastStudyDay?: string | null;
  studyHistory?: StudyDay[];
  achievements?: AchievementType[];
}

// Что сервер сам прочитал о наборах пользователя
export interface CollectionsInfo {
  cardsInSession: number; // карточек в наборах этой тренировки
  totalCards: number; // карточек во всех наборах
  collectionsCount: number;
}

export interface SessionResult {
  streak: { current: number; longest: number; extendedToday: boolean };
  newAchievements: AchievementType[];
  day: string;
  progression: ProgressionView;
}

export interface ProgressPatch extends ProgressionPatch {
  xpDay: { day: string; amount: number };
  stats: Stats;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  lastStudyDay: string;
  studyHistory: StudyDay[];
  achievements: AchievementType[];
  timezone: string;
}

const MAX_IDS = 200;
const MAX_DURATION_SEC = 4 * 60 * 60;

// Форма запроса: всё, что пришло от клиента, — недоверенные данные
export function parseSession(body: unknown): { ok: true; session: SessionInput } | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;
  const int = (v: unknown) => typeof v === "number" && Number.isInteger(v);
  if (typeof b.id !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(b.id)) return { ok: false, reason: "id" };
  if (!SESSION_KINDS.includes(b.kind as SessionKind)) return { ok: false, reason: "kind" };
  if (
    !Array.isArray(b.collectionIds) ||
    b.collectionIds.length === 0 ||
    b.collectionIds.length > MAX_IDS ||
    !b.collectionIds.every((x) => typeof x === "string" && x.length > 0 && x.length <= 128 && !x.includes("/"))
  )
    return { ok: false, reason: "collectionIds" };
  if (!int(b.cards) || (b.cards as number) < 1 || (b.cards as number) > 2000) return { ok: false, reason: "cards" };
  if (b.correct !== undefined && (!int(b.correct) || (b.correct as number) < 0)) return { ok: false, reason: "correct" };
  if (b.allKnow !== undefined && typeof b.allKnow !== "boolean") return { ok: false, reason: "allKnow" };
  if (typeof b.durationSec !== "number" || !Number.isFinite(b.durationSec) || b.durationSec <= 0) return { ok: false, reason: "durationSec" };
  return {
    ok: true,
    session: {
      id: b.id,
      kind: b.kind as SessionKind,
      collectionIds: [...new Set(b.collectionIds as string[])],
      cards: b.cards as number,
      correct: b.correct as number | undefined,
      allKnow: b.allKnow as boolean | undefined,
      durationSec: Math.round(b.durationSec),
      timezone: safeTimeZone(b.timezone),
    },
  };
}

// Правдоподобие: null — всё в порядке, иначе причина отказа (пишется в журнал, клиенту — общая ошибка)
export function checkPlausibility(s: SessionInput, info: CollectionsInfo): string | null {
  const isGame = GAMES.includes(s.kind);
  if (s.durationSec > MAX_DURATION_SEC) return "too-long";
  if (s.correct !== undefined && s.correct > s.cards) return "correct>cards";
  if (isGame) {
    // В играх слова повторяются по кругу — ограничиваем скоростью: не больше двух ответов в секунду
    if (s.cards > s.durationSec * 2) return "too-fast";
  } else {
    // Тест может спросить одно слово дважды (разные типы заданий) — запас в два раза
    if (s.cards > info.cardsInSession * 2) return "more-cards-than-sets";
    // Меньше ~0,8 с на карточку человек не успевает даже прочитать слово
    if (s.durationSec < s.cards * 0.8) return "too-fast";
  }
  return null;
}

const STAT_DEFAULTS: Stats = {
  totalCards: 0,
  cardsLearned: 0,
  quizzesTaken: 0,
  flashcardSessions: 0,
  totalStudyTime: 0,
  perfectQuizzes: 0,
  gamesPlayed: 0,
};

// Начисление за тренировку. now — время сервера; день и час — в часовом поясе пользователя.
export function applySession(
  state: ProgressState,
  s: SessionInput,
  info: CollectionsInfo,
  now: Date,
): { patch: ProgressPatch; result: SessionResult } {
  const tz = s.timezone;
  const today = dayKey(now, tz);
  const lastDay = state.lastStudyDay ?? (state.lastStudyDate ? dayKey(state.lastStudyDate, tz) : null);

  // ── Орбиты и опыт: переход со старых огоньков (по истории ДО этой тренировки) и итоги прошедших недель
  const prep = prepare({ ...state, studyHistory: state.studyHistory }, today);
  const levelBefore = levelFromXp(prep.xp).level;
  const events: OrbitEvent[] = [...prep.events];

  // ── Серия: тот же день — без изменений; вчера — +1; раньше или никогда — 1.
  // Если «последний день» позже сегодняшнего (человек улетел на запад), серию не трогаем.
  const prevStreak = state.currentStreak ?? 0;
  let current: number;
  let extendedToday: boolean;
  if (lastDay && lastDay >= today) {
    current = Math.max(prevStreak, 1);
    extendedToday = false;
  } else if (lastDay === addDays(today, -1)) {
    current = prevStreak + 1;
    extendedToday = true;
  } else {
    current = 1;
    extendedToday = true;
  }
  const longest = Math.max(state.longestStreak ?? 0, current);
  const isComeback = lastDay !== null && daysBetween(lastDay, today) > 7;

  // ── История дней
  const history = [...(state.studyHistory ?? [])];
  const idx = history.findIndex((d) => d.date === today);
  const firstToday = idx < 0;
  if (idx >= 0) {
    const d = history[idx];
    history[idx] = { ...d, sessions: d.sessions + 1, cardsStudied: d.cardsStudied + s.cards, timeSpent: d.timeSpent + s.durationSec };
  } else {
    history.push({ date: today, sessions: 1, cardsStudied: s.cards, timeSpent: s.durationSec });
  }

  // ── Счётчики: игры не трогают счётчики флэшкарт и тестов (от них зависят достижения)
  const stats: Stats = { ...STAT_DEFAULTS, ...state.stats };
  stats.totalStudyTime += s.durationSec;
  if (s.kind === "flashcards" || s.kind === "review") stats.flashcardSessions += 1;
  if (s.kind === "quiz") {
    stats.quizzesTaken += 1;
    if (s.correct === s.cards) stats.perfectQuizzes += 1;
  }
  if (GAMES.includes(s.kind)) stats.gamesPlayed += 1;

  // ── Достижения — по уже обновлённым цифрам
  const achievements = state.achievements ?? [];
  const newAchievements = checkAndUnlockAchievements({ achievements, stats, currentStreak: current }, info.totalCards, {
    collectionsCount: info.collectionsCount,
    session: {
      duration: s.durationSec,
      allKnow: (s.kind === "flashcards" || s.kind === "review") && s.allKnow === true,
      quizQuestions: s.kind === "quiz" ? s.cards : undefined,
      isComeback,
      hour: hourIn(now, tz),
    },
  });

  // ── Орбита недели и опыт: тренировка (до дневного потолка) + бонусы сверх потолка
  const orbit = recordSession(prep.orbit, today, events);
  const capped = capDaily(sessionXp(s.kind, s.cards, s.correct), state.xpDay, today);
  const gained =
    capped.gained +
    (firstToday ? FIRST_SESSION_BONUS : 0) +
    (events.includes("orbitClosed") ? ORBIT_BONUS : 0) +
    newAchievements.reduce((n, id) => n + achievementXp(id), 0);
  const xp = prep.xp + gained;

  return {
    patch: {
      xp,
      level: levelFromXp(xp).level,
      xpDay: capped.xpDay,
      weekXp: addWeekXp(state.weekXp, prep.currentWeek, gained),
      orbit,
      ...(prep.legacyFlames !== undefined ? { legacyFlames: prep.legacyFlames } : {}),
      stats,
      currentStreak: current,
      longestStreak: longest,
      lastStudyDate: now,
      lastStudyDay: today,
      studyHistory: history,
      achievements: [...achievements, ...newAchievements],
      timezone: tz,
    },
    result: {
      streak: { current, longest, extendedToday },
      newAchievements,
      day: today,
      progression: view(orbit, xp, gained, levelBefore, today, events),
    },
  };
}

// Достижения за наборы и слова (не за тренировку) — после создания набора или добавления слов
export function collectionAchievements(state: ProgressState, info: CollectionsInfo): AchievementType[] {
  return checkAndUnlockAchievements(
    { achievements: state.achievements ?? [], stats: { ...STAT_DEFAULTS, ...state.stats }, currentStreak: state.currentStreak ?? 0 },
    info.totalCards,
    { collectionsCount: info.collectionsCount },
  );
}
