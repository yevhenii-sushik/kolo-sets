import { describe, expect, it } from "vitest";
import { isAdminClaims, learningView, lookupCandidates, newestAccounts, profileView, sessionRow, summarizeAccounts, type AccountLite } from "./admin";

describe("права админа", () => {
  it("только claim admin === true", () => {
    expect(isAdminClaims({ admin: true })).toBe(true);
    expect(isAdminClaims({ admin: "true" })).toBe(false);
    expect(isAdminClaims({ admin: 1 })).toBe(false);
    expect(isAdminClaims({})).toBe(false);
    expect(isAdminClaims(null)).toBe(false);
  });
});

describe("поиск пользователя", () => {
  it("email — в нижнем регистре и только как email", () => {
    expect(lookupCandidates("  Anna@Example.com ")).toEqual([{ by: "email", value: "anna@example.com" }]);
  });
  it("@имя — только имя пользователя", () => {
    expect(lookupCandidates("@Anna_K")).toEqual([{ by: "username", value: "anna_k" }]);
  });
  it("строка без @ — сначала имя, потом uid", () => {
    expect(lookupCandidates("anna_k")).toEqual([
      { by: "username", value: "anna_k" },
      { by: "uid", value: "anna_k" },
    ]);
  });
  it("uid Firebase (28 символов) — не имя: длиннее 20 и с заглавными", () => {
    expect(lookupCandidates("aB3dE5fG7hJ9kL1mN3pQ5rS7tU9")).toEqual([{ by: "uid", value: "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9" }]);
  });
  it("мусор и пустая строка — ничего", () => {
    expect(lookupCandidates("")).toEqual([]);
    expect(lookupCandidates("   ")).toEqual([]);
    expect(lookupCandidates(42)).toEqual([]);
    expect(lookupCandidates("a b")).toEqual([]);
    expect(lookupCandidates("@")).toEqual([]);
    expect(lookupCandidates("x".repeat(300))).toEqual([]);
  });
});

const NOW = new Date("2026-11-11T12:00:00Z");
const acc = (over: Partial<AccountLite>): AccountLite => ({
  uid: "u",
  email: null,
  name: null,
  createdAt: null,
  lastActiveAt: null,
  providers: ["password"],
  verified: false,
  disabled: false,
  ...over,
});

describe("сводка по аккаунтам", () => {
  const list = [
    acc({ uid: "a", createdAt: "2026-11-11T08:00:00Z", lastActiveAt: "2026-11-11T09:00:00Z", providers: ["google.com"], verified: true }),
    acc({ uid: "b", createdAt: "2026-11-05T12:00:01Z", lastActiveAt: "2026-11-10T13:00:00Z" }),
    acc({ uid: "c", createdAt: "2026-10-20T00:00:00Z", lastActiveAt: "2026-10-25T00:00:00Z", providers: ["google.com", "password"] }),
    acc({ uid: "d", createdAt: "2025-01-01T00:00:00Z", lastActiveAt: null, providers: [], disabled: true }),
  ];
  const s = summarizeAccounts(list, NOW);

  it("считает всего, подтверждённые, отключённые", () => {
    expect([s.total, s.verified, s.disabled]).toEqual([4, 1, 1]);
  });
  it("новые и активные — по скользящему окну от «сейчас»", () => {
    expect([s.new7, s.new30]).toEqual([2, 3]);
    expect([s.active1, s.active7, s.active30]).toEqual([2, 2, 3]);
  });
  it("способы входа: аккаунт с двумя способами считается в обоих, без способов — other", () => {
    expect(s.providers).toEqual({ "google.com": 2, password: 2, other: 1 });
  });
  it("регистрации по дням UTC: 30 дней, последний — сегодня, старые за окном не попадают", () => {
    expect(s.byDay).toHaveLength(30);
    expect(s.byDay[29]).toEqual({ day: "2026-11-11", signups: 1 });
    expect(s.byDay[0].day).toBe("2026-10-13");
    expect(s.byDay.find((d) => d.day === "2026-11-05")?.signups).toBe(1);
    expect(s.byDay.reduce((n, d) => n + d.signups, 0)).toBe(3);
  });
  it("самые новые — первыми, без даты — в конце", () => {
    expect(newestAccounts(list, 3).map((a) => a.uid)).toEqual(["a", "b", "c"]);
    expect(newestAccounts([acc({ uid: "x" }), acc({ uid: "y", createdAt: "2026-01-01T00:00:00Z" })], 2).map((a) => a.uid)).toEqual(["y", "x"]);
  });
});

describe("вид профиля", () => {
  it("пустой или чужой формы профиль не ломает панель", () => {
    const v = profileView(null);
    expect(v.level).toBe(1);
    expect(v.orbit).toBeNull();
    expect(v.courses).toEqual([]);
    expect(v.history).toEqual([]);
    expect(profileView({ stats: "x", inventory: [1], medals: [1, "m"], courses: [null, { id: "en" }] }).loot.medals).toEqual(["m"]);
  });
  it("берёт прогресс, награды, курсы и последние дни занятий", () => {
    const v = profileView({
      username: "anna",
      level: 4,
      xp: 640,
      orbit: { week: "2026-W46", days: ["2026-11-09", "2026-11-10"], goal: 4, goalSet: true, closed: false, streak: 3, longest: 5, shields: 1 },
      capsules: 2,
      dust: 80,
      inventory: { mars: { n: 2 }, venus: { n: 0 }, junk: 5 },
      medals: ["beta"],
      achievements: ["FIRST_SESSION", "STREAK_3"],
      courses: [{ id: "en" }, { id: "nb" }],
      activeCourseId: "nb",
      legalAcceptance: { version: "2026-11-08" },
      studyHistory: Array.from({ length: 20 }, (_, i) => ({ date: `2026-10-${String(i + 10).padStart(2, "0")}`, sessions: 1 })),
    });
    expect(v.orbit).toMatchObject({ days: 2, goal: 4, streak: 3, shields: 1 });
    expect(v.loot).toEqual({ capsules: 2, dust: 80, pity: 0, items: 1, medals: ["beta"] });
    expect(v.achievements).toBe(2);
    expect(v.courses).toEqual(["en", "nb"]);
    expect(v.legalVersion).toBe("2026-11-08");
    expect(v.history).toHaveLength(14);
    expect(v.history[0].date).toBe("2026-10-29");
  });
});

describe("учёба и тренировки", () => {
  it("наборы — только счётчики по курсам, крупные курсы первыми", () => {
    expect(learningView([
      { courseId: "en", cards: 10 },
      { courseId: "nb", cards: 40 },
      { courseId: "en", cards: 5 },
      { courseId: undefined, cards: 3 },
    ])).toEqual({
      sets: 4,
      cards: 58,
      byCourse: [
        { courseId: "nb", sets: 1, cards: 40 },
        { courseId: "en", sets: 2, cards: 15 },
        { courseId: null, sets: 1, cards: 3 },
      ],
    });
  });
  it("строка тренировки: опыт — из результата, неизвестное — null", () => {
    expect(sessionRow("s1", { kind: "quiz", cards: 10, correct: 8, durationSec: 95, day: "2026-11-10", result: { progression: { xp: { gained: 34 } } } }))
      .toEqual({ id: "s1", kind: "quiz", cards: 10, correct: 8, durationSec: 95, day: "2026-11-10", createdAt: null, xp: 34 });
    expect(sessionRow("s2", {})).toMatchObject({ kind: "unknown", correct: null, xp: null });
  });
});
