// Правила базы на эмуляторе Firestore. Запуск: npm run test:emu
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

let env: RulesTestEnvironment;
const blank = {
  username: "qa",
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  achievements: [],
  studyHistory: [],
  stats: { totalCards: 0, cardsLearned: 0, quizzesTaken: 0, flashcardSessions: 0, totalStudyTime: 0, perfectQuizzes: 0 },
};

beforeAll(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? "127.0.0.1:8080").split(":");
  env = await initializeTestEnvironment({
    projectId: "kolo-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host, port: Number(port) },
  });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const seed = (data: Record<string, unknown>) =>
  env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/alice"), data));

describe("профиль", () => {
  it("новый профиль — только с нулями", async () => {
    await assertSucceeds(setDoc(doc(as("alice"), "users/alice"), blank));
    await assertFails(setDoc(doc(as("bob"), "users/bob"), { ...blank, currentStreak: 1000 }));
    await assertFails(setDoc(doc(as("bob"), "users/bob"), { ...blank, achievements: ["streak_100"] }));
    await assertFails(setDoc(doc(as("bob"), "users/bob"), { ...blank, stats: { ...blank.stats, quizzesTaken: 50 } }));
    await assertFails(setDoc(doc(as("bob"), "users/bob"), { ...blank, xp: 0 }));
    await assertFails(setDoc(doc(as("bob"), "users/bob"), { ...blank, inventory: {} }));
  });

  it("владелец меняет имя, курсы и папки, но не прогресс", async () => {
    await seed(blank);
    const me = as("alice");
    await assertSucceeds(updateDoc(doc(me, "users/alice"), { displayName: "Alice", courses: [], activeCourseId: "nb", folders: [] }));
    for (const [field, value] of Object.entries({
      currentStreak: 99,
      longestStreak: 99,
      achievements: ["streak_100"],
      studyHistory: [{ date: "2026-11-06" }],
      lastStudyDate: new Date(),
      lastStudyDay: "2026-11-06",
      timezone: "UTC",
      "stats.flashcardSessions": 100,
      xp: 100000,
      level: 50,
      xpDay: { day: "2026-11-06", amount: 0 },
      weekXp: { week: "2026-11-02", amount: 9999 },
      "orbit.streak": 99,
      "orbit.shields": 2,
      legacyFlames: 365,
      capsules: 99,
      pity: 0,
      dust: 99999,
      "inventory.sat_gold": { n: 1 },
      "equipped.title": "legend",
      medals: ["legacy_flames"],
    })) {
      await assertFails(updateDoc(doc(me, "users/alice"), { [field]: value }));
    }
  });

  it("чужой профиль недоступен", async () => {
    await seed(blank);
    await assertFails(getDoc(doc(as("mallory"), "users/alice")));
    await assertFails(updateDoc(doc(as("mallory"), "users/alice"), { displayName: "x" }));
  });
});

describe("журнал тренировок", () => {
  it("клиент читает и удаляет свой журнал, но не пишет в него", async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/alice/sessions/s1"), { cards: 5 }));
    const me = as("alice");
    await assertSucceeds(getDoc(doc(me, "users/alice/sessions/s1")));
    await assertFails(setDoc(doc(me, "users/alice/sessions/s2"), { cards: 500 }));
    await assertFails(updateDoc(doc(me, "users/alice/sessions/s1"), { cards: 500 }));
    await assertSucceeds(deleteDoc(doc(me, "users/alice/sessions/s1")));
    await assertFails(getDoc(doc(as("mallory"), "users/alice/sessions/s1")));
  });
});

describe("наборы", () => {
  it("владелец полностью управляет своими наборами", async () => {
    const me = as("alice");
    await assertSucceeds(setDoc(doc(me, "users/alice/collections/c1"), { name: "A", cards: [] }));
    await assertSucceeds(updateDoc(doc(me, "users/alice/collections/c1"), { courseId: "nb" }));
    await assertFails(getDoc(doc(as("mallory"), "users/alice/collections/c1")));
  });
});
