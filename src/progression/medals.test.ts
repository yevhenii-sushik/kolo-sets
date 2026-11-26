import { describe, expect, it } from "vitest";
import { medalCount } from "./medals";
import { ALL_ACHIEVEMENTS } from "../utils/achievements";
import { COLLECTIONS } from "../../server/core/items";
import { BETA_MEDAL } from "../../server/core/loot";

const N = ALL_ACHIEVEMENTS.length;
const C = COLLECTIONS.length;

describe("medalCount", () => {
  it("новичок: ничего не открыто, всего — достижения и медали коллекций", () => {
    expect(medalCount({ achievements: [], medals: [], legacyFlames: null })).toEqual({ unlocked: 0, total: N + C });
  });

  it("считает достижения, медали коллекций, бета-медаль и огоньки вместе", () => {
    const res = medalCount({
      achievements: [ALL_ACHIEVEMENTS[0].id, ALL_ACHIEVEMENTS[1].id],
      medals: [COLLECTIONS[0].medal, BETA_MEDAL],
      legacyFlames: 12,
    });
    expect(res).toEqual({ unlocked: 2 + 1 + 1 + 1, total: N + C + 2 });
  });

  it("неизвестные id не считаются: открытых не больше, чем всего", () => {
    const res = medalCount({ achievements: ["gone_achievement"], medals: ["future_medal"], legacyFlames: 0 });
    expect(res).toEqual({ unlocked: 0, total: N + C });
  });

  it("всё собрано — открыто столько же, сколько всего", () => {
    const res = medalCount({
      achievements: ALL_ACHIEVEMENTS.map((a) => a.id),
      medals: [...COLLECTIONS.map((c) => c.medal), BETA_MEDAL],
      legacyFlames: 30,
    });
    expect(res.unlocked).toBe(res.total);
  });
});
