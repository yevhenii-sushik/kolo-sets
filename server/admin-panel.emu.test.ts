// Админ-панель на эмуляторах Firebase: настоящий токен с claim, отзыв сессий, журнал (docs/specs/admin.md).
// Запуск: npm run test:emu
import { beforeAll, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import overviewFn from "../netlify/functions/admin-overview";
import userFn from "../netlify/functions/admin-user";
import { adminAuth, db } from "./admin";

const ADMIN = "qa-admin";
const PLAIN = "qa-plain";
const TARGET = "qa-target";
let adminToken = "";
let plainToken = "";

async function idToken(uid: string): Promise<string> {
  const custom = await adminAuth().createCustomToken(uid);
  const res = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: custom, returnSecureToken: true }) },
  );
  return (await res.json()).idToken;
}

const call = (fn: (r: Request) => Promise<Response>, body: unknown, auth: string) =>
  fn(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

const ensureUser = (uid: string, email: string) =>
  adminAuth().createUser({ uid, email }).catch(() => adminAuth().updateUser(uid, { email }));

beforeAll(async () => {
  await ensureUser(ADMIN, "admin@qa.test");
  await ensureUser(PLAIN, "plain@qa.test");
  await ensureUser(TARGET, "target@qa.test");
  // claim попадает в токен при входе — ставим до получения токена, как скрипт grant-admin
  await adminAuth().setCustomUserClaims(ADMIN, { admin: true });
  adminToken = await idToken(ADMIN);
  plainToken = await idToken(PLAIN);

  const user = db().doc(`users/${TARGET}`);
  await user.set({ username: "qa_target", level: 3, xp: 400, courses: [{ id: "nb" }], capsules: 1 });
  await db().doc("usernames/qa_target").set({ uid: TARGET });
  await user.collection("collections").doc("s1").set({ name: "Секретный набор", courseId: "nb", cards: [{ word: "hemmelig" }, { word: "ord" }] });
  await user.collection("sessions").doc("t1").set({ kind: "quiz", cards: 10, correct: 9, durationSec: 80, day: "2026-11-10", createdAt: Timestamp.now() });
});

describe("доступ к админским функциям", () => {
  it("без токена — 401, обычный пользователь — 403", async () => {
    expect((await call(overviewFn, {}, "")).status).toBe(401);
    expect((await call(userFn, { query: "target@qa.test" }, "")).status).toBe(401);
    expect((await call(overviewFn, {}, plainToken)).status).toBe(403);
    expect((await call(userFn, { query: "target@qa.test" }, plainToken)).status).toBe(403);
  });
});

describe("POST /api/admin-overview", () => {
  it("считает аккаунты, профили и тренировки", async () => {
    const res = await call(overviewFn, {}, adminToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accounts.total).toBeGreaterThanOrEqual(3);
    expect(body.accounts.byDay).toHaveLength(30);
    expect(body.profiles).toBeGreaterThanOrEqual(1);
    expect(body.sessions.total).toBeGreaterThanOrEqual(1);
    expect(body.sessions.last7).toBeGreaterThanOrEqual(1);
    expect(body.recent.map((a: { uid: string }) => a.uid)).toContain(TARGET);
  });
});

describe("POST /api/admin-user", () => {
  it("находит по email, @имени и uid и пишет каждый просмотр в журнал", async () => {
    for (const query of ["Target@QA.test", "@qa_target", TARGET]) {
      const res = await call(userFn, { query }, adminToken);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.found).toBe(true);
      expect(body.user.account.uid).toBe(TARGET);
    }
    const log = await db().collection("adminLog").where("target", "==", TARGET).get();
    expect(log.size).toBeGreaterThanOrEqual(3);
    expect(log.docs[0].data()).toMatchObject({ admin: ADMIN, action: "user.view" });
  });

  it("прогресс и счётчики есть, названий наборов и слов нет", async () => {
    const res = await call(userFn, { query: TARGET }, adminToken);
    const text = await res.text();
    const { user } = JSON.parse(text);
    expect(user.profile).toMatchObject({ username: "qa_target", level: 3, xp: 400, courses: ["nb"] });
    expect(user.learning).toEqual({ sets: 1, cards: 2, byCourse: [{ courseId: "nb", sets: 1, cards: 2 }] });
    expect(user.sessions[0]).toMatchObject({ id: "t1", kind: "quiz", correct: 9 });
    expect(user.account.admin).toBe(false);
    expect(text).not.toContain("Секретный набор");
    expect(text).not.toContain("hemmelig");
  });

  it("неизвестный — found: false, мусор — 400", async () => {
    expect(await (await call(userFn, { query: "nobody@qa.test" }, adminToken)).json()).toEqual({ found: false });
    expect((await call(userFn, { query: "a b" }, adminToken)).status).toBe(400);
    expect((await call(userFn, null, adminToken)).status).toBe(400);
  });
});

describe("снятие прав", () => {
  it("после отзыва сессий старый токен с claim больше не работает", async () => {
    // Отзыв действует на токены, выданные раньше него, с точностью до секунды
    await new Promise((r) => setTimeout(r, 1100));
    await adminAuth().setCustomUserClaims(ADMIN, null);
    await adminAuth().revokeRefreshTokens(ADMIN);
    expect((await call(overviewFn, {}, adminToken)).status).toBe(401);
  });
});
