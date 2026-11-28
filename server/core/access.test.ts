import { describe, expect, it } from "vitest";
import { canShare, canStudy, standing, supportLimit, verifyDaysLeft, VERIFY_RULE_FROM, type AccountFacts } from "./access";

const now = new Date("2026-12-10T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();
const facts = (over: Partial<AccountFacts> = {}): AccountFacts => ({
  provider: "password",
  emailVerified: false,
  createdAt: daysAgo(2),
  ...over,
});

describe("standing", () => {
  it("проба — анонимный вход", () => {
    expect(standing(facts({ provider: "anonymous" }), now)).toBe("trial");
  });
  it("подтверждённая почта и Google — полные права", () => {
    expect(standing(facts({ emailVerified: true }), now)).toBe("verified");
    expect(standing(facts({ provider: "google.com" }), now)).toBe("verified");
  });
  it("неделя на подтверждение, потом стоп", () => {
    expect(standing(facts({ createdAt: daysAgo(6.9) }), now)).toBe("pending");
    expect(standing(facts({ createdAt: daysAgo(7) }), now)).toBe("locked");
  });
  it("аккаунты до правила не трогаем никогда", () => {
    const before = new Date(Date.parse(VERIFY_RULE_FROM) - 1000).toISOString();
    expect(standing(facts({ createdAt: before }), new Date("2027-06-01T00:00:00Z"))).toBe("legacy");
    expect(standing(facts({ createdAt: null }), now)).toBe("legacy");
  });
});

describe("права", () => {
  it("делиться — только подтверждённым и старым", () => {
    expect(canShare("verified")).toBe(true);
    expect(canShare("legacy")).toBe(true);
    expect(canShare("trial")).toBe(false);
    expect(canShare("pending")).toBe(false);
    expect(canShare("locked")).toBe(false);
  });
  it("поддержка: 10 в день с полными правами, 3 — остальным", () => {
    expect(supportLimit("verified")).toBe(10);
    expect(supportLimit("legacy")).toBe(10);
    expect(supportLimit("trial")).toBe(3);
    expect(supportLimit("locked")).toBe(3);
  });
  it("тренировки не принимаются только на стопе", () => {
    expect(canStudy("locked")).toBe(false);
    expect(canStudy("pending")).toBe(true);
    expect(canStudy("trial")).toBe(true);
  });
});

describe("verifyDaysLeft", () => {
  it("считает оставшиеся дни с округлением вверх", () => {
    expect(verifyDaysLeft(facts({ createdAt: daysAgo(0) }), now)).toBe(7);
    expect(verifyDaysLeft(facts({ createdAt: daysAgo(6.5) }), now)).toBe(1);
    expect(verifyDaysLeft(facts({ createdAt: daysAgo(8) }), now)).toBe(0);
  });
});
