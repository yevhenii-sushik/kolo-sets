// Запись прогресса в базу: транзакции поверх чистого ядра server/core (docs/specs/00-server.md)
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { AchievementType } from "../src/types";
import { applySession, checkPlausibility, collectionAchievements, type ProgressState, type SessionInput } from "./core/session";
import { db } from "./admin";

export interface Reply {
  status: number;
  body: Record<string, unknown>;
}

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : v instanceof Date ? v : null);

// Поля профиля, которые считает сервер, — в виде, понятном ядру
function progressState(data: FirebaseFirestore.DocumentData | undefined): ProgressState {
  return {
    stats: data?.stats,
    currentStreak: data?.currentStreak,
    longestStreak: data?.longestStreak,
    lastStudyDate: toDate(data?.lastStudyDate),
    lastStudyDay: typeof data?.lastStudyDay === "string" ? data.lastStudyDay : null,
    studyHistory: Array.isArray(data?.studyHistory) ? data.studyHistory : [],
    achievements: Array.isArray(data?.achievements) ? data.achievements : [],
  };
}

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
    tx.set(userRef, patch, { merge: true });
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

// POST /api/achievements — достижения за наборы и слова после их изменения
export async function recheckCollectionAchievements(uid: string): Promise<Reply> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  const [profile, sets] = await Promise.all([userRef.get(), userRef.collection("collections").get()]);
  if (!profile.exists) return { status: 409, body: { error: "no-profile" } };

  const info = {
    cardsInSession: 0,
    totalCards: sets.docs.reduce((n, d) => n + cardCount(d.data()), 0),
    collectionsCount: sets.size,
  };
  const newAchievements: AchievementType[] = collectionAchievements(progressState(profile.data()), info);
  if (newAchievements.length > 0) {
    // arrayUnion: параллельный /api/session не потеряет свои достижения
    await userRef.update({ achievements: FieldValue.arrayUnion(...newAchievements) });
  }
  return { status: 200, body: { newAchievements } };
}
