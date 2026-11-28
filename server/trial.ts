// Уборка (шаг 16 в docs/specs/06-audit-fixes.md): раз в сутки удаляем пробные аккаунты и новые аккаунты на так и не
// подтверждённую почту, которые 30 дней не открывали, со всеми данными — как при удалении аккаунта в настройках
import { FieldValue } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, db } from "./admin";
import { staleAccounts, type StaleKind, type TrialCandidate } from "./core/trial";
import { deleteShareLinks } from "./shareLinks";
import { rateLimitDoc } from "./support";

const PAGE = 1000;
const MAX_PAGES = 20;
// Плановой функции Netlify отведено 30 с: за один запуск — не больше стольких аккаунтов, остальные — завтра
const PER_RUN = 40;
// Сколько удалено всего — одно число на вид для админ-панели, без uid и дат
export const TRIAL_STATS_DOC = "adminStats/trials";
export const UNVERIFIED_STATS_DOC = "adminStats/unverified";
const STATS_DOC: Record<StaleKind, string> = { trial: TRIAL_STATS_DOC, unverified: UNVERIFIED_STATS_DOC };

const iso = (s: string | undefined | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

const candidateOf = (u: UserRecord): TrialCandidate => ({
  uid: u.uid,
  providers: u.providerData.length,
  providerIds: u.providerData.map((p) => p.providerId),
  emailVerified: u.emailVerified,
  email: u.email ?? null,
  createdAt: iso(u.metadata.creationTime),
  lastSignInAt: iso(u.metadata.lastSignInTime),
  lastRefreshAt: iso(u.metadata.lastRefreshTime),
});

// Данные человека: ссылки на наборы, профиль со всеми вложенными коллекциями (наборы, журнал тренировок),
// занятое имя и счётчики лимитов. Сначала данные, потом аккаунт: сбой посередине — аккаунт остаётся, завтра снова
async function deleteAccountData(uid: string): Promise<void> {
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
  await rateLimitDoc(uid).delete();
}

export async function cleanupTrials(now = new Date()): Promise<{ deleted: Record<StaleKind, number>; left: number }> {
  const candidates: TrialCandidate[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await adminAuth().listUsers(PAGE, pageToken);
    candidates.push(...res.users.map(candidateOf));
    pageToken = res.pageToken;
    if (!pageToken) break;
  }

  const stale = staleAccounts(candidates, now);
  const done: { uid: string; kind: StaleKind }[] = [];
  for (const item of stale.slice(0, PER_RUN)) {
    try {
      await deleteAccountData(item.uid);
      done.push(item);
    } catch (err) {
      console.error("[trial-cleanup] data", item.uid, err);
    }
  }
  const deleted: Record<StaleKind, number> = { trial: 0, unverified: 0 };
  if (done.length > 0) {
    const res = await adminAuth().deleteUsers(done.map((d) => d.uid));
    const failed = new Set(res.errors.map((e) => e.index));
    res.errors.forEach((e) => console.error("[trial-cleanup] auth", done[e.index].uid, e.error));
    done.forEach((d, i) => !failed.has(i) && deleted[d.kind]++);
    for (const kind of Object.keys(deleted) as StaleKind[]) {
      if (deleted[kind] > 0) await db().doc(STATS_DOC[kind]).set({ deleted: FieldValue.increment(deleted[kind]) }, { merge: true });
    }
  }
  return { deleted, left: stale.length - deleted.trial - deleted.unverified };
}
