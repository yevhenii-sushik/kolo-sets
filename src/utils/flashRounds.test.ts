import { describe, expect, it } from "vitest";
import { hasRounds, roundAt } from "./flashRounds";

describe("roundAt", () => {
  it("маленький набор — целиком", () => {
    expect(roundAt(12, 0)).toEqual({ from: 0, to: 12 });
    expect(roundAt(24, 0)).toEqual({ from: 0, to: 24 }); // хвост из 4 не отдельный круг
    expect(hasRounds(24)).toBe(false);
  });

  it("большой — по 20 по порядку, короткий хвост присоединяется", () => {
    expect(roundAt(300, 0)).toEqual({ from: 0, to: 20 });
    expect(roundAt(300, 40)).toEqual({ from: 40, to: 60 });
    expect(roundAt(63, 40)).toEqual({ from: 40, to: 63 });
    expect(roundAt(70, 40)).toEqual({ from: 40, to: 60 });
    expect(hasRounds(25)).toBe(true);
  });

  it("позиция за концом набора (слова удалили) — с начала", () => {
    expect(roundAt(30, 40)).toEqual({ from: 0, to: 20 });
    expect(roundAt(30, -3)).toEqual({ from: 0, to: 20 });
  });
});
