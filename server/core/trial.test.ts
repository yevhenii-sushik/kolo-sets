import { describe, expect, it } from "vitest";
import { isTrialAccount, lastActive, staleTrials, TRIAL_IDLE_DAYS, type TrialCandidate } from "./trial";

const now = new Date("2026-12-31T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

const trial = (uid: string, over: Partial<TrialCandidate> = {}): TrialCandidate => ({
  uid,
  providers: 0,
  email: null,
  createdAt: daysAgo(60),
  lastSignInAt: daysAgo(60),
  lastRefreshAt: null,
  ...over,
});

describe("isTrialAccount", () => {
  it("пробный — без способов входа и без почты", () => {
    expect(isTrialAccount(trial("a"))).toBe(true);
    expect(isTrialAccount(trial("a", { providers: 1 }))).toBe(false);
    expect(isTrialAccount(trial("a", { email: "x@y.z" }))).toBe(false);
  });
});

describe("lastActive", () => {
  it("берёт самое позднее из создания, входа и обновления токена", () => {
    const a = trial("a", { createdAt: daysAgo(60), lastSignInAt: daysAgo(50), lastRefreshAt: daysAgo(5) });
    expect(lastActive(a)).toBe(Date.parse(daysAgo(5)));
  });
});

describe("staleTrials", () => {
  it("удаляет пробные аккаунты, которые не открывали дольше срока, самые давние первыми", () => {
    const list = [
      trial("old", { createdAt: daysAgo(90), lastSignInAt: daysAgo(90) }),
      trial("older", { createdAt: daysAgo(120), lastSignInAt: daysAgo(120) }),
      trial("fresh", { createdAt: daysAgo(10), lastSignInAt: daysAgo(10) }),
    ];
    expect(staleTrials(list, now)).toEqual(["older", "old"]);
  });

  it("открытие приложения продлевает срок", () => {
    expect(staleTrials([trial("a", { lastRefreshAt: daysAgo(TRIAL_IDLE_DAYS - 1) })], now)).toEqual([]);
    expect(staleTrials([trial("a", { lastRefreshAt: daysAgo(TRIAL_IDLE_DAYS + 1) })], now)).toEqual(["a"]);
  });

  it("сохранённые аккаунты не трогает, сколько бы их ни не открывали", () => {
    const list = [trial("google", { providers: 1, email: "g@x.y" }), trial("email", { email: "e@x.y" })];
    expect(staleTrials(list, now)).toEqual([]);
  });

  it("аккаунт без дат не трогает", () => {
    expect(staleTrials([trial("a", { createdAt: null, lastSignInAt: null })], now)).toEqual([]);
  });
});
