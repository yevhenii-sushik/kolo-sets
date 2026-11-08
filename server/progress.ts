// Запись прогресса в базу: транзакции поверх чистого ядра server/core (docs/specs/00-server.md)
import { randomInt } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { applyCollectionUnlocks, applySession, checkPlausibility, type ProgressState, type SessionInput } from "./core/session";
import { applyGoal, buyShield, syncProgress } from "./core/progression";
import { craftItem, equipItem, openCapsule, setShowcase, type Equipped, type LootState, type Slot } from "./core/loot";
import type { OrbitState } from "./core/orbit";
import { dayKey, safeTimeZone } from "./core/time";
import { db } from "./admin";

export interface Reply {
  status: number;
  body: Record<string, unknown>;
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
// { day | week, amount } — опыт за день или неделю
const tally = <K extends "day" | "week">(v: unknown, key: K) => {
  const o = v as Record<string, unknown> | null;
  return o && typeof o === "object" && typeof o[key] === "string" && num(o.amount) !== undefined
    ? ({ [key]: o[key], amount: o.amount } as Record<K, string> & { amount: number })
    : undefined;
};

// Орбиту пишет только сервер; на чужую форму не опираемся — считаем, что её нет
function orbitOf(v: unknown): OrbitState | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const ok =
    typeof o.week === "string" &&
    Array.isArray(o.days) &&
    o.days.every((d) => typeof d === "string") &&
    typeof o.closed === "boolean" &&
    typeof o.goalSet === "boolean" &&
    [o.goal, o.streak, o.longest, o.shields].every((n) => num(n) !== undefined);
  return ok ? (o as unknown as OrbitState) : undefined;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

// Поля профиля, которые считает сервер, — в виде, понятном ядру
function progressState(data: FirebaseFirestore.DocumentData | undefined): ProgressState & LootState {
  return {
    stats: data?.stats,
    currentStreak: data?.currentStreak,
    longestStreak: data?.longestStreak,
    lastStudyDate: toDate(data?.lastStudyDate),
    lastStudyDay: typeof data?.lastStudyDay === "string" ? data.lastStudyDay : null,
    studyHistory: Array.isArray(data?.studyHistory) ? data.studyHistory : [],
    achievements: Array.isArray(data?.achievements) ? data.achievements : [],
    xp: num(data?.xp),
    level: num(data?.level),
    xpDay: tally(data?.xpDay, "day"),
    weekXp: tally(data?.weekXp, "week"),
    orbit: orbitOf(data?.orbit),
    legacyFlames: num(data?.legacyFlames),
    capsules: num(data?.capsules),
    pity: num(data?.pity),
    dust: num(data?.dust),
    inventory: isRecord(data?.inventory)
      ? Object.fromEntries(
          Object.entries(data.inventory).filter(([, v]) => isRecord(v) && num(v.n) !== undefined),
        ) as LootState["inventory"]
      : {},
    medals: Array.isArray(data?.medals) ? data.medals.filter((m: unknown) => typeof m === "string") : [],
    equipped: isRecord(data?.equipped)
      ? ({ ...data.equipped, showcase: Array.isArray(data.equipped.showcase) ? data.equipped.showcase : [] } as Equipped)
      : undefined,
  };
}

// Награды — как их показывает клиент (в инвентаре — только количество)
const lootView = (s: LootState) => ({
  capsules: s.capsules ?? 0,
  pity: s.pity ?? 0,
  dust: s.dust ?? 0,
  inventory: Object.fromEntries(Object.entries(s.inventory ?? {}).map(([id, v]) => [id, { n: v.n }])),
  medals: s.medals ?? [],
  equipped: s.equipped ?? { showcase: [] },
});

// Поля сервера заменяются целиком: при merge Firestore слил бы вложенные объекты, и, например,
// закрытая починка осталась бы в orbit
const writeProfile = (tx: FirebaseFirestore.Transaction, ref: FirebaseFirestore.DocumentReference, patch: object) =>
  tx.set(ref, patch, { mergeFields: Object.keys(patch) });

// Часовой пояс: из запроса, иначе последний известный из профиля
const todayFor = (requested: unknown, data: FirebaseFirestore.DocumentData | undefined, now: Date) => {
  const tz = safeTimeZone(requested ?? data?.timezone);
  return { tz, today: dayKey(now, tz) };
};

const cardCount = (data: FirebaseFirestore.DocumentData | undefined) => (Array.isArray(data?.cards) ? data.cards.length : 0);

// POST /api/session
export async function recordSession(uid: string, s: SessionInput, now = new Date()): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  const sessionRef = userRef.collection("sessions").doc(s.id);

  // Не больше RATE_MAX тренировок в минуту — защита от скриптов
  const recent = await userRef
    .collection("sessions")
    .where("createdAt", ">", Timestamp.fromMillis(now.getTime() - RATE_WINDOW_MS))
    .count()
    .get();
  if (recent.data().count >= RATE_MAX) return { status: 429, body: { error: "rate-limited" } };

  return store.runTransaction(async (tx) => {
    const done = await tx.get(sessionRef);
    if (done.exists) return { status: 200, body: { ...(done.data()?.result ?? {}), duplicate: true } };

    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };

    // Наборы читаем сами: сколько в них карточек, решает сервер, а не клиент
    const sets = await tx.getAll(...s.collectionIds.map((id) => userRef.collection("collections").doc(id)));
    if (sets.some((d) => !d.exists)) return { status: 422, body: { error: "unknown-collection" } };
    const cardsInSession = sets.reduce((n, d) => n + cardCount(d.data()), 0);
    // Для достижений за слова — нижняя граница (наборы этой тренировки), полный подсчёт — в /api/achievements
    const info = { cardsInSession, totalCards: cardsInSession, collectionsCount: sets.length };

    const problem = checkPlausibility(s, info);
    if (problem) {
      console.warn(`[session] rejected uid=${uid} id=${s.id} kind=${s.kind} reason=${problem}`);
      return { status: 422, body: { error: "implausible" } };
    }

    const { patch, result } = applySession(progressState(profile.data()), s, info, now);
    writeProfile(tx, userRef, patch);
    tx.set(sessionRef, {
      kind: s.kind,
      collectionIds: s.collectionIds,
      cards: s.cards,
      ...(s.correct !== undefined ? { correct: s.correct } : {}),
      durationSec: s.durationSec,
      timezone: s.timezone,
      day: result.day,
      createdAt: Timestamp.fromDate(now),
      result,
    });
    return { status: 200, body: { ...result, stats: patch.stats } };
  });
}

// POST /api/achievements — достижения за наборы и слова после их изменения: опыт и капсулы, как за тренировку
export async function recheckCollectionAchievements(uid: string, timezone?: unknown, now = new Date()): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  const sets = await userRef.collection("collections").get();
  const info = {
    cardsInSession: 0,
    totalCards: sets.docs.reduce((n, d) => n + cardCount(d.data()), 0),
    collectionsCount: sets.size,
  };
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const { tz, today } = todayFor(timezone, profile.data(), now);
    const applied = applyCollectionUnlocks(progressState(profile.data()), info, today);
    if (!applied) return { status: 200, body: { newAchievements: [] } };
    writeProfile(tx, userRef, { ...applied.patch, timezone: tz });
    return { status: 200, body: applied.result };
  });
}

// POST /api/progress-sync — при открытии приложения: итоги прошедших недель и однократный переход со старых огоньков
export async function syncUserProgress(uid: string, timezone: unknown, now = new Date()): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const { tz, today } = todayFor(timezone, profile.data(), now);
    const { patch, result } = syncProgress(progressState(profile.data()), today);
    // Ничего не изменилось — не пишем: синхронизация идёт при каждом открытии
    if (patch) writeProfile(tx, userRef, { ...patch, timezone: tz });
    return { status: 200, body: { progression: result } };
  });
}

// POST /api/orbit-goal — цель недели 3–7
export async function setOrbitGoal(uid: string, goal: number, timezone: unknown, now = new Date()): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const { tz, today } = todayFor(timezone, profile.data(), now);
    const { patch, result } = applyGoal(progressState(profile.data()), goal, today);
    writeProfile(tx, userRef, { ...patch, timezone: tz });
    return { status: 200, body: { progression: result } };
  });
}

// POST /api/capsules-open — случайность только здесь, на сервере
export async function openUserCapsule(uid: string, now = new Date()): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const state = progressState(profile.data());
    const opened = openCapsule(state, randomInt, now);
    if (!opened.ok) return { status: 409, body: { error: opened.reason } };
    writeProfile(tx, userRef, opened.patch);
    return { status: 200, body: { ...opened.result, loot: lootView({ ...state, ...opened.patch }) } };
  });
}

// POST /api/dust-spend — { kind: "shield" } или { kind: "item", item }
export async function spendDust(uid: string, body: { kind?: unknown; item?: unknown; timezone?: unknown }, now = new Date()): Promise<Reply> {
  if (body.kind !== "shield" && !(body.kind === "item" && typeof body.item === "string")) {
    return { status: 400, body: { error: "bad-request" } };
  }
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const state = progressState(profile.data());
    if (body.kind === "shield") {
      const { tz, today } = todayFor(body.timezone, profile.data(), now);
      const bought = buyShield(state, today);
      if (!bought.ok) return { status: 409, body: { error: bought.reason } };
      writeProfile(tx, userRef, { ...bought.patch, timezone: tz });
      return { status: 200, body: { progression: bought.result, loot: lootView({ ...state, dust: bought.patch.dust }) } };
    }
    const crafted = craftItem(state, body.item as string, now);
    if (!crafted.ok) return { status: crafted.reason === "unknown-item" ? 400 : 409, body: { error: crafted.reason } };
    writeProfile(tx, userRef, crafted.patch);
    return { status: 200, body: { ...crafted.result, loot: lootView({ ...state, ...crafted.patch }) } };
  });
}

const SLOTS: readonly Slot[] = ["satellite", "ring", "title", "background"];

// POST /api/equip — { slot, item | null } или { showcase: [...] }
export async function equipUserItem(uid: string, body: { slot?: unknown; item?: unknown; showcase?: unknown }): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  return store.runTransaction(async (tx) => {
    const profile = await tx.get(userRef);
    if (!profile.exists) return { status: 409, body: { error: "no-profile" } };
    const state = progressState(profile.data());
    let done: { ok: true; equipped: Equipped } | { ok: false };
    if (body.showcase !== undefined) {
      done = setShowcase({ ...state, achievements: state.achievements as string[] | undefined }, body.showcase);
    } else if (SLOTS.includes(body.slot as Slot) && (body.item === null || typeof body.item === "string")) {
      done = equipItem(state, body.slot as Slot, body.item as string | null);
    } else {
      return { status: 400, body: { error: "bad-request" } };
    }
    if (!done.ok) return { status: 409, body: { error: "not-owned" } };
    writeProfile(tx, userRef, { equipped: done.equipped });
    return { status: 200, body: { loot: lootView({ ...state, equipped: done.equipped }) } };
  });
}
