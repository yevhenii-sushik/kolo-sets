import { describe, expect, it } from "vitest";
import { cheerIndex, daysSinceLastStudy, genericIndex, NudgeInput, pickNudge } from "./nudge";

const TODAY = "2026-11-21"; // суббота
const base: NudgeInput = {
  today: TODAY,
  hour: 12,
  todayStudied: 0,
  dailyGoal: 20,
  dueCount: 0,
  history: [],
  orbit: null,
  genericCount: 8,
};
const day = (date: string, cardsStudied = 15, sessions = 1) => ({ date, cardsStudied, sessions });

describe("daysSinceLastStudy", () => {
  it("null, пока тренировок не было", () => {
    expect(daysSinceLastStudy([], TODAY)).toBeNull();
    expect(daysSinceLastStudy([day("2026-11-19", 0, 0)], TODAY)).toBeNull();
  });

  it("считает дни до последнего дня с тренировкой, порядок истории не важен", () => {
    expect(daysSinceLastStudy([day("2026-11-18"), day("2026-11-10")], TODAY)).toBe(3);
    expect(daysSinceLastStudy([day("2026-11-10"), day(TODAY)], TODAY)).toBe(0);
  });

  it("переходит через границу месяца", () => {
    expect(daysSinceLastStudy([day("2026-10-30")], "2026-11-02")).toBe(3);
  });
});

describe("pickNudge", () => {
  it("после перерыва от двух дней — «давно не виделись» с числом дней", () => {
    expect(pickNudge({ ...base, history: [day("2026-11-18")] })).toEqual({ key: "away", n: 3 });
  });

  it("вчерашняя тренировка — не перерыв", () => {
    expect(pickNudge({ ...base, history: [day("2026-11-20", 5)] }).key).not.toBe("away");
  });

  it("перерыв не вспоминаем, если сегодня уже занимался", () => {
    const n = pickNudge({ ...base, todayStudied: 4, history: [day("2026-11-10"), day(TODAY, 4)] });
    expect(n.key).not.toBe("away");
  });

  it("орбита под угрозой: сегодня решает неделю или нельзя пропускать", () => {
    const orbit = { status: "atRisk" as const, goal: 3, days: ["2026-11-17", "2026-11-18"] };
    expect(pickNudge({ ...base, history: [day("2026-11-20")], orbit }).key).toBe("orbitToday");
    const tight = { status: "atRisk" as const, goal: 5, days: ["2026-11-17", "2026-11-18", "2026-11-19"] };
    expect(pickNudge({ ...base, today: "2026-11-21", history: [day("2026-11-20")], orbit: { ...tight, goal: 5 } }).key).toBe("orbitAtRisk");
  });

  it("до замкнутой орбиты один день — говорим об этом", () => {
    const orbit = { status: "onTrack" as const, goal: 3, days: ["2026-11-17", "2026-11-18"] };
    expect(pickNudge({ ...base, today: "2026-11-19", history: [day("2026-11-18")], orbit }).key).toBe("orbitLastDay");
  });

  it("день уже засчитан в орбиту — про орбиту молчим", () => {
    const orbit = { status: "atRisk" as const, goal: 3, days: ["2026-11-17", TODAY] };
    expect(pickNudge({ ...base, todayStudied: 30, history: [day(TODAY, 30)], orbit }).key).toBe("goalMet");
  });

  it("замкнутая и потерянная неделя не подгоняют", () => {
    for (const status of ["closed", "lost"] as const) {
      const orbit = { status, goal: 3, days: ["2026-11-17"] };
      expect(pickNudge({ ...base, history: [day("2026-11-20", 5)], orbit }).key).toBe("generic");
    }
  });

  it("до цели дня 5 карточек и меньше — дожимаем", () => {
    expect(pickNudge({ ...base, todayStudied: 16, history: [day(TODAY, 16)] })).toEqual({ key: "goalClose", n: 4 });
    expect(pickNudge({ ...base, todayStudied: 10, history: [day(TODAY, 10)] }).key).not.toBe("goalClose");
  });

  it("вчера было от 10 карточек и больше, чем сегодня, — вызов побить", () => {
    expect(pickNudge({ ...base, history: [day("2026-11-20", 24)] })).toEqual({ key: "beatYesterday", n: 24 });
    expect(pickNudge({ ...base, history: [day("2026-11-20", 6)] }).key).toBe("generic");
    expect(pickNudge({ ...base, todayStudied: 30, history: [day("2026-11-20", 24), day(TODAY, 30)] }).key).toBe("goalMet");
  });

  it("поздно вечером без занятий — «пять минут ещё считаются»", () => {
    expect(pickNudge({ ...base, hour: 22, history: [day("2026-11-20", 5)] }).key).toBe("lateNight");
    expect(pickNudge({ ...base, hour: 20, history: [day("2026-11-20", 5)] }).key).toBe("generic");
  });

  it("много слов к повторению — «копится»", () => {
    expect(pickNudge({ ...base, dueCount: 45, history: [day("2026-11-20", 5)] }).key).toBe("pileUp");
  });

  it("фраза дня одна весь день и меняется на следующий", () => {
    const a = pickNudge(base);
    expect(a).toEqual(pickNudge({ ...base, hour: 18 }));
    expect(a.key).toBe("generic");
    expect(genericIndex("2026-11-22", 8)).toBe((genericIndex(TODAY, 8) + 1) % 8);
    expect(genericIndex(TODAY, 0)).toBe(0);
  });
});

describe("cheerIndex", () => {
  it("возглас — на каждой пятёрке, длинные серии делят последний", () => {
    expect([3, 4, 5, 6, 10, 15, 20, 25, 50].map((n) => cheerIndex(n, 5))).toEqual([-1, -1, 0, -1, 1, 2, 3, 4, 4]);
    expect(cheerIndex(5, 0)).toBe(-1);
  });
});
