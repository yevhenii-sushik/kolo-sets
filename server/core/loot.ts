// Капсулы, звёздная пыль и надетые предметы (docs/specs/02-progression.md → «2b»). Чистые функции:
// случайность передаётся снаружи (на сервере — crypto.randomInt), исходное состояние не меняется.
import { AchievementType } from "../../src/types";
import { COLLECTIONS, CAPSULE_ITEMS, collectionItems, itemById, type ItemKind, type Rarity } from "./items";

// Шансы в процентах — показываются в окне капсулы
export const ODDS: Record<Rarity, number> = { common: 62, rare: 27, epic: 9, legendary: 2 };
export const PITY_AT = 10; // 10-я капсула подряд без эпической или легендарной — эпическая
export const DUPLICATE_DUST: Record<Rarity, number> = { common: 5, rare: 15, epic: 40, legendary: 100 };
export const CRAFT_COST: Partial<Record<Rarity, number>> = { common: 40, rare: 120 }; // эпические и легендарные не создаются
export const SHIELD_COST = 120;
export const SHOWCASE_MAX = 3;
const STARTER_MAX = 5;

// Капсулы за события
const ORBIT_MILESTONES = [4, 12, 26];
const BIG_ACHIEVEMENTS = new Set<AchievementType>([
  AchievementType.CARDS_500,
  AchievementType.CARDS_1000,
  AchievementType.QUIZ_50,
  AchievementType.QUIZ_100,
]);

export type Slot = "satellite" | "ring" | "title" | "background";
export interface Equipped {
  satellite?: string;
  ring?: string;
  title?: string;
  background?: string;
  showcase: string[];
}

export interface LootState {
  capsules?: number;
  pity?: number;
  dust?: number;
  inventory?: Record<string, { n: number; at?: unknown }>;
  medals?: string[];
  equipped?: Equipped;
}

// Первая встреча с капсулами: одна в подарок и по одной за уже набранные уровни (не больше пяти)
export const starterCapsules = (level: number) => Math.min(STARTER_MAX, 1 + Math.max(0, level - 1));

export function capsulesEarned(e: {
  levelBefore: number;
  levelAfter: number;
  orbitClosed: boolean;
  longestBefore: number;
  longestAfter: number;
  newAchievements: readonly AchievementType[];
}): number {
  const milestones = ORBIT_MILESTONES.filter((m) => e.longestBefore < m && e.longestAfter >= m).length;
  const big = e.newAchievements.filter((a) => BIG_ACHIEVEMENTS.has(a)).length;
  return Math.max(0, e.levelAfter - e.levelBefore) + (e.orbitClosed ? 1 : 0) + milestones + big;
}

// rand(n) — целое от 0 до n−1
export function rollRarity(pity: number, rand: (n: number) => number): Rarity {
  if (pity >= PITY_AT - 1) return "epic";
  let r = rand(100);
  for (const rarity of ["legendary", "epic", "rare"] as const) {
    if (r < ODDS[rarity]) return rarity;
    r -= ODDS[rarity];
  }
  return "common";
}

export interface CollectionDone {
  collection: string;
  medal: string;
  title?: string;
}

// Предмет в инвентарь; если коллекция собрана — медаль и титул за неё
function addItem(inventory: NonNullable<LootState["inventory"]>, medals: string[], id: string, now: Date): CollectionDone | null {
  inventory[id] = { n: (inventory[id]?.n ?? 0) + 1, at: inventory[id]?.at ?? now };
  const item = itemById(id)!;
  if (item.reward) return null;
  const c = COLLECTIONS.find((x) => x.id === item.collection)!;
  if (medals.includes(c.medal) || !collectionItems(c.id).every((i) => inventory[i.id])) return null;
  medals.push(c.medal);
  if (c.title && !inventory[c.title]) inventory[c.title] = { n: 1, at: now };
  return { collection: c.id, medal: c.medal, ...(c.title ? { title: c.title } : {}) };
}

export interface LootPatch {
  capsules: number;
  pity: number;
  dust: number;
  inventory: Record<string, { n: number; at?: unknown }>;
  medals: string[];
}

const base = (s: LootState): LootPatch => ({
  capsules: s.capsules ?? 0,
  pity: s.pity ?? 0,
  dust: s.dust ?? 0,
  inventory: { ...(s.inventory ?? {}) },
  medals: [...(s.medals ?? [])],
});

export type OpenResult =
  | { ok: false; reason: "no-capsules" }
  | {
      ok: true;
      patch: LootPatch;
      result: { item: string; rarity: Rarity; duplicate: boolean; dust: number; completed?: CollectionDone };
    };

export function openCapsule(state: LootState, rand: (n: number) => number, now: Date): OpenResult {
  const p = base(state);
  if (p.capsules < 1) return { ok: false, reason: "no-capsules" };
  const rarity = rollRarity(p.pity, rand);
  const pool = CAPSULE_ITEMS.filter((i) => i.rarity === rarity);
  const item = pool[rand(pool.length)];
  const duplicate = !!p.inventory[item.id];
  const dust = duplicate ? DUPLICATE_DUST[rarity] : 0;

  p.capsules -= 1;
  p.pity = rarity === "epic" || rarity === "legendary" ? 0 : p.pity + 1;
  p.dust += dust;
  let completed: CollectionDone | null = null;
  if (duplicate) p.inventory[item.id] = { ...p.inventory[item.id], n: p.inventory[item.id].n + 1 };
  else completed = addItem(p.inventory, p.medals, item.id, now);

  return { ok: true, patch: p, result: { item: item.id, rarity, duplicate, dust, ...(completed ? { completed } : {}) } };
}

export type CraftResult =
  | { ok: false; reason: "unknown-item" | "not-craftable" | "owned" | "not-enough-dust" }
  | { ok: true; patch: LootPatch; result: { item: string; cost: number; completed?: CollectionDone } };

// Недостающий предмет коллекции за пыль: только обычные и редкие
export function craftItem(state: LootState, id: string, now: Date): CraftResult {
  const item = itemById(id);
  if (!item) return { ok: false, reason: "unknown-item" };
  const cost = CRAFT_COST[item.rarity];
  if (item.reward || cost === undefined) return { ok: false, reason: "not-craftable" };
  const p = base(state);
  if (p.inventory[id]) return { ok: false, reason: "owned" };
  if (p.dust < cost) return { ok: false, reason: "not-enough-dust" };
  p.dust -= cost;
  const completed = addItem(p.inventory, p.medals, id, now);
  return { ok: true, patch: p, result: { item: id, cost, ...(completed ? { completed } : {}) } };
}

// Надеть предмет (null — снять). Только свой и подходящего вида
export function equipItem(state: LootState, slot: Slot, id: string | null): { ok: true; equipped: Equipped } | { ok: false } {
  const equipped: Equipped = { ...(state.equipped ?? { showcase: [] }), showcase: [...(state.equipped?.showcase ?? [])] };
  if (id === null) {
    delete equipped[slot];
    return { ok: true, equipped };
  }
  const item = itemById(id);
  const kinds: Record<Slot, ItemKind> = { satellite: "satellite", ring: "ring", title: "title", background: "background" };
  if (!item || item.kind !== kinds[slot] || !state.inventory?.[id]) return { ok: false };
  equipped[slot] = id;
  return { ok: true, equipped };
}

export const LEGACY_MEDAL = "legacy_flames"; // памятная медаль за рекорд старых огоньков

// Витрина: до трёх своих предметов, медалей или достижений
export function setShowcase(
  state: LootState & { achievements?: string[]; legacyFlames?: number },
  ids: unknown,
): { ok: true; equipped: Equipped } | { ok: false } {
  if (!Array.isArray(ids) || ids.length > SHOWCASE_MAX || !ids.every((x) => typeof x === "string")) return { ok: false };
  const unique = [...new Set(ids as string[])];
  const owns = (id: string) =>
    !!state.inventory?.[id] ||
    (state.medals ?? []).includes(id) ||
    (state.achievements ?? []).includes(id) ||
    (id === LEGACY_MEDAL && (state.legacyFlames ?? 0) > 0);
  if (!unique.every(owns)) return { ok: false };
  return { ok: true, equipped: { ...(state.equipped ?? {}), showcase: unique } };
}
