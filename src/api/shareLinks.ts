// Набор по ссылке (docs/specs/07-shared-sets.md). Ссылками управляет сервер: реестр клиентам закрыт
import { auth } from "../firebase/config";
import { ApiError, post } from "./http";
import type { SharedSet } from "../../server/core/shareLinks";

export type { SharedCard, SharedSet } from "../../server/core/shareLinks";

type LinkReply = { id: string | null };
const link = (action: "status" | "create" | "revoke", collectionId: string) =>
  post<LinkReply>("/api/share-link", { action, collectionId }).then((r) => r.id);

export const shareLinkStatus = (collectionId: string) => link("status", collectionId);
export const createShareLink = (collectionId: string) => link("create", collectionId);
export const revokeShareLink = (collectionId: string) => link("revoke", collectionId);

export const shareUrl = (id: string) => `${window.location.origin}/s/${id}`;

export interface SharedSetReply {
  set: SharedSet;
  own?: string; // id набора, если ссылку открыл сам владелец
}

// Вход не обязателен: токен отправляем, только если человек вошёл. null — ссылка выключена или набор удалён
export async function fetchSharedSet(id: string): Promise<SharedSetReply | null> {
  const token = await auth.currentUser?.getIdToken().catch(() => undefined);
  const res = await fetch("/api/shared-set", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ id }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<SharedSetReply>;
}
