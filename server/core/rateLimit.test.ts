import { describe, expect, it } from "vitest";
import { takeDaily } from "./rateLimit";

const now = new Date("2026-12-01T15:00:00Z");

describe("takeDaily", () => {
  it("первый раз за день — счётчик 1", () => {
    expect(takeDaily(undefined, 3, now)).toEqual({ day: "2026-12-01", count: 1 });
  });
  it("до лимита можно, на лимите — нет", () => {
    expect(takeDaily({ day: "2026-12-01", count: 2 }, 3, now)).toEqual({ day: "2026-12-01", count: 3 });
    expect(takeDaily({ day: "2026-12-01", count: 3 }, 3, now)).toBeNull();
  });
  it("новые сутки — счёт заново; кривая запись — тоже", () => {
    expect(takeDaily({ day: "2026-11-30", count: 9 }, 3, now)).toEqual({ day: "2026-12-01", count: 1 });
    expect(takeDaily({ day: "2026-12-01", count: "x" }, 3, now)).toEqual({ day: "2026-12-01", count: 1 });
  });
});
