// Уборка пробных аккаунтов (шаг 16 в docs/specs/06-audit-fixes.md): раз в сутки удаляем пробные аккаунты,
// которые 30 дней не открывали, со всеми данными — как при удалении аккаунта в настройках
import { FieldValue } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, db } from "./admin";
import { staleTrials, type TrialCandidate } from "./core/trial";
import { deleteShareLinks } from "./shareLinks";

const PAGE = 1000;
const MAX_PAGES = 20;
// Плановой функции Netlify отведено 30 с: за один запуск — не больше стольких аккаунтов, остальные — завтра
const PER_RUN = 40;
// Сколько пробных аккаунтов удалено всего — одно число для админ-панели, без uid и дат
export const TRIAL_STATS_DOC = "adminStats/trials";

const iso = (s: string | undefined | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

const candidateOf = (u: UserRecord): TrialCandidate => ({
  uid: u.uid,
  providers: u.providerData.length,
  email: u.email ?? null,
  createdAt: iso(u.metadata.creationTime),
  lastSignInAt: iso(u.metadata.lastSignInTime),
  lastRefreshAt: iso(u.metadata.lastRefreshTime),
});

// Данные человека: ссылки на наборы, профиль со всеми вложенными коллекциями (наборы, журнал тренировок)
// и занятое имя. Сначала данные, потом аккаунт: сбой посередине — аккаунт остаётся, завтра попробуем снова
async function deleteTrialData(uid: string): Promise<void> {
  const store = db();
  const userRef = store.doc(`users/${uid}`);
  const usernameLower = (await userRef.get()).get("usernameLower");
  await deleteShareLinks(uid);
  await store.recursiveDelete(userRef);
  if (typeof usernameLower === "string" && usernameLower) {
    const nameRef = store.doc(`usernames/${usernameLower}`);
    // Имя освобождаем, только если оно всё ещё за этим человеком
    if ((await nameRef.get()).get("uid") === uid) await nameRef.delete();
  }
}

export async function cleanupTrials(now = new Date()): Promise<{ deleted: number; left: number }> {
  const candidates: TrialCandidate[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await adminAuth().listUsers(PAGE, pageToken);
    candidates.push(...res.users.map(candidateOf));
    pageToken = res.pageToken;
    if (!pageToken) break;
  }

  const stale = staleTrials(candidates, now);
  const batch = stale.slice(0, PER_RUN);
  const done: string[] = [];
  for (const uid of batch) {
    try {
      await deleteTrialData(uid);
      done.push(uid);
    } catch (err) {
      console.error("[trial-cleanup] data", uid, err);
    }
  }
  if (done.length > 0) {
    const res = await adminAuth().deleteUsers(done);
    res.errors.forEach((e) => console.error("[trial-cleanup] auth", done[e.index], e.error));
    const deleted = res.successCount;
    if (deleted > 0) await db().doc(TRIAL_STATS_DOC).set({ deleted: FieldValue.increment(deleted) }, { merge: true });
    return { deleted, left: stale.length - deleted };
  }
  return { deleted: 0, left: stale.length };
}
