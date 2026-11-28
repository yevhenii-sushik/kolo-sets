// Админ-панель: чтение через Admin SDK и журнал просмотров (docs/specs/admin.md).
// Только чтение: прогресс отсюда не меняется, поэтому транзакции не нужны
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, db } from "./admin";
import {
  learningView,
  lookupCandidates,
  newestAccounts,
  profileView,
  rolesOf,
  sessionRow,
  summarizeAccounts,
  type AccountLite,
  type Lookup,
} from "./core/admin";
import { excludedReason, metricUser, retentionMetrics, signedUpWithin, type MetricAccount, type MetricUser } from "./core/metrics";
import type { Reply } from "./progress";
import { TRIAL_STATS_DOC } from "./trial";

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

async function allUsers(): Promise<{ list: UserRecord[]; truncated: boolean }> {
  const list: UserRecord[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await adminAuth().listUsers(PAGE, pageToken);
    list.push(...res.users);
    pageToken = res.pageToken;
    if (!pageToken) return { list, truncated: false };
  }
  return { list, truncated: true };
}

async function allAccounts(): Promise<{ list: AccountLite[]; truncated: boolean }> {
  const { list, truncated } = await allUsers();
  return { list: list.map(accountOf), truncated };
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

const cardCount = (data: FirebaseFirestore.DocumentData) => (Array.isArray(data.cards) ? data.cards.length : 0);

// ── Удержание (шаг 8 в docs/specs/06-audit-fixes.md) ──

// Профили читаем пачками, наборы — по нескольку людей сразу: функции отведено 10 с
const PROFILE_BATCH = 100;
const SETS_PARALLEL = 20;
// Из профиля метрикам нужны только эти поля
const METRIC_FIELDS = ["timezone", "courses", "studyHistory", "orbit", "trialStartedAt"];

async function inChunks<T, R>(items: T[], size: number, run: (chunk: T[]) => Promise<R[]>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await run(items.slice(i, i + size))));
  return out;
}

// POST /api/admin-metrics — когорты по неделе регистрации и воронка новичка. Читаем только тех, кто
// зарегистрировался за окно метрик: одно чтение на профиль и одно на набор. Из наборов — только число
// карточек: слова и названия из функции не выходят
export async function adminMetrics(now = new Date()): Promise<Reply> {
  const store = db();
  const accounts = await allUsers();
  const excluded = { team: 0, disabled: 0 };
  const people: { uid: string; account: MetricAccount }[] = [];
  for (const u of accounts.list) {
    const account: MetricAccount = {
      createdAt: iso(u.metadata.creationTime),
      disabled: u.disabled,
      claims: u.customClaims,
      providers: u.providerData.length,
    };
    if (!signedUpWithin(account.createdAt, now)) continue;
    const reason = excludedReason(account);
    if (reason) excluded[reason]++;
    else people.push({ uid: u.uid, account });
  }

  const profiles = await inChunks(people, PROFILE_BATCH, (chunk) =>
    store.getAll(...chunk.map((p) => store.doc(`users/${p.uid}`)), { fieldMask: METRIC_FIELDS }),
  );
  const setCards = await inChunks(people, SETS_PARALLEL, (chunk) =>
    Promise.all(
      chunk.map((p) =>
        store
          .collection(`users/${p.uid}/collections`)
          .select("cards")
          .get()
          .then((sets) => sets.docs.map((d) => cardCount(d.data()))),
      ),
    ),
  );

  const users = people
    .map((p, i) => metricUser(p.account, profiles[i].exists ? plain(profiles[i].data()) : null, setCards[i], now))
    .filter((u): u is MetricUser => u !== null);
  // Пробные аккаунты, удалённые за 30 дней без входа (server/trial.ts), — одно число за всё время
  const trialStats = await store.doc(TRIAL_STATS_DOC).get();
  const trialsDeleted = typeof trialStats.get("deleted") === "number" ? (trialStats.get("deleted") as number) : 0;
  return { status: 200, body: { ...retentionMetrics(users, now), trialsDeleted, excluded, truncated: accounts.truncated } };
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
          ...rolesOf(record.customClaims),
        },
        profile: profile.exists ? profileView(plain(profile.data())) : null,
        learning: learningView(sets.docs.map((d) => ({ courseId: d.get("courseId"), cards: cardCount(d.data()) }))),
        sessions: sessions.docs.map((d) => sessionRow(d.id, plain(d.data()))),
      },
    },
  };
}
