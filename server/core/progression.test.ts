import { describe, expect, it } from "vitest";
import { AchievementType } from "../../src/types";
import { achievementXp, capDaily, DAILY_XP_CAP, levelFromXp, sessionXp } from "./xp";
import { orbitFromHistory, recordSession, rollTo, setGoal, weekOf, weekStatus, type OrbitEvent, type OrbitState } from "./orbit";
import { applyGoal, syncProgress } from "./progression";
import { applySession, type SessionInput } from "./session";

const orbit = (over: Partial<OrbitState> = {}): OrbitState => ({
  goal: 3,
  goalSet: true,
  week: "2026-11-02",
  days: [],
  closed: false,
  streak: 0,
  longest: 0,
  shields: 0,
  ...over,
});
const day = (n: number) => `2026-11-0${n}`; // 2 ноября 2026 — понедельник

describe("опыт и уровни", () => {
  it("опыт за тренировку", () => {
    expect(sessionXp("flashcards", 12)).toBe(12);
    expect(sessionXp("quiz", 10, 7)).toBe(17);
    expect(sessionXp("quiz", 10, 10)).toBe(30); // +10 за тест без ошибок
    expect(sessionXp("speed", 80, 55)).toBe(20); // игра — не больше 20 за раунд
  });

  it("дневной потолок 400 и новый день", () => {
    expect(capDaily(150, { day: "2026-11-06", amount: 300 }, "2026-11-06")).toEqual({ gained: 100, xpDay: { day: "2026-11-06", amount: DAILY_XP_CAP } });
    expect(capDaily(150, { day: "2026-11-05", amount: 400 }, "2026-11-06").gained).toBe(150);
    expect(capDaily(50, { day: "2026-11-06", amount: 400 }, "2026-11-06").gained).toBe(0);
  });

  it("уровни дорожают: 100, 150, 200…", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, next: 100 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toEqual({ level: 2, into: 0, next: 150 });
    expect(levelFromXp(250)).toEqual({ level: 3, into: 0, next: 200 });
    expect(levelFromXp(2700).level).toBe(10);
  });

  it("опыт за достижения по размеру", () => {
    expect(achievementXp(AchievementType.FIRST_STUDY)).toBe(25);
    expect(achievementXp(AchievementType.CARDS_100)).toBe(50);
    expect(achievementXp(AchievementType.STREAK_100)).toBe(100);
  });
});

describe("неделя", () => {
  it("понедельник недели", () => {
    expect(weekOf("2026-11-05")).toBe("2026-11-02");
    expect(weekOf("2026-11-08")).toBe("2026-11-02"); // воскресенье — та же неделя
    expect(weekOf("2026-11-02")).toBe("2026-11-02");
    expect(weekOf("2027-01-01")).toBe("2026-12-28"); // через границу года
  });

  it("дни копятся без повторов, на третьем — орбита замкнута", () => {
    const ev: OrbitEvent[] = [];
    let o = recordSession(orbit(), day(2), ev);
    o = recordSession(o, day(2), ev);
    o = recordSession(o, day(4), ev);
    expect(o.days).toEqual([day(2), day(4)]);
    expect(o.closed).toBe(false);
    o = recordSession(o, day(6), ev);
    expect(o).toMatchObject({ closed: true, streak: 1, longest: 1 });
    expect(ev.filter((e) => e === "orbitClosed")).toHaveLength(1);
    // Четвёртый день не замыкает повторно
    const ev2: OrbitEvent[] = [];
    recordSession(o, day(7), ev2);
    expect(ev2).not.toContain("orbitClosed");
  });

  it("щит за каждую 4-ю орбиту, не больше двух", () => {
    const ev: OrbitEvent[] = [];
    const o = recordSession(orbit({ streak: 3, days: [day(2), day(3)] }), day(4), ev);
    expect(o).toMatchObject({ streak: 4, shields: 1 });
    expect(ev).toContain("shieldEarned");
    const full = recordSession(orbit({ streak: 7, shields: 2, days: [day(2), day(3)] }), day(4), []);
    expect(full.shields).toBe(2);
  });

  it("состояние недели", () => {
    expect(weekStatus(orbit({ days: [day(2)] }), day(4))).toBe("onTrack"); // нужно 2, осталось 4 дня (чт–вс)
    expect(weekStatus(orbit({ days: [day(2)] }), day(7))).toBe("atRisk"); // нужно 2, осталось сб и вс
    expect(weekStatus(orbit({ days: [] }), day(7))).toBe("lost"); // нужно 3, осталось 2
    expect(weekStatus(orbit({ closed: true }), day(7))).toBe("closed");
  });
});

describe("итоги недель, щиты и починка", () => {
  it("замкнутая неделя переходит в новую без потерь", () => {
    const ev: OrbitEvent[] = [];
    const o = rollTo(orbit({ closed: true, streak: 2, days: [day(2), day(3), day(4)] }), "2026-11-09", ev);
    expect(o).toMatchObject({ week: "2026-11-09", days: [], closed: false, streak: 2 });
    expect(ev).toEqual([]);
  });

  it("незамкнутую неделю закрывает щит", () => {
    const ev: OrbitEvent[] = [];
    const o = rollTo(orbit({ streak: 5, shields: 1, days: [day(2)] }), "2026-11-09", ev);
    expect(o).toMatchObject({ streak: 5, shields: 0 });
    expect(ev).toEqual(["shieldUsed"]);
  });

  it("без щита серия рвётся, но в пн–ср можно починить тремя тренировками", () => {
    const ev: OrbitEvent[] = [];
    let o = rollTo(orbit({ streak: 6, days: [day(2)] }), "2026-11-09", ev);
    expect(o.streak).toBe(0);
    expect(o.repair).toEqual({ failedWeek: "2026-11-02", until: "2026-11-11", sessions: 0, streakBefore: 6 });
    expect(ev).toEqual(["repairAvailable", "streakBroken"]);
    const ev2: OrbitEvent[] = [];
    o = recordSession(o, "2026-11-09", ev2);
    o = recordSession(o, "2026-11-09", ev2);
    o = recordSession(o, "2026-11-10", ev2);
    expect(o.streak).toBe(6);
    expect(o.repair).toBeUndefined();
    expect(o.lastRepairDay).toBe("2026-11-10");
    expect(ev2).toContain("repaired");
  });

  it("в состоянии нет полей со значением undefined — Firestore их не примет", () => {
    const hasUndefined = (v: unknown): boolean =>
      v === undefined || (typeof v === "object" && v !== null && Object.values(v).some(hasUndefined));
    let o = rollTo(orbit({ streak: 6 }), "2026-11-09", []);
    o = recordSession(recordSession(recordSession(o, "2026-11-09", []), "2026-11-09", []), "2026-11-09", []); // починена
    expect(hasUndefined(o)).toBe(false);
    expect(hasUndefined(recordSession(rollTo(orbit({ streak: 6 }), "2026-11-09", []), "2026-11-12", []))).toBe(false); // окно истекло
    expect(hasUndefined(setGoal(setGoal(orbit(), 5, []), 3, []))).toBe(false);
  });

  it("починка после среды не работает", () => {
    let o = rollTo(orbit({ streak: 6 }), "2026-11-09", []);
    o = recordSession(o, "2026-11-12", []);
    expect(o.repair).toBeUndefined();
    expect(o.streak).toBe(0);
  });

  it("две пропущенные недели — серия начинается заново", () => {
    const ev: OrbitEvent[] = [];
    const o = rollTo(orbit({ streak: 6 }), "2026-11-16", ev);
    expect(o.streak).toBe(0);
    expect(o.repair).toBeUndefined();
  });

  it("починка не чаще раза в 30 дней", () => {
    const o = rollTo(orbit({ streak: 4, lastRepairDay: "2026-10-20" }), "2026-11-09", []);
    expect(o.repair).toBeUndefined();
  });

  it("серия, набранная во время починки, складывается с прежней", () => {
    let o = rollTo(orbit({ streak: 3, goal: 3 }), "2026-11-09", []);
    // В новой неделе цель 3 замыкается за пн–ср — это и есть 3 тренировки починки
    o = recordSession(o, "2026-11-09", []);
    o = recordSession(o, "2026-11-10", []);
    o = recordSession(o, "2026-11-11", []);
    expect(o).toMatchObject({ closed: true, streak: 4 });
  });
});

describe("цель недели", () => {
  it("первый выбор — сразу и может сразу замкнуть орбиту", () => {
    const ev: OrbitEvent[] = [];
    const o = setGoal(orbit({ goalSet: false, days: [day(2), day(3), day(4)], goal: 3 }), 3, ev);
    expect(o).toMatchObject({ goalSet: true, goal: 3, closed: true });
    expect(ev).toContain("orbitClosed");
  });

  it("смена цели — со следующего понедельника", () => {
    let o = setGoal(orbit({ goal: 3 }), 5, []);
    expect(o).toMatchObject({ goal: 3, nextGoal: 5 });
    o = rollTo({ ...o, closed: true }, "2026-11-09", []);
    expect(o.goal).toBe(5);
    expect(o).not.toHaveProperty("nextGoal");
  });

  it("цель ограничена 3–7", () => {
    expect(setGoal(orbit({ goalSet: false }), 1, []).goal).toBe(3);
    expect(setGoal(orbit({ goalSet: false }), 12, []).goal).toBe(7);
  });
});

describe("переход со старых огоньков", () => {
  const hist = (dates: string[]) => dates.map((date) => ({ date, sessions: 1, cardsStudied: 10 }));

  it("серия — недели подряд с тремя и больше днями, считая от прошлой", () => {
    const o = orbitFromHistory(
      hist([
        "2026-10-12", "2026-10-13", "2026-10-14", // неделя 12.10 — замкнута
        "2026-10-19", "2026-10-21", "2026-10-23", // 19.10 — замкнута
        "2026-10-26", "2026-10-27", "2026-10-30", // 26.10 — замкнута
        "2026-11-02", "2026-11-03", // текущая — пока 2 дня
      ]),
      "2026-11-02",
    );
    expect(o).toMatchObject({ streak: 3, longest: 3, days: ["2026-11-02", "2026-11-03"], closed: false, goalSet: false, shields: 0 });
  });

  it("разрыв в истории обрывает серию, рекорд остаётся", () => {
    const o = orbitFromHistory(
      hist(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-26", "2026-10-27", "2026-10-28"]),
      "2026-11-02",
    );
    expect(o.streak).toBe(1);
    expect(o.longest).toBe(2);
  });

  it("в текущей неделе уже три дня — орбита сразу замкнута", () => {
    const o = orbitFromHistory(hist(["2026-11-02", "2026-11-03", "2026-11-04"]), "2026-11-02");
    expect(o).toMatchObject({ closed: true, streak: 1 });
  });
});

describe("тренировка, синхронизация и цель целиком", () => {
  const session = (over: Partial<SessionInput> = {}): SessionInput => ({
    id: "session-0001",
    kind: "flashcards",
    collectionIds: ["a"],
    cards: 10,
    durationSec: 120,
    timezone: "Europe/Oslo",
    ...over,
  });
  const info = { cardsInSession: 20, totalCards: 20, collectionsCount: 1 };
  const NOON_WED = new Date("2026-11-04T12:00:00Z");
  // Достижения, которые открывает любая первая тренировка с таким набором
  const STARTER = [AchievementType.FIRST_COLLECTION, AchievementType.FIRST_STUDY, AchievementType.CARDS_10, AchievementType.FLASHCARDS_1];

  it("первая тренировка нового пользователя: орбита создаётся, опыт = карточки + бонус дня + достижения", () => {
    const { patch, result } = applySession({}, session(), info, NOON_WED);
    expect(patch.orbit).toMatchObject({ week: "2026-11-02", days: ["2026-11-04"], goalSet: false });
    expect(result.newAchievements.sort()).toEqual([...STARTER].sort());
    expect(patch.xp).toBe(10 + 5 + 4 * 25);
    expect(result.progression.xp).toMatchObject({ gained: 115, level: 2, levelUp: true });
    expect(result.progression.events).toContain("dayCounted");
  });

  it("старый пользователь: опыт за прошлое без празднования уровня, медаль огоньков", () => {
    const state = {
      longestStreak: 12,
      studyHistory: [{ date: "2026-10-20", sessions: 3, cardsStudied: 300, timeSpent: 600 }],
      achievements: STARTER,
    };
    const { patch, result } = applySession(state, session(), info, NOON_WED);
    expect(patch.xp).toBe(300 + 10 + 5);
    expect(patch.legacyFlames).toBe(12);
    expect(result.progression.xp.levelUp).toBe(false); // 300 опыта за прошлое — не «новый уровень»
  });

  it("третий день недели замыкает орбиту: +50 опыта и событие", () => {
    const state = { orbit: orbit({ days: [day(2), day(3)] }), xp: 0, achievements: STARTER };
    const { patch, result } = applySession(state, session(), info, NOON_WED);
    expect(patch.orbit.closed).toBe(true);
    expect(result.progression.events).toContain("orbitClosed");
    expect(patch.xp).toBe(10 + 5 + 50);
    expect(patch.weekXp).toEqual({ week: "2026-11-02", amount: 65 });
  });

  it("неделя начинается в понедельник по часам пользователя", () => {
    const at = new Date("2026-11-08T23:30:00Z"); // Осло — уже понедельник 00:30, Лос-Анджелес — воскресенье 15:30
    const state = { orbit: orbit({ closed: true, streak: 1, days: [day(2), day(3), day(4)] }), xp: 0, achievements: STARTER };
    expect(applySession(state, session(), info, at).patch.orbit).toMatchObject({ week: "2026-11-09", days: ["2026-11-09"] });
    const la = applySession(state, session({ timezone: "America/Los_Angeles" }), info, at).patch.orbit;
    expect(la).toMatchObject({ week: "2026-11-02", days: [day(2), day(3), day(4), "2026-11-08"] });
  });

  it("новый уровень отмечается", () => {
    const state = { orbit: orbit(), xp: 95, achievements: STARTER };
    expect(applySession(state, session(), info, NOON_WED).result.progression.xp).toMatchObject({ level: 2, levelUp: true });
  });

  it("синхронизация в новой неделе подводит итоги; без перемен — писать нечего", () => {
    const state = { orbit: orbit({ streak: 2, shields: 1, days: [day(2)] }), xp: 50 };
    const monday = "2026-11-09";
    const r = syncProgress(state, monday);
    expect(r.patch?.orbit).toMatchObject({ week: monday, streak: 2, shields: 0 });
    expect(r.result.events).toEqual(["shieldUsed"]);
    expect(syncProgress({ ...state, orbit: r.patch!.orbit }, monday).patch).toBeNull();
  });

  it("синхронизация мигрирует старый профиль один раз", () => {
    const state = { studyHistory: [{ date: "2026-10-28", sessions: 1, cardsStudied: 40 }], longestStreak: 2 };
    const r = syncProgress(state, "2026-11-04");
    expect(r.patch).toMatchObject({ xp: 40, orbit: { goalSet: false } });
    expect(r.patch?.legacyFlames).toBeUndefined(); // рекорд меньше 3 дней — без медали
  });

  it("можно ли будет починить эту неделю — для подсказки в шапке", () => {
    expect(syncProgress({ orbit: orbit({ streak: 2 }) }, day(5)).result.orbit.repairReady).toBe(true);
    expect(syncProgress({ orbit: orbit({ streak: 0 }) }, day(5)).result.orbit.repairReady).toBe(false);
    expect(syncProgress({ orbit: orbit({ streak: 2, lastRepairDay: "2026-10-21" }) }, day(5)).result.orbit.repairReady).toBe(false);
  });

  it("выбор цели, которая уже выполнена, замыкает орбиту с бонусом", () => {
    const state = { orbit: orbit({ goalSet: false, days: [day(2), day(3), day(4)] }), xp: 10 };
    const r = applyGoal(state, 3, "2026-11-04");
    expect(r.patch.orbit.closed).toBe(true);
    expect(r.patch.xp).toBe(60);
    expect(r.result.events).toContain("orbitClosed");
  });
});
