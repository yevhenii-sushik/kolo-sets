import { describe, expect, it } from "vitest";
import { isTrialAccount, isUnverifiedAccount, lastActive, staleAccounts, staleTrials, TRIAL_IDLE_DAYS, type TrialCandidate } from "./trial";
import { VERIFY_RULE_FROM } from "./access";

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

describe("неподтверждённая почта", () => {
  const afterRule = new Date(Date.parse(VERIFY_RULE_FROM) + 86_400_000).toISOString();
  const beforeRule = new Date(Date.parse(VERIFY_RULE_FROM) - 86_400_000).toISOString();
  const later = new Date(Date.parse(VERIFY_RULE_FROM) + 60 * 86_400_000);
  const pwd = (uid: string, over: Partial<TrialCandidate> = {}): TrialCandidate => ({
    uid,
    providers: 1,
    providerIds: ["password"],
    emailVerified: false,
    email: `${uid}@x.y`,
    createdAt: afterRule,
    lastSignInAt: afterRule,
    lastRefreshAt: null,
    ...over,
  });

  it("новый аккаунт на неподтверждённую почту — да; подтверждённый, с Google или старый — нет", () => {
    expect(isUnverifiedAccount(pwd("a"))).toBe(true);
    expect(isUnverifiedAccount(pwd("a", { emailVerified: true }))).toBe(false);
    expect(isUnverifiedAccount(pwd("a", { providerIds: ["password", "google.com"], providers: 2 }))).toBe(false);
    expect(isUnverifiedAccount(pwd("a", { createdAt: beforeRule, lastSignInAt: beforeRule }))).toBe(false);
  });

  it("удаляется через 30 дней без входа вместе с пробными, с пометкой, кто есть кто", () => {
    const list = [pwd("mail"), trial("t", { createdAt: afterRule, lastSignInAt: afterRule }), pwd("old", { createdAt: beforeRule, lastSignInAt: beforeRule })];
    expect(staleAccounts(list, later).map((x) => `${x.uid}:${x.kind}`).sort()).toEqual(["mail:unverified", "t:trial"]);
    expect(staleTrials(list, later)).toEqual(["t"]);
  });
});
