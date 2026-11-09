import { describe, expect, it } from "vitest";
import { randomInt } from "node:crypto";
import { AchievementType } from "../../src/types";
import { CAPSULE_ITEMS, collectionItems, ITEMS } from "./items";
import {
  BETA_CUTOFF,
  grantBeta,
  capsulesEarned,
  craftItem,
  equipItem,
  satelliteSlots,
  satellitesOf,
  setSatellites,
  ODDS,
  openCapsule,
  PITY_AT,
  rollRarity,
  setShowcase,
  starterCapsules,
  type LootState,
} from "./loot";
import { buyShield, syncProgress } from "./progression";
import { applyCollectionUnlocks, applySession } from "./session";
import type { OrbitState } from "./orbit";

const NOW = new Date("2026-11-04T12:00:00Z");
// Заданная последовательность «случайных» чисел: каждое берётся по модулю n
const seq = (...xs: number[]) => {
  let i = 0;
  return (n: number) => xs[i++ % xs.length] % n;
};
const own = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, { n: 1 }]));

describe("каталог", () => {
  it("36 предметов в капсулах, у каждой коллекции все редкости", () => {
    expect(CAPSULE_ITEMS).toHaveLength(36);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const c of ["planets", "orbits", "sky", "voices"] as const) {
      expect(new Set(collectionItems(c).map((i) => i.rarity))).toEqual(new Set(["common", "rare", "epic", "legendary"]));
    }
  });
});

describe("шансы и гарантия", () => {
  it("редкость по шансам из таблицы", () => {
    expect(rollRarity(0, () => 0)).toBe("legendary");
    expect(rollRarity(0, () => 1)).toBe("legendary");
    expect(rollRarity(0, () => 2)).toBe("epic");
    expect(rollRarity(0, () => 10)).toBe("epic");
    expect(rollRarity(0, () => 11)).toBe("rare");
    expect(rollRarity(0, () => 37)).toBe("rare");
    expect(rollRarity(0, () => 38)).toBe("common");
    expect(rollRarity(0, () => 99)).toBe("common");
    expect(Object.values(ODDS).reduce((a, b) => a + b)).toBe(100);
  });

  it("на большом числе открытий доли близки к шансам, без эпической — не больше 9 подряд", () => {
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    let state: LootState = { capsules: 100_000 };
    let dry = 0;
    let maxDry = 0;
    for (let i = 0; i < 100_000; i++) {
      const r = openCapsule(state, randomInt, NOW);
      if (!r.ok) throw new Error(r.reason);
      counts[r.result.rarity]++;
      dry = r.result.rarity === "epic" || r.result.rarity === "legendary" ? 0 : dry + 1;
      maxDry = Math.max(maxDry, dry);
      state = r.patch;
    }
    expect(maxDry).toBeLessThanOrEqual(PITY_AT - 1);
    // Гарантия поднимает долю эпических: 9 подряд без эпической случаются в ~35 % циклов.
    // Ожидаемые доли с гарантией: обычные 58,5 %, редкие 25,5 %, эпические 14,1 %, легендарные 1,9 %
    const pct = (n: number) => n / 1000;
    expect(pct(counts.common)).toBeCloseTo(58.5, -0.3);
    expect(pct(counts.rare)).toBeCloseTo(25.5, -0.3);
    expect(pct(counts.epic)).toBeCloseTo(14.1, -0.3);
    expect(Math.abs(pct(counts.legendary) - 1.9)).toBeLessThan(0.4);
  });

  it("десятая подряд без эпической — эпическая", () => {
    expect(rollRarity(PITY_AT - 1, () => 99)).toBe("epic");
    const r = openCapsule({ capsules: 1, pity: 9 }, (n) => n - 1, NOW); // без гарантии это была бы обычная
    expect(r.ok && r.result.rarity).toBe("epic");
    expect(r.ok && r.patch.pity).toBe(0);
  });
});

describe("капсула", () => {
  it("без капсул открыть нельзя", () => {
    expect(openCapsule({ capsules: 0 }, randomInt, NOW)).toEqual({ ok: false, reason: "no-capsules" });
  });

  it("новый предмет — в инвентарь, счётчик гарантии растёт", () => {
    const r = openCapsule({ capsules: 2, pity: 3 }, seq(50, 0), NOW); // обычная, первая в списке
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.result).toMatchObject({ item: "sat_moon", rarity: "common", duplicate: false, dust: 0 });
    expect(r.patch).toMatchObject({ capsules: 1, pity: 4, dust: 0 });
    expect(r.patch.inventory.sat_moon.n).toBe(1);
  });

  it("повтор превращается в пыль по редкости", () => {
    const r = openCapsule({ capsules: 1, dust: 10, inventory: own("sat_neptune") }, seq(20, 0), NOW); // редкая, первая — нептун
    expect(r.ok && r.result).toMatchObject({ item: "sat_neptune", duplicate: true, dust: 15 });
    expect(r.ok && r.patch.dust).toBe(25);
    expect(r.ok && r.patch.inventory.sat_neptune.n).toBe(2);
  });

  it("последний предмет коллекции — медаль и титул", () => {
    const planets = collectionItems("planets").map((i) => i.id).filter((id) => id !== "sat_supernova");
    const r = openCapsule({ capsules: 1, inventory: own(...planets) }, seq(0, 0), NOW); // легендарная, первая — сверхновая
    expect(r.ok && r.result.completed).toEqual({ collection: "planets", medal: "collection_planets", title: "title_system_master" });
    expect(r.ok && r.patch.medals).toEqual(["collection_planets"]);
    expect(r.ok && r.patch.inventory.title_system_master).toBeTruthy();
  });

  it("титулы за сбор в капсулах не выпадают", () => {
    expect(CAPSULE_ITEMS.some((i) => i.id.startsWith("title_system"))).toBe(false);
  });
});

describe("пыль", () => {
  it("недостающий обычный или редкий предмет", () => {
    expect(craftItem({ dust: 39 }, "sat_moon", NOW)).toEqual({ ok: false, reason: "not-enough-dust" });
    const r = craftItem({ dust: 50 }, "sat_moon", NOW);
    expect(r.ok && r.patch.dust).toBe(10);
    expect(craftItem({ dust: 500, inventory: own("sat_moon") }, "sat_moon", NOW)).toEqual({ ok: false, reason: "owned" });
    expect(craftItem({ dust: 120 }, "ring_ocean", NOW).ok).toBe(true);
  });

  it("эпические, легендарные и награды за пыль не создаются", () => {
    expect(craftItem({ dust: 9999 }, "sat_saturn", NOW)).toEqual({ ok: false, reason: "not-craftable" });
    expect(craftItem({ dust: 9999 }, "sat_supernova", NOW)).toEqual({ ok: false, reason: "not-craftable" });
    expect(craftItem({ dust: 9999 }, "title_stargazer", NOW)).toEqual({ ok: false, reason: "not-craftable" });
    expect(craftItem({ dust: 9999 }, "nope", NOW)).toEqual({ ok: false, reason: "unknown-item" });
  });

  it("щит за 120, если щитов меньше двух", () => {
    const orbit: OrbitState = { goal: 3, goalSet: true, week: "2026-11-02", days: [], closed: false, streak: 5, longest: 5, shields: 1 };
    const r = buyShield({ orbit, dust: 130, capsules: 0 }, "2026-11-04");
    expect(r.ok && r.patch).toMatchObject({ dust: 10, orbit: { shields: 2 } });
    expect(buyShield({ orbit: { ...orbit, shields: 2 }, dust: 999, capsules: 0 }, "2026-11-04")).toEqual({ ok: false, reason: "shields-full" });
    expect(buyShield({ orbit, dust: 119, capsules: 0 }, "2026-11-04")).toEqual({ ok: false, reason: "not-enough-dust" });
  });
});

describe("надеть и витрина", () => {
  it("только свой предмет подходящего вида; null — снять", () => {
    const state: LootState = { inventory: own("sat_moon", "ring_mint") };
    expect(equipItem(state, "satellite", "sat_moon")).toEqual({ ok: true, equipped: { satellites: ["sat_moon"], showcase: [] } });
    expect(equipItem(state, "ring", "sat_moon")).toEqual({ ok: false });
    expect(equipItem(state, "satellite", "sat_mars")).toEqual({ ok: false });
    const off = equipItem({ ...state, equipped: { satellite: "sat_moon", showcase: [] } }, "satellite", null);
    expect(off.ok && off.equipped).toEqual({ satellites: [], showcase: [] });
    const ring = equipItem({ ...state, equipped: { satellite: "sat_moon", showcase: [] } }, "ring", "ring_mint");
    expect(ring.ok && ring.equipped).toEqual({ ring: "ring_mint", showcase: [] });
  });

  it("места для спутников: одно сразу, второе с 5 уровня, третье с 10", () => {
    expect([1, 4, 5, 9, 10, 40].map(satelliteSlots)).toEqual([1, 1, 2, 2, 3, 3]);
  });

  it("спутники на орбите: свои, без повторов, не больше открытых мест; старое поле читается", () => {
    const state: LootState & { level?: number } = { inventory: own("sat_moon", "sat_mars", "sat_venus", "ring_mint"), level: 5 };
    expect(setSatellites(state, ["sat_moon", "sat_mars"])).toEqual({ ok: true, equipped: { satellites: ["sat_moon", "sat_mars"], showcase: [] } });
    expect(setSatellites(state, ["sat_moon", "sat_moon"])).toEqual({ ok: true, equipped: { satellites: ["sat_moon"], showcase: [] } });
    expect(setSatellites(state, ["sat_moon", "sat_mars", "sat_venus"])).toEqual({ ok: false, reason: "no-room" });
    expect(setSatellites({ ...state, level: 10 }, ["sat_moon", "sat_mars", "sat_venus"]).ok).toBe(true);
    expect(setSatellites({ ...state, level: undefined }, ["sat_moon", "sat_mars"])).toEqual({ ok: false, reason: "no-room" });
    expect(setSatellites(state, ["sat_jupiter"])).toEqual({ ok: false, reason: "not-owned" });
    expect(setSatellites(state, ["ring_mint"])).toEqual({ ok: false, reason: "not-owned" });
    expect(setSatellites(state, "sat_moon")).toEqual({ ok: false, reason: "bad-request" });
    const legacy = setSatellites({ ...state, equipped: { satellite: "sat_moon", ring: "ring_mint", showcase: ["x"] } }, []);
    expect(legacy.ok && legacy.equipped).toEqual({ satellites: [], ring: "ring_mint", showcase: ["x"] });
    expect(satellitesOf({ satellite: "sat_moon", showcase: [] })).toEqual(["sat_moon"]);
    expect(satellitesOf({ satellites: ["sat_mars"], satellite: "sat_moon", showcase: [] })).toEqual(["sat_mars"]);
    expect(satellitesOf(undefined)).toEqual([]);
  });

  it("витрина — до трёх своих предметов, медалей и достижений", () => {
    const state = { inventory: own("sat_moon"), medals: ["collection_sky"], achievements: ["first_study"] };
    expect(setShowcase(state, ["sat_moon", "collection_sky", "first_study"]).ok).toBe(true);
    expect(setShowcase(state, ["sat_moon", "sat_moon"])).toEqual({ ok: true, equipped: { showcase: ["sat_moon"] } });
    expect(setShowcase(state, ["sat_mars"]).ok).toBe(false);
    expect(setShowcase(state, ["a", "b", "c", "d"]).ok).toBe(false);
    expect(setShowcase(state, "sat_moon").ok).toBe(false);
    expect(setShowcase(state, ["legacy_flames"]).ok).toBe(false);
    expect(setShowcase({ ...state, legacyFlames: 12 }, ["legacy_flames"]).ok).toBe(true);
  });
});

describe("откуда капсулы", () => {
  const base = { levelBefore: 3, levelAfter: 3, orbitClosed: false, longestBefore: 0, longestAfter: 0, newAchievements: [] };

  it("уровень, орбита, вехи серии 4/12/26, крупные достижения", () => {
    expect(capsulesEarned(base)).toBe(0);
    expect(capsulesEarned({ ...base, levelAfter: 5 })).toBe(2);
    expect(capsulesEarned({ ...base, orbitClosed: true, longestBefore: 3, longestAfter: 4 })).toBe(2);
    expect(capsulesEarned({ ...base, longestBefore: 4, longestAfter: 5 })).toBe(0); // веха уже пройдена
    expect(capsulesEarned({ ...base, newAchievements: [AchievementType.CARDS_500, AchievementType.CARDS_100] })).toBe(1);
  });

  it("стартовые: одна плюс по одной за уровни, не больше пяти", () => {
    expect(starterCapsules(1)).toBe(1);
    expect(starterCapsules(3)).toBe(3);
    expect(starterCapsules(20)).toBe(5);
  });

  const info = { cardsInSession: 20, totalCards: 20, collectionsCount: 1 };
  const session = { id: "session-0001", kind: "flashcards" as const, collectionIds: ["a"], cards: 10, durationSec: 120, timezone: "Europe/Oslo" };

  it("первая тренировка: стартовая капсула и капсула за 2-й уровень", () => {
    const { patch, result } = applySession({}, session, info, NOW);
    expect(result.progression.xp.level).toBe(2);
    expect(patch.capsules).toBe(2);
    expect(result.progression.capsules).toEqual({ count: 2, gained: 2 });
  });

  it("синхронизация старого профиля: стартовые по уровню, без капсул за опыт прошлого", () => {
    const r = syncProgress({ studyHistory: [{ date: "2026-10-20", sessions: 3, cardsStudied: 300 }] }, "2026-11-04");
    expect(r.result.xp.level).toBe(3);
    expect(r.patch?.capsules).toBe(3);
    expect(syncProgress({ ...r.patch! }, "2026-11-04").patch).toBeNull();
  });

  it("500 слов в наборах: опыт и капсула", () => {
    const orbit: OrbitState = { goal: 3, goalSet: true, week: "2026-11-02", days: [], closed: false, streak: 0, longest: 0, shields: 0 };
    const all = Object.values(AchievementType).filter((a) => a !== AchievementType.CARDS_500 && a !== AchievementType.CARDS_1000);
    const r = applyCollectionUnlocks({ orbit, xp: 0, capsules: 0, achievements: all }, { cardsInSession: 0, totalCards: 600, collectionsCount: 9 }, "2026-11-04");
    expect(r?.result.newAchievements).toEqual([AchievementType.CARDS_500]);
    expect(r?.patch).toMatchObject({ xp: 100, capsules: 1 + 1 }); // капсула за достижение и за 2-й уровень
    expect(applyCollectionUnlocks({ achievements: Object.values(AchievementType) }, info, "2026-11-04")).toBeNull();
  });
});

describe("бета-тестеры", () => {
  it("до конца 2026 — медаль, титул и кольцо; один раз", () => {
    const g = grantBeta({ inventory: own("sat_moon") }, Date.parse("2026-12-31T23:00:00Z"), NOW);
    expect(g?.medals).toEqual(["beta_tester"]);
    expect(Object.keys(g!.inventory).sort()).toEqual(["ring_beta", "sat_moon", "title_beta_tester"]);
    expect(grantBeta({ ...g! }, Date.parse("2026-11-01"), NOW)).toBeNull();
  });

  it("после — ничего", () => {
    expect(grantBeta({}, BETA_CUTOFF, NOW)).toBeNull();
    expect(grantBeta({}, Date.parse("2027-02-01"), NOW)).toBeNull();
  });

  it("бета-награды не выпадают из капсул и не создаются за пыль", () => {
    expect(CAPSULE_ITEMS.some((i) => i.exclusive)).toBe(false);
    expect(craftItem({ dust: 9999 }, "ring_beta", NOW)).toEqual({ ok: false, reason: "not-craftable" });
  });

  it("надеть можно, если выдано", () => {
    expect(equipItem({ inventory: own("ring_beta") }, "ring", "ring_beta").ok).toBe(true);
    expect(equipItem({}, "title", "title_beta_tester").ok).toBe(false);
  });
});
