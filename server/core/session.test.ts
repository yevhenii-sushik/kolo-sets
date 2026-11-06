import { describe, expect, it } from "vitest";
import { AchievementType } from "../../src/types";
import { applySession, checkPlausibility, collectionAchievements, parseSession, type SessionInput } from "./session";
import { addDays, dayKey, hourIn, safeTimeZone } from "./time";

const info = { cardsInSession: 10, totalCards: 20, collectionsCount: 2 };
const session = (over: Partial<SessionInput> = {}): SessionInput => ({
  id: "session-0001",
  kind: "flashcards",
  collectionIds: ["a"],
  cards: 8,
  durationSec: 120,
  timezone: "Europe/Oslo",
  ...over,
});
// 14:00 по Осло 6 ноября (UTC+1)
const NOON = new Date("2026-11-06T13:00:00Z");

describe("время", () => {
  it("ключ дня и час — в часовом поясе пользователя", () => {
    const lateUtc = new Date("2026-11-06T23:30:00Z");
    expect(dayKey(lateUtc, "UTC")).toBe("2026-11-06");
    expect(dayKey(lateUtc, "Europe/Oslo")).toBe("2026-11-07");
    expect(hourIn(lateUtc, "Europe/Oslo")).toBe(0);
    expect(dayKey(lateUtc, "America/New_York")).toBe("2026-11-06");
  });
  it("сдвиг дней через границу месяца и года", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("неизвестный часовой пояс — UTC", () => {
    expect(safeTimeZone("Mars/Base")).toBe("UTC");
    expect(safeTimeZone(undefined)).toBe("UTC");
    expect(safeTimeZone("Europe/Kyiv")).toBe("Europe/Kyiv");
  });
});

describe("серия и история дней", () => {
  it("первая тренировка: серия 1, запись в истории, «Начало пути»", () => {
    const { patch, result } = applySession({}, session(), info, NOON);
    expect(result.streak).toEqual({ current: 1, longest: 1, extendedToday: true });
    expect(patch.studyHistory).toEqual([{ date: "2026-11-06", sessions: 1, cardsStudied: 8, timeSpent: 120 }]);
    expect(patch.stats.flashcardSessions).toBe(1);
    expect(result.newAchievements).toContain(AchievementType.FIRST_STUDY);
  });

  it("вторая тренировка в тот же день не продлевает серию и копит историю", () => {
    const first = applySession({}, session(), info, NOON).patch;
    const { patch, result } = applySession(first, session({ id: "session-0002" }), info, new Date("2026-11-06T18:00:00Z"));
    expect(result.streak.extendedToday).toBe(false);
    expect(patch.currentStreak).toBe(1);
    expect(patch.studyHistory).toEqual([{ date: "2026-11-06", sessions: 2, cardsStudied: 16, timeSpent: 240 }]);
    expect(result.newAchievements).not.toContain(AchievementType.FIRST_STUDY);
  });

  it("на следующий день серия +1, после пропуска — заново", () => {
    const state = { currentStreak: 4, longestStreak: 9, lastStudyDay: "2026-11-05" };
    expect(applySession(state, session(), info, NOON).result.streak).toEqual({ current: 5, longest: 9, extendedToday: true });
    const gap = { ...state, lastStudyDay: "2026-11-03" };
    expect(applySession(gap, session(), info, NOON).result.streak).toEqual({ current: 1, longest: 9, extendedToday: true });
  });

  it("полночь в Осло — уже новый день, хотя по UTC ещё вчера", () => {
    const state = { currentStreak: 2, lastStudyDay: "2026-11-06" };
    const { result } = applySession(state, session(), info, new Date("2026-11-06T23:30:00Z"));
    expect(result.day).toBe("2026-11-07");
    expect(result.streak.current).toBe(3);
  });

  it("старый профиль без lastStudyDay: день берётся из lastStudyDate в часовом поясе", () => {
    // 23:30 UTC 5 ноября = 00:30 6 ноября в Осло — занятие было «сегодня»
    const state = { currentStreak: 3, lastStudyDate: new Date("2026-11-05T23:30:00Z") };
    expect(applySession(state, session(), info, NOON).result.streak).toEqual({ current: 3, longest: 3, extendedToday: false });
  });

  it("перелёт на запад: «последний день» позже сегодняшнего — серию не трогаем", () => {
    const state = { currentStreak: 6, lastStudyDay: "2026-11-07" };
    const { result } = applySession(state, session({ timezone: "America/Los_Angeles" }), info, NOON);
    expect(result.streak).toEqual({ current: 6, longest: 6, extendedToday: false });
  });
});

describe("счётчики и достижения", () => {
  it("тест без ошибок считается идеальным", () => {
    const { patch, result } = applySession({}, session({ kind: "quiz", cards: 10, correct: 10, durationSec: 200 }), info, NOON);
    expect(patch.stats.quizzesTaken).toBe(1);
    expect(patch.stats.perfectQuizzes).toBe(1);
    expect(result.newAchievements).toEqual(expect.arrayContaining([AchievementType.QUIZ_1, AchievementType.PERFECT_QUIZ]));
  });

  it("игра продлевает серию, но не трогает счётчики флэшкарт и тестов", () => {
    const { patch, result } = applySession({}, session({ kind: "speed", cards: 40, durationSec: 60 }), info, NOON);
    expect(result.streak.extendedToday).toBe(true);
    expect(patch.stats.gamesPlayed).toBe(1);
    expect(patch.stats.flashcardSessions).toBe(0);
    expect(patch.stats.quizzesTaken).toBe(0);
    expect(result.newAchievements).not.toContain(AchievementType.FIRST_STUDY);
  });

  it("возвращение после 8 дней, марафон, сова", () => {
    const state = { lastStudyDay: "2026-10-29" };
    const night = new Date("2026-11-06T00:30:00Z"); // 01:30 в Осло
    const { result } = applySession(state, session({ durationSec: 1900 }), info, night);
    expect(result.newAchievements).toEqual(
      expect.arrayContaining([AchievementType.COMEBACK, AchievementType.MARATHON, AchievementType.NIGHT_OWL]),
    );
  });

  it("уже открытые достижения не выдаются повторно", () => {
    const state = { achievements: [AchievementType.FIRST_STUDY] };
    const { patch, result } = applySession(state, session(), info, NOON);
    expect(result.newAchievements).not.toContain(AchievementType.FIRST_STUDY);
    expect(patch.achievements.filter((a) => a === AchievementType.FIRST_STUDY)).toHaveLength(1);
  });

  it("достижения за наборы не открывают «Сову» и прочие достижения тренировки", () => {
    const ids = collectionAchievements({}, { cardsInSession: 0, totalCards: 10, collectionsCount: 3 });
    expect(ids).toEqual(expect.arrayContaining([AchievementType.FIRST_COLLECTION, AchievementType.CARDS_10, AchievementType.COLLECTIONS_3]));
    expect(ids).not.toContain(AchievementType.NIGHT_OWL);
    expect(ids).not.toContain(AchievementType.EARLY_BIRD);
  });
});

describe("правдоподобие", () => {
  it("обычная тренировка проходит", () => {
    expect(checkPlausibility(session(), info)).toBeNull();
  });
  it("слишком быстро, больше карточек, чем в наборах, слишком долго", () => {
    expect(checkPlausibility(session({ cards: 8, durationSec: 3 }), info)).toBe("too-fast");
    expect(checkPlausibility(session({ cards: 30, durationSec: 300 }), info)).toBe("more-cards-than-sets");
    expect(checkPlausibility(session({ durationSec: 5 * 3600 }), info)).toBe("too-long");
    expect(checkPlausibility(session({ kind: "quiz", cards: 8, correct: 9 }), info)).toBe("correct>cards");
  });
  it("в играх слова повторяются, но не быстрее двух ответов в секунду", () => {
    expect(checkPlausibility(session({ kind: "speed", cards: 100, durationSec: 60 }), info)).toBeNull();
    expect(checkPlausibility(session({ kind: "speed", cards: 500, durationSec: 60 }), info)).toBe("too-fast");
  });
});

describe("разбор запроса", () => {
  const good = { id: "abc12345-0000", kind: "review", collectionIds: ["a", "a", "b"], cards: 5, durationSec: 60.4, timezone: "Europe/Oslo" };
  it("принимает корректный запрос и убирает повторы наборов", () => {
    const r = parseSession(good);
    expect(r.ok && r.session.collectionIds).toEqual(["a", "b"]);
    expect(r.ok && r.session.durationSec).toBe(60);
  });
  it("отклоняет мусор", () => {
    expect(parseSession(null).ok).toBe(false);
    expect(parseSession({ ...good, id: "x" }).ok).toBe(false);
    expect(parseSession({ ...good, kind: "cheat" }).ok).toBe(false);
    expect(parseSession({ ...good, cards: -1 }).ok).toBe(false);
    expect(parseSession({ ...good, cards: 1.5 }).ok).toBe(false);
    expect(parseSession({ ...good, collectionIds: [] }).ok).toBe(false);
    expect(parseSession({ ...good, collectionIds: ["../users/x"] }).ok).toBe(false);
    expect(parseSession({ ...good, durationSec: "60" }).ok).toBe(false);
  });
  it("кривой часовой пояс не роняет разбор — UTC", () => {
    const r = parseSession({ ...good, timezone: "Nowhere/Land" });
    expect(r.ok && r.session.timezone).toBe("UTC");
  });
});
