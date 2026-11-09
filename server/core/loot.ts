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

// Бета-тестеры — кто зарегистрировался до 31 декабря 2026 включительно (с запасом на часовые пояса:
// полдень 1 января по UTC — это ещё 31 декабря на западе Тихого океана). Дату регистрации сервер
// берёт из Firebase Auth, а не из профиля — её нельзя подделать
export const BETA_CUTOFF = Date.UTC(2027, 0, 1, 12);
export const BETA_MEDAL = "beta_tester";
const BETA_ITEMS = ["title_beta_tester", "ring_beta"];

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
  satellites?: string[]; // на орбите может быть несколько спутников — см. SATELLITE_LEVELS
  satellite?: string; // до нескольких мест — один спутник; читается через satellitesOf
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

// Медаль, титул и кольцо бета-тестера. null — не положено или уже выдано
export function grantBeta(state: LootState, joinedAt: number, now: Date): Pick<LootPatch, "medals" | "inventory"> | null {
  if (!(joinedAt < BETA_CUTOFF) || (state.medals ?? []).includes(BETA_MEDAL)) return null;
  const inventory = { ...(state.inventory ?? {}) };
  for (const id of BETA_ITEMS) if (!inventory[id]) inventory[id] = { n: 1, at: now };
  return { medals: [...(state.medals ?? []), BETA_MEDAL], inventory };
}

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

// Места для спутников на орбите: каждое следующее открывается с этого уровня
export const SATELLITE_LEVELS = [1, 5, 10];
export const satelliteSlots = (level: number) => SATELLITE_LEVELS.filter((l) => level >= l).length;

// Спутники на орбите — из списка или из старого одиночного поля
export const satellitesOf = (e: Partial<Equipped> | undefined): string[] => e?.satellites ?? (e?.satellite ? [e.satellite] : []);

const copyEquipped = (state: LootState): Equipped => {
  const equipped: Equipped = { ...(state.equipped ?? { showcase: [] }), showcase: [...(state.equipped?.showcase ?? [])] };
  delete equipped.satellite;
  return equipped;
};

// Надеть предмет (null — снять). Только свой и подходящего вида. Спутник так ставится один —
// как в версиях до нескольких мест; несколько — через setSatellites
export function equipItem(state: LootState, slot: Slot, id: string | null): { ok: true; equipped: Equipped } | { ok: false } {
  const equipped = copyEquipped(state);
  if (id === null) {
    if (slot === "satellite") equipped.satellites = [];
    else delete equipped[slot];
    return { ok: true, equipped };
  }
  const item = itemById(id);
  const kinds: Record<Slot, ItemKind> = { satellite: "satellite", ring: "ring", title: "title", background: "background" };
  if (!item || item.kind !== kinds[slot] || !state.inventory?.[id]) return { ok: false };
  if (slot === "satellite") equipped.satellites = [id];
  else equipped[slot] = id;
  return { ok: true, equipped };
}

// Спутники на орбите целиком: только свои, без повторов и не больше открытых мест
export function setSatellites(
  state: LootState & { level?: number },
  ids: unknown,
): { ok: true; equipped: Equipped } | { ok: false; reason: "bad-request" | "not-owned" | "no-room" } {
  if (!Array.isArray(ids) || !ids.every((x) => typeof x === "string")) return { ok: false, reason: "bad-request" };
  const unique = [...new Set(ids as string[])];
  if (!unique.every((id) => itemById(id)?.kind === "satellite" && !!state.inventory?.[id])) return { ok: false, reason: "not-owned" };
  if (unique.length > satelliteSlots(state.level ?? 1)) return { ok: false, reason: "no-room" };
  return { ok: true, equipped: { ...copyEquipped(state), satellites: unique } };
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
