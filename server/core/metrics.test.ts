import { describe, expect, it } from "vitest";
import { excludedReason, metricUser, retentionMetrics, returnedIn, signedUpWithin, type MetricUser } from "./metrics";

// Четверг 26 ноября 2026; неделя — с понедельника 23-го
const NOW = new Date("2026-11-26T12:00:00Z");
const account = (createdAt: string | null, extra: { disabled?: boolean; claims?: unknown } = {}) => ({
  createdAt,
  disabled: extra.disabled ?? false,
  claims: extra.claims ?? {},
});

// Человек, зарегистрированный signupDay, занимался в дни days (смещения от регистрации)
const user = (signupDay: string, days: number[] = [], extra: Partial<MetricUser> = {}): MetricUser => ({
  signupDay,
  today: "2026-11-26",
  courses: 1,
  sets: 1,
  cards: 10,
  studyDays: days.map((n) => {
    const [y, m, d] = signupDay.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
  }),
  firstOrbit: false,
  ...extra,
});

describe("кого считаем", () => {
  it("команда и отключённые аккаунты — не в счёте", () => {
    expect(excludedReason(account("2026-11-01T00:00:00Z", { claims: { staff: true } }))).toBe("team");
    expect(excludedReason(account("2026-11-01T00:00:00Z", { claims: { admin: true } }))).toBe("team");
    expect(excludedReason(account("2026-11-01T00:00:00Z", { disabled: true }))).toBe("disabled");
    expect(excludedReason(account("2026-11-01T00:00:00Z"))).toBeNull();
  });
  it("окно регистраций — с запасом в неделю, без даты — мимо", () => {
    expect(signedUpWithin("2026-09-01T00:00:00Z", NOW, 12)).toBe(true); // 12 недель + запас
    expect(signedUpWithin("2026-08-01T00:00:00Z", NOW, 12)).toBe(false);
    expect(signedUpWithin(null, NOW)).toBe(false);
  });
});

describe("человек для метрик", () => {
  it("день регистрации — по часовому поясу профиля", () => {
    // 23:30 UTC 22 ноября — в Осло уже 23-е, понедельник новой недели
    const u = metricUser(account("2026-11-22T23:30:00Z"), { timezone: "Europe/Oslo" }, [], NOW)!;
    expect(u.signupDay).toBe("2026-11-23");
    expect(metricUser(account("2026-11-22T23:30:00Z"), null, [], NOW)!.signupDay).toBe("2026-11-22");
  });
  it("без профиля — ноль во всём, без даты регистрации — пропускаем", () => {
    expect(metricUser(account("2026-11-20T10:00:00Z"), null, [], NOW)).toMatchObject({
      courses: 0,
      sets: 0,
      cards: 0,
      studyDays: [],
      firstOrbit: false,
    });
    expect(metricUser(account(null), {}, [], NOW)).toBeNull();
  });
  it("наборы, карточки и дни занятий; кривые записи истории отбрасываем", () => {
    const u = metricUser(
      account("2026-11-01T10:00:00Z"),
      {
        courses: [{ id: "nb" }, { id: "en" }],
        studyHistory: [
          { date: "2026-11-03", sessions: 1 },
          { date: "2026-11-02", sessions: 0 }, // закрепление — тоже занятие
          { date: "2026-11-03", sessions: 2 },
          { date: "вчера", sessions: 1 },
          null,
        ],
      },
      [3, 4],
      NOW,
    )!;
    expect(u).toMatchObject({ courses: 2, sets: 2, cards: 7, studyDays: ["2026-11-02", "2026-11-03"] });
  });
  it("первая орбита — по профилю, а без орбиты — по старой истории: неделя с тремя днями", () => {
    const orbit = (longest: number, closed = false) => ({ orbit: { week: "2026-11-23", longest, closed } });
    expect(metricUser(account("2026-11-01T10:00:00Z"), orbit(1), [], NOW)!.firstOrbit).toBe(true);
    expect(metricUser(account("2026-11-01T10:00:00Z"), orbit(0, true), [], NOW)!.firstOrbit).toBe(true);
    expect(metricUser(account("2026-11-01T10:00:00Z"), orbit(0), [], NOW)!.firstOrbit).toBe(false);
    const history = (dates: string[]) => ({ studyHistory: dates.map((date) => ({ date, sessions: 1 })) });
    // 2–4 ноября — одна неделя (пн–ср)
    expect(metricUser(account("2026-11-01T10:00:00Z"), history(["2026-11-02", "2026-11-03", "2026-11-04"]), [], NOW)!.firstOrbit).toBe(true);
    // 1 ноября — воскресенье прошлой недели: по две и одной
    expect(metricUser(account("2026-11-01T10:00:00Z"), history(["2026-11-01", "2026-11-02", "2026-11-03"]), [], NOW)!.firstOrbit).toBe(false);
  });
});

describe("возвраты", () => {
  it("D1 — на следующий день, D7 — дни 7–13, D30 — дни 30–59", () => {
    expect(returnedIn(user("2026-09-01", [1]), "d1")).toBe(true);
    expect(returnedIn(user("2026-09-01", [0, 2]), "d1")).toBe(false);
    expect(returnedIn(user("2026-09-01", [6]), "d7")).toBe(false);
    expect(returnedIn(user("2026-09-01", [13]), "d7")).toBe(true);
    expect(returnedIn(user("2026-09-01", [29, 60]), "d30")).toBe(false);
    expect(returnedIn(user("2026-09-01", [45]), "d30")).toBe(true);
  });
});

describe("когорты", () => {
  it("12 недель от новой к старой, первая — текущая", () => {
    const m = retentionMetrics([], NOW);
    expect(m.cohorts).toHaveLength(12);
    expect(m.cohorts[0].week).toBe("2026-11-23");
    expect(m.cohorts[11].week).toBe("2026-09-07");
    expect(m.from).toBe("2026-09-07");
  });
  it("долю считаем только у тех, чьё окно уже закончилось", () => {
    const m = retentionMetrics(
      [
        user("2026-11-23", [1]), // день 3: окно D1 прошло, D7 — ещё нет
        user("2026-11-24"), // день 2: D1 прошло, не вернулся
        user("2026-11-25", [1]), // день 1: окно D1 ещё идёт — не в счёте
      ],
      NOW,
    );
    const week = m.cohorts[0];
    expect(week.users).toBe(3);
    expect(week.d1).toEqual({ hit: 1, of: 2 });
    expect(week.d7).toEqual({ hit: 0, of: 0 });
    expect(m.total.users).toBe(3);
  });
  it("старые когорты получают D7 и D30; кто старше окна — не в таблице", () => {
    const m = retentionMetrics(
      [user("2026-09-08", [1, 8, 40], { firstOrbit: true }), user("2026-09-10", [2]), user("2026-08-01", [1])],
      NOW,
    );
    const old = m.cohorts.find((c) => c.week === "2026-09-07")!;
    expect(old).toMatchObject({ users: 2, d1: { hit: 1, of: 2 }, d7: { hit: 1, of: 2 }, d30: { hit: 1, of: 2 }, orbit: { hit: 1, of: 2 } });
    expect(m.total.users).toBe(2);
  });
  it("понедельник восточнее UTC — в текущей неделе, а не в будущей", () => {
    // В UTC ещё воскресенье 29-го, в Токио уже понедельник 30-го
    const now = new Date("2026-11-29T20:00:00Z");
    const m = retentionMetrics([user("2026-11-30", [], { today: "2026-11-30" })], now);
    expect(m.cohorts[0].week).toBe("2026-11-23");
    expect(m.cohorts[0].users).toBe(1);
  });
});

describe("пробный режим", () => {
  it("метка пробы из профиля; сохранил — если появился способ входа", () => {
    const profile = { trialStartedAt: "2026-11-20T10:00:00.000Z" };
    expect(metricUser({ ...account("2026-11-20T10:00:00Z"), providers: 0 }, profile, [], NOW)!.trial).toBe("open");
    expect(metricUser({ ...account("2026-11-20T10:00:00Z"), providers: 1 }, profile, [], NOW)!.trial).toBe("saved");
    expect(metricUser({ ...account("2026-11-20T10:00:00Z"), providers: 1 }, {}, [], NOW)!.trial).toBeUndefined();
  });
  it("сводка: сколько начали без аккаунта и сколько сохранили", () => {
    const m = retentionMetrics(
      [user("2026-11-20", [], { trial: "open" }), user("2026-11-20", [0], { trial: "saved" }), user("2026-11-20")],
      NOW,
    );
    expect(m.trial).toEqual({ started: 2, saved: 1 });
  });
});

describe("воронка новичка", () => {
  it("строгая: шаг засчитан, только если пройдены все до него", () => {
    const m = retentionMetrics(
      [
        user("2026-11-02", [0, 9]), // весь путь, вернулся на второй неделе
        user("2026-11-02", [0], { cards: 3 }), // тренировался на трёх словах — стоп на «5 слов»
        user("2026-11-02", [], { sets: 0, cards: 0 }), // выбрал язык, набора нет
        user("2026-11-03", [], { courses: 0, sets: 0, cards: 0 }), // только аккаунт
        user("2026-11-20", [0]), // вторая неделя ещё не прошла
      ],
      NOW,
    );
    expect(Object.fromEntries(m.funnel.map((s) => [s.id, [s.reached, s.of]]))).toEqual({
      account: [5, 5],
      course: [4, 5],
      set: [3, 5],
      words: [2, 5],
      session: [2, 5],
      week2: [1, 4],
    });
  });
});
