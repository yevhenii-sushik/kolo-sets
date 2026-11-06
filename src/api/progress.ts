// Прогресс начисляет сервер (docs/specs/00-server.md): клиент сообщает о тренировке и получает результат.
// Если сеть пропала или сервер временно недоступен, тренировка ждёт в очереди и уйдёт при следующем запуске.
import { auth } from "../firebase/config";
import type { AchievementType } from "../types";

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
  duplicate?: boolean;
}

class ApiError extends Error {
  constructor(public status: number) {
    super(`api ${status}`);
  }
}

// Повторять имеет смысл только то, что может пройти позже: сеть, перегрузка, сбой сервера
const retriable = (err: unknown) => !(err instanceof ApiError) || err.status === 429 || err.status >= 500;

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new ApiError(401);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}

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

// Достижения за наборы и слова — после создания набора, импорта или добавления слов
export async function recheckAchievements(): Promise<AchievementType[]> {
  try {
    return (await post<{ newAchievements: AchievementType[] }>("/api/achievements", {})).newAchievements;
  } catch {
    return [];
  }
}
