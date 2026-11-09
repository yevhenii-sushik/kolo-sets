// Прогресс начисляет сервер (docs/specs/00-server.md): клиент сообщает о тренировке и получает результат.
// Если сеть пропала или сервер временно недоступен, тренировка ждёт в очереди и уйдёт при следующем запуске.
import { auth } from "../firebase/config";
import { ApiError, post } from "./http";
import type { AchievementType } from "../types";
import type { ProgressionView } from "../../server/core/progression";
import type { Rarity } from "../../server/core/items";
import type { CollectionDone, Equipped, Slot } from "../../server/core/loot";

// Опыт и орбита недели — как их отдаёт сервер (docs/specs/02-progression.md)
export type Progression = ProgressionView;
export type OrbitEventName = Progression["events"][number];

export type SessionKind = "flashcards" | "review" | "quiz" | "speed" | "survival" | "match";

export interface SessionPayload {
  kind: SessionKind;
  collectionIds: string[];
  cards: number;
  correct?: number;
  allKnow?: boolean;
  durationSec: number;
}

export interface SessionReply {
  streak: { current: number; longest: number; extendedToday: boolean };
  newAchievements: AchievementType[];
  progression?: Progression; // нет у тренировок, записанных до этапа 2
  duplicate?: boolean;
}

// Повторять имеет смысл только то, что может пройти позже: сеть, перегрузка, сбой сервера
const retriable = (err: unknown) => !(err instanceof ApiError) || err.status === 429 || err.status >= 500;

interface Pending extends SessionPayload {
  id: string;
  timezone: string;
}

const queueKey = (uid: string) => `kolo_pending_sessions_${uid}`;

function readQueue(uid: string): Pending[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey(uid)) ?? "[]");
  } catch {
    return [];
  }
}

function writeQueue(uid: string, items: Pending[]) {
  try {
    if (items.length) localStorage.setItem(queueKey(uid), JSON.stringify(items.slice(-50)));
    else localStorage.removeItem(queueKey(uid));
  } catch {
    // Хранилище недоступно (приватный режим) — тренировка просто не попадёт в очередь
  }
}

const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

// null — сервер пока недоступен, тренировка поставлена в очередь (или отклонена как неправдоподобная)
export async function submitSession(payload: SessionPayload): Promise<SessionReply | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;
  const body: Pending = { id: crypto.randomUUID(), ...payload, durationSec: Math.max(1, Math.round(payload.durationSec)), timezone: timeZone() };
  try {
    return await post<SessionReply>("/api/session", body);
  } catch (err) {
    if (retriable(err)) writeQueue(uid, [...readQueue(uid), body]);
    else console.warn("Session not accepted:", err);
    return null;
  }
}

// Отправить накопившиеся тренировки; возвращает ответы тех, что приняты
export async function flushPendingSessions(): Promise<SessionReply[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const queue = readQueue(uid);
  if (queue.length === 0) return [];
  const replies: SessionReply[] = [];
  const left: Pending[] = [];
  for (const item of queue) {
    try {
      replies.push(await post<SessionReply>("/api/session", item));
    } catch (err) {
      if (retriable(err)) left.push(item);
    }
  }
  writeQueue(uid, left);
  return replies;
}

// Достижения за наборы и слова — после создания набора, импорта или добавления слов (с опытом и капсулами)
export async function recheckAchievements(): Promise<{ newAchievements: AchievementType[]; progression?: Progression }> {
  try {
    return await post<{ newAchievements: AchievementType[]; progression?: Progression }>("/api/achievements", { timezone: timeZone() });
  } catch {
    return { newAchievements: [] };
  }
}

// При открытии приложения: итоги прошедших недель и особые награды (бета-тестерам). null — сервер недоступен
export interface SyncReply {
  progression: Progression;
  granted?: string[];
  loot?: Loot;
}

export async function syncProgress(): Promise<SyncReply | null> {
  try {
    return await post<SyncReply>("/api/progress-sync", { timezone: timeZone() });
  } catch {
    return null;
  }
}

// Цель недели 3–7; ошибку показывает тот, кто вызвал
export async function setOrbitGoal(goal: number): Promise<Progression> {
  return (await post<{ progression: Progression }>("/api/orbit-goal", { goal, timezone: timeZone() })).progression;
}

// ── Награды (docs/specs/02-progression.md → «2b»). Ошибки пробрасываются: их показывает тот, кто вызвал

export type { Rarity, Equipped, Slot };

// Награды в профиле — как их возвращает сервер после каждого действия
export interface Loot {
  capsules: number;
  pity: number;
  dust: number;
  inventory: Record<string, { n: number }>;
  medals: string[];
  equipped: Equipped;
}

export interface CapsuleResult {
  item: string;
  rarity: Rarity;
  duplicate: boolean;
  dust: number;
  completed?: CollectionDone;
  loot: Loot;
}

export const openCapsule = () => post<CapsuleResult>("/api/capsules-open", {});

export const craftItem = (item: string) =>
  post<{ item: string; cost: number; completed?: CollectionDone; loot: Loot }>("/api/dust-spend", { kind: "item", item });

export const buyShield = () =>
  post<{ progression: Progression; loot: Loot }>("/api/dust-spend", { kind: "shield", timezone: timeZone() });

export const equipItem = (slot: Slot, item: string | null) => post<{ loot: Loot }>("/api/equip", { slot, item });

export const saveShowcase = (showcase: string[]) => post<{ loot: Loot }>("/api/equip", { showcase });

// Перед удалением аккаунта: журнал тренировок удаляет сервер. false — сервер недоступен
export const cleanupAccount = () => post<{ deleted: number }>("/api/account-cleanup", {}).then(() => true, () => false);
