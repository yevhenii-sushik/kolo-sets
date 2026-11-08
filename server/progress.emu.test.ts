// Функции целиком на эмуляторах Firebase: настоящий токен, транзакции, правила не участвуют (Admin SDK).
// Запуск: npm run test:emu
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import sessionFn from "../netlify/functions/session";
import achievementsFn from "../netlify/functions/achievements";
import syncFn from "../netlify/functions/progress-sync";
import goalFn from "../netlify/functions/orbit-goal";
import capsuleFn from "../netlify/functions/capsules-open";
import dustFn from "../netlify/functions/dust-spend";
import equipFn from "../netlify/functions/equip";
import cleanupFn from "../netlify/functions/account-cleanup";
import { addDays, dayKey } from "./core/time";
import { weekOf } from "./core/orbit";
import { adminAuth, db } from "./admin";
import { AchievementType } from "../src/types";

const UID = "qa-user";
let token = "";

async function idToken(uid: string): Promise<string> {
  const custom = await adminAuth().createCustomToken(uid);
  const res = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=fake`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: custom, returnSecureToken: true }) },
  );
  return (await res.json()).idToken;
}

const call = (fn: (r: Request) => Promise<Response>, body: unknown, auth = token) =>
  fn(
    new Request("http://localhost/api", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}) },
      body: JSON.stringify(body),
    }),
  );

const cards = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, word: `w${i}`, translation: `t${i}` }));
let seq = 0;
const session = (over: Record<string, unknown> = {}) => ({
  id: `sess-${Date.now()}-${seq++}`,
  kind: "flashcards",
  collectionIds: ["set-a"],
  cards: 5,
  durationSec: 60,
  timezone: "Europe/Oslo",
  ...over,
});

beforeAll(async () => {
  await adminAuth().createUser({ uid: UID }).catch(() => {});
  token = await idToken(UID);
});

beforeEach(async () => {
  // Чистый профиль и два набора перед каждым тестом
  const user = db().doc(`users/${UID}`);
  for (const sub of ["sessions", "collections"]) {
    const snap = await user.collection(sub).get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }
  await user.set({ username: "qa", currentStreak: 0, longestStreak: 0, achievements: [], studyHistory: [], stats: {} });
  await user.collection("collections").doc("set-a").set({ name: "A", cards: cards(6) });
  await user.collection("collections").doc("set-b").set({ name: "B", cards: cards(6) });
});

describe("POST /api/session", () => {
  it("без токена — 401, с чужим мусором — 400", async () => {
    expect((await call(sessionFn, session(), "")).status).toBe(401);
    expect((await call(sessionFn, { kind: "cheat" })).status).toBe(400);
  });

  it("засчитывает тренировку: серия, история, счётчики, журнал", async () => {
    const res = await call(sessionFn, session());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.streak).toEqual({ current: 1, longest: 1, extendedToday: true });
    expect(body.newAchievements).toContain(AchievementType.FIRST_STUDY);

    const profile = (await db().doc(`users/${UID}`).get()).data()!;
    expect(profile.currentStreak).toBe(1);
    expect(profile.stats.flashcardSessions).toBe(1);
    expect(profile.studyHistory).toHaveLength(1);
    expect(profile.lastStudyDate).toBeInstanceOf(Timestamp);
    expect(profile.timezone).toBe("Europe/Oslo");
    expect((await db().collection(`users/${UID}/sessions`).get()).size).toBe(1);
  });

  it("повторная отправка той же тренировки не засчитывается дважды", async () => {
    const s = session();
    await call(sessionFn, s);
    const again = await (await call(sessionFn, s)).json();
    expect(again.duplicate).toBe(true);
    const profile = (await db().doc(`users/${UID}`).get()).data()!;
    expect(profile.stats.flashcardSessions).toBe(1);
    expect(profile.studyHistory[0].sessions).toBe(1);
  });

  it("неправдоподобная и с чужим набором — 422, профиль не меняется", async () => {
    expect((await call(sessionFn, session({ cards: 50, durationSec: 600 }))).status).toBe(422);
    expect((await call(sessionFn, session({ cards: 5, durationSec: 1 }))).status).toBe(422);
    expect((await call(sessionFn, session({ collectionIds: ["nope"] }))).status).toBe(422);
    const profile = (await db().doc(`users/${UID}`).get()).data()!;
    expect(profile.currentStreak).toBe(0);
  });

  it("не больше шести тренировок в минуту", async () => {
    for (let i = 0; i < 6; i++) expect((await call(sessionFn, session())).status).toBe(200);
    expect((await call(sessionFn, session())).status).toBe(429);
  });

  it("игра продлевает серию и не трогает счётчик флэшкарт", async () => {
    const body = await (await call(sessionFn, session({ kind: "match", cards: 6, durationSec: 40 }))).json();
    expect(body.streak.extendedToday).toBe(true);
    expect(body.stats.gamesPlayed).toBe(1);
    expect(body.stats.flashcardSessions).toBe(0);
  });
});

describe("POST /api/achievements", () => {
  it("открывает достижения за наборы и слова по данным сервера, один раз", async () => {
    const first = await (await call(achievementsFn, {})).json();
    expect(first.newAchievements).toEqual(expect.arrayContaining([AchievementType.FIRST_COLLECTION, AchievementType.CARDS_10]));
    expect(first.newAchievements).not.toContain(AchievementType.NIGHT_OWL);
    expect(first.progression.xp.gained).toBeGreaterThan(0);
    expect((await db().doc(`users/${UID}`).get()).data()!.xp).toBe(first.progression.xp.total);
    const second = await (await call(achievementsFn, {})).json();
    expect(second.newAchievements).toEqual([]);
  });
});

describe("опыт и орбиты", () => {
  const today = () => dayKey(new Date(), "Europe/Oslo");
  const profile = async () => (await db().doc(`users/${UID}`).get()).data()!;

  it("тренировка начисляет опыт и засчитывает день недели", async () => {
    const body = await (await call(sessionFn, session())).json();
    expect(body.progression.orbit).toMatchObject({ week: weekOf(today()), days: [today()], goalSet: false });
    expect(body.progression.xp.gained).toBeGreaterThan(5);
    const p = await profile();
    expect(p.xp).toBe(body.progression.xp.total);
    expect(p.orbit.days).toEqual([today()]);
    expect(p.xpDay).toEqual({ day: today(), amount: 5 });
  });

  it("синхронизация переводит старый профиль один раз и потом ничего не пишет", async () => {
    // Две прошлые недели по три дня и рекорд старых огоньков 12
    const week = weekOf(today());
    const days = [-14, -13, -12, -7, -6, -5].map((n) => addDays(week, n));
    await db()
      .doc(`users/${UID}`)
      .update({ longestStreak: 12, studyHistory: days.map((date) => ({ date, sessions: 1, cardsStudied: 20, timeSpent: 60 })) });

    const res = await call(syncFn, { timezone: "Europe/Oslo" });
    expect(res.status).toBe(200);
    const { progression } = await res.json();
    expect(progression.orbit).toMatchObject({ streak: 2, longest: 2, goalSet: false, week });
    expect(progression.xp).toMatchObject({ total: 120, levelUp: false });
    const first = await db().doc(`users/${UID}`).get();
    expect(first.data()!.legacyFlames).toBe(12);

    await call(syncFn, { timezone: "Europe/Oslo" });
    const second = await db().doc(`users/${UID}`).get();
    expect(second.updateTime?.toMillis()).toBe(first.updateTime?.toMillis());
    expect(second.data()!.xp).toBe(120);
  });

  it("цель недели: проверка, первый выбор сразу, следующий — с понедельника", async () => {
    expect((await call(goalFn, { goal: 2 })).status).toBe(400);
    expect((await call(goalFn, { goal: "5" })).status).toBe(400);
    expect((await call(goalFn, { goal: 5 }, "")).status).toBe(401);

    const first = await (await call(goalFn, { goal: 5, timezone: "Europe/Oslo" })).json();
    expect(first.progression.orbit).toMatchObject({ goal: 5, goalSet: true });
    const second = await (await call(goalFn, { goal: 4, timezone: "Europe/Oslo" })).json();
    expect(second.progression.orbit).toMatchObject({ goal: 5, nextGoal: 4 });
    expect((await profile()).orbit).toMatchObject({ goal: 5, nextGoal: 4, goalSet: true });
    // Вернуть прежнюю цель — поле nextGoal исчезает из базы, а не остаётся от прошлого раза
    await call(goalFn, { goal: 5, timezone: "Europe/Oslo" });
    expect((await profile()).orbit).not.toHaveProperty("nextGoal");
  });
});

describe("капсулы, пыль и предметы", () => {
  const user = () => db().doc(`users/${UID}`);

  it("первая синхронизация дарит капсулу; открыть — предмет в инвентаре, капсул меньше", async () => {
    expect((await call(capsuleFn, {})).status).toBe(409); // капсул ещё нет
    const { progression } = await (await call(syncFn, { timezone: "Europe/Oslo" })).json();
    expect(progression.capsules).toEqual({ count: 1, gained: 1 });

    const res = await call(capsuleFn, {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item).toMatch(/^(sat|ring|bg|title)_/);
    expect(body.loot.capsules).toBe(0);
    const p = (await user().get()).data()!;
    expect(p.capsules).toBe(0);
    expect(p.pity + (["epic", "legendary"].includes(body.rarity) ? 1 : 0)).toBeLessThanOrEqual(1);
    expect(p.inventory[body.item].n).toBe(1);
    expect(p.inventory[body.item].at).toBeInstanceOf(Timestamp);
    expect((await call(capsuleFn, {})).status).toBe(409);
  });

  it("пыль: недостающий предмет и щит", async () => {
    await call(syncFn, { timezone: "Europe/Oslo" });
    await user().update({ dust: 300 });
    expect((await call(dustFn, { kind: "item", item: "sat_saturn" })).status).toBe(409); // эпический — нельзя
    expect((await call(dustFn, { kind: "item", item: "nope" })).status).toBe(400);
    expect((await call(dustFn, { kind: "potion" })).status).toBe(400);

    const crafted = await (await call(dustFn, { kind: "item", item: "sat_moon" })).json();
    expect(crafted).toMatchObject({ item: "sat_moon", cost: 40, loot: { dust: 260 } });
    const shield = await (await call(dustFn, { kind: "shield", timezone: "Europe/Oslo" })).json();
    expect(shield.progression.orbit.shields).toBe(1);
    expect(shield.loot.dust).toBe(140);
    const p = (await user().get()).data()!;
    expect(p).toMatchObject({ dust: 140, orbit: { shields: 1 } });
    expect(p.inventory.sat_moon.n).toBe(1);
  });

  it("надеть можно только своё; витрина — из своего", async () => {
    await user().update({ inventory: { sat_moon: { n: 1 } }, medals: ["collection_sky"] });
    expect((await call(equipFn, { slot: "satellite", item: "sat_mars" })).status).toBe(409);
    expect((await call(equipFn, { slot: "hat", item: "sat_moon" })).status).toBe(400);
    const on = await (await call(equipFn, { slot: "satellite", item: "sat_moon" })).json();
    expect(on.loot.equipped).toEqual({ satellite: "sat_moon", showcase: [] });
    const show = await (await call(equipFn, { showcase: ["collection_sky", "sat_moon"] })).json();
    expect(show.loot.equipped.showcase).toEqual(["collection_sky", "sat_moon"]);
    await call(equipFn, { slot: "satellite", item: null });
    expect((await user().get()).data()!.equipped).toEqual({ showcase: ["collection_sky", "sat_moon"] });
  });
});

describe("удаление аккаунта", () => {
  it("журнал тренировок удаляет сервер", async () => {
    await call(sessionFn, session());
    await call(sessionFn, session());
    expect((await db().collection(`users/${UID}/sessions`).get()).size).toBe(2);
    const res = await call(cleanupFn, {});
    expect(await res.json()).toEqual({ deleted: 2 });
    expect((await db().collection(`users/${UID}/sessions`).get()).size).toBe(0);
  });
});

describe("бета-тестеры", () => {
  it("первая синхронизация: дата регистрации из Auth, медаль, титул и кольцо — один раз", async () => {
    const first = await (await call(syncFn, { timezone: "Europe/Oslo" })).json();
    expect(first.granted).toEqual(["beta_tester"]);
    expect(first.loot.medals).toContain("beta_tester");
    const p = (await db().doc(`users/${UID}`).get()).data()!;
    expect(p.joinedAt).toBeInstanceOf(Timestamp);
    expect(p.inventory.title_beta_tester.n).toBe(1);
    expect(p.inventory.ring_beta.n).toBe(1);
    const second = await (await call(syncFn, { timezone: "Europe/Oslo" })).json();
    expect(second.granted).toBeUndefined();
    expect((await call(equipFn, { slot: "ring", item: "ring_beta" })).status).toBe(200);
  });

  it("зарегистрировался после конца 2026 — ничего", async () => {
    await db().doc(`users/${UID}`).update({ joinedAt: Timestamp.fromMillis(Date.parse("2027-03-01")) });
    const r = await (await call(syncFn, { timezone: "Europe/Oslo" })).json();
    expect(r.granted).toBeUndefined();
    expect((await db().doc(`users/${UID}`).get()).data()!.medals ?? []).not.toContain("beta_tester");
  });
});
