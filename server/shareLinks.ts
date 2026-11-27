// Набор по ссылке (docs/specs/07-shared-sets.md): реестр sharedSets/{id} → { ownerUid, collectionId, createdAt }.
// Пишет и читает только сервер, клиентам реестр закрыт общим запретом в firestore.rules
import { randomBytes } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./admin";
import { isShareId, makeShareId, publicSet, type ShareLinkInput } from "./core/shareLinks";
import type { Reply } from "./progress";

const REGISTRY = "sharedSets";
const notFound: Reply = { status: 404, body: { error: "not-found" } };

// Ссылки этого набора. Обычно одна; две — только если «Создать» нажали одновременно на двух устройствах
const linksOf = (uid: string, collectionId: string) =>
  db().collection(REGISTRY).where("ownerUid", "==", uid).where("collectionId", "==", collectionId).get();

// Владелец: узнать, создать или выключить ссылку на свой набор
export async function shareLink(uid: string, input: ShareLinkInput, now = new Date()): Promise<Reply> {
  const store = db();
  const links = await linksOf(uid, input.collectionId);

  if (input.action === "revoke") {
    // Набор могли уже удалить — ссылки всё равно убираем
    const batch = store.batch();
    links.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return { status: 200, body: { id: null } };
  }

  const set = await store.doc(`users/${uid}/collections/${input.collectionId}`).get();
  if (!set.exists) return notFound;
  const existing = links.docs[0]?.id ?? null;
  if (input.action === "status" || existing) return { status: 200, body: { id: existing } };

  // create() падает, если id уже занят: совпадение при 71 бите почти невозможно, но повторить дёшево
  for (let attempt = 0; attempt < 3; attempt++) {
    const id = makeShareId((n) => randomBytes(n));
    try {
      await store.collection(REGISTRY).doc(id).create({
        ownerUid: uid,
        collectionId: input.collectionId,
        createdAt: Timestamp.fromDate(now),
      });
      return { status: 200, body: { id } };
    } catch (err) {
      if ((err as { code?: number }).code !== 6) throw err; // 6 — ALREADY_EXISTS
    }
  }
  throw new Error("Could not create a unique share id");
}

// Любой, у кого есть ссылка: слова набора, как они сейчас у владельца. viewer — uid, если человек вошёл
export async function readSharedSet(id: string, viewer: string | null): Promise<Reply> {
  if (!isShareId(id)) return notFound;
  const store = db();
  const link = await store.doc(`${REGISTRY}/${id}`).get();
  const data = link.data();
  if (!data || typeof data.ownerUid !== "string" || typeof data.collectionId !== "string") return notFound;

  const set = await store.doc(`users/${data.ownerUid}/collections/${data.collectionId}`).get();
  if (!set.exists) {
    // Набор удалён — ссылка больше ни на что не ведёт
    await link.ref.delete().catch(() => {});
    return notFound;
  }
  return {
    status: 200,
    body: { set: publicSet(set.data() ?? {}), ...(viewer === data.ownerUid ? { own: data.collectionId } : {}) },
  };
}

// Удаление аккаунта: все ссылки человека перестают работать
export async function deleteShareLinks(uid: string): Promise<number> {
  const store = db();
  const links = await store.collection(REGISTRY).where("ownerUid", "==", uid).get();
  for (let i = 0; i < links.docs.length; i += 400) {
    const batch = store.batch();
    links.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return links.size;
}
