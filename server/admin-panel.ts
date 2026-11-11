// Админ-панель: чтение через Admin SDK и журнал просмотров (docs/specs/admin.md).
// Только чтение: прогресс отсюда не меняется, поэтому транзакции не нужны
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, db } from "./admin";
import {
  isAdminClaims,
  learningView,
  lookupCandidates,
  newestAccounts,
  profileView,
  sessionRow,
  summarizeAccounts,
  type AccountLite,
  type Lookup,
} from "./core/admin";
import type { Reply } from "./progress";

const DAY_MS = 86_400_000;
// listUsers отдаёт по 1000 аккаунтов; 20 страниц — запас по времени функции (10 с) на 20 000 аккаунтов
const PAGE = 1000;
const MAX_PAGES = 20;
const RECENT = 10;
const SESSIONS = 20;

// Метки времени Firestore → ISO-строки, рекурсивно: ядро работает с обычным JSON
function plain(v: unknown): unknown {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(plain);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plain(x)]));
  return v;
}

// Даты в метаданных Auth — строки вида «Wed, 11 Nov 2026 10:00:00 GMT»
const iso = (s: string | undefined | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

const accountOf = (u: UserRecord): AccountLite => ({
  uid: u.uid,
  email: u.email ?? null,
  name: u.displayName ?? null,
  createdAt: iso(u.metadata.creationTime),
  // lastRefreshTime — последнее обновление токена (приложение было открыто); вход бывает раз в месяцы
  lastActiveAt: iso(u.metadata.lastRefreshTime ?? u.metadata.lastSignInTime),
  providers: u.providerData.map((p) => p.providerId),
  verified: u.emailVerified,
  disabled: u.disabled,
});

async function allAccounts(): Promise<{ list: AccountLite[]; truncated: boolean }> {
  const list: AccountLite[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await adminAuth().listUsers(PAGE, pageToken);
    list.push(...res.users.map(accountOf));
    pageToken = res.pageToken;
    if (!pageToken) return { list, truncated: false };
  }
  return { list, truncated: true };
}

// Счётчик; null — посчитать не вышло. Запросу по группе sessions с фильтром нужен индекс
// (firestore.indexes.json): пока его не выложили, Firestore отвечает FAILED_PRECONDITION
async function countOrNull(query: FirebaseFirestore.Query): Promise<number | null> {
  try {
    return (await query.count().get()).data().count;
  } catch (err) {
    console.warn("[admin] count failed", (err as Error).message);
    return null;
  }
}

// POST /api/admin-overview
export async function adminOverview(now = new Date()): Promise<Reply> {
  const store = db();
  const sessions = store.collectionGroup("sessions");
  const [accounts, profiles, total, last7] = await Promise.all([
    allAccounts(),
    countOrNull(store.collection("users")),
    countOrNull(sessions),
    countOrNull(sessions.where("createdAt", ">=", Timestamp.fromMillis(now.getTime() - 7 * DAY_MS))),
  ]);
  return {
    status: 200,
    body: {
      accounts: summarizeAccounts(accounts.list, now),
      truncated: accounts.truncated,
      profiles,
      sessions: { total, last7 },
      recent: newestAccounts(accounts.list, RECENT),
    },
  };
}

const notFound = (err: unknown) => (err as { code?: string }).code === "auth/user-not-found";

async function resolve(candidates: Lookup[]): Promise<UserRecord | null> {
  for (const c of candidates) {
    try {
      if (c.by === "email") return await adminAuth().getUserByEmail(c.value);
      if (c.by === "uid") return await adminAuth().getUser(c.value);
      // Имя → uid через реестр имён (usernames/{имя} = { uid })
      const uid = (await db().doc(`usernames/${c.value}`).get()).get("uid");
      if (typeof uid === "string") return await adminAuth().getUser(uid);
    } catch (err) {
      if (!notFound(err)) throw err;
    }
  }
  return null;
}

const cardCount = (data: FirebaseFirestore.DocumentData) => (Array.isArray(data.cards) ? data.cards.length : 0);

// POST /api/admin-user { query } — карточка пользователя; каждый просмотр — в журнал adminLog
export async function adminUser(admin: string, query: unknown): Promise<Reply> {
  const candidates = lookupCandidates(query);
  if (!candidates.length) return { status: 400, body: { error: "bad-query" } };
  const record = await resolve(candidates);
  if (!record) return { status: 200, body: { found: false } };

  const store = db();
  const userRef = store.doc(`users/${record.uid}`);
  const [profile, sets, sessions] = await Promise.all([
    userRef.get(),
    // Из наборов — только курс и число карточек: названия и слова в панель не попадают
    userRef.collection("collections").select("courseId", "cards").get(),
    userRef.collection("sessions").orderBy("createdAt", "desc").limit(SESSIONS).get(),
    store.collection("adminLog").add({ at: FieldValue.serverTimestamp(), admin, action: "user.view", target: record.uid }),
  ]);

  return {
    status: 200,
    body: {
      found: true,
      user: {
        account: {
          ...accountOf(record),
          lastSignInAt: iso(record.metadata.lastSignInTime),
          admin: isAdminClaims(record.customClaims),
        },
        profile: profile.exists ? profileView(plain(profile.data())) : null,
        learning: learningView(sets.docs.map((d) => ({ courseId: d.get("courseId"), cards: cardCount(d.data()) }))),
        sessions: sessions.docs.map((d) => sessionRow(d.id, plain(d.data()))),
      },
    },
  };
}
