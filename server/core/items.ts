// Каталог предметов (docs/specs/02-progression.md → «Предметы и коллекции»). Здесь — то, что нужно серверу:
// вид, редкость, коллекция. Как предмет выглядит — src/progression/looks.ts, названия — locales/*/rewards.json.

export type ItemKind = "satellite" | "ring" | "title" | "background";
export type Rarity = "common" | "rare" | "epic" | "legendary";
export type CollectionId = "planets" | "orbits" | "sky" | "voices";

export interface Item {
  id: string;
  kind: ItemKind;
  rarity: Rarity;
  collection?: CollectionId; // нет у особых наград (бета-тестерам)
  reward?: true; // награда (за полный сбор или особая): в капсулах не выпадает и за пыль не создаётся
  exclusive?: "beta"; // особая награда — больше её не получить
}

export const RARITIES: readonly Rarity[] = ["common", "rare", "epic", "legendary"];

const group = (collection: CollectionId, kind: ItemKind, byRarity: Partial<Record<Rarity, string[]>>): Item[] =>
  RARITIES.flatMap((rarity) => (byRarity[rarity] ?? []).map((id) => ({ id, kind, rarity, collection })));

export const ITEMS: readonly Item[] = [
  ...group("planets", "satellite", {
    common: ["sat_moon", "sat_mars", "sat_mercury", "sat_venus"],
    rare: ["sat_neptune", "sat_uranus", "sat_jupiter"],
    epic: ["sat_saturn"],
    legendary: ["sat_supernova"],
  }),
  ...group("orbits", "ring", {
    common: ["ring_mint", "ring_lavender", "ring_sky", "ring_coral"],
    rare: ["ring_sunset", "ring_ocean", "ring_aurora"],
    epic: ["ring_constellation", "ring_neon"],
    legendary: ["ring_corona"],
  }),
  ...group("sky", "background", {
    common: ["bg_dawn", "bg_dusk", "bg_mist"],
    rare: ["bg_starry", "bg_northern", "bg_milkyway"],
    epic: ["bg_nebula"],
    legendary: ["bg_meteors"],
  }),
  ...group("voices", "title", {
    common: ["title_curious", "title_persistent", "title_bookworm", "title_early_bird"],
    rare: ["title_polyglot", "title_wordsmith", "title_review_master"],
    epic: ["title_word_keeper"],
    legendary: ["title_kolo_legend"],
  }),
  // Титулы за полный сбор коллекций
  { id: "title_system_master", kind: "title", rarity: "legendary", collection: "planets", reward: true },
  { id: "title_orbit_cartographer", kind: "title", rarity: "legendary", collection: "orbits", reward: true },
  { id: "title_stargazer", kind: "title", rarity: "legendary", collection: "sky", reward: true },
  // Бета-тестерам: кто зарегистрировался до конца 2026 года (server/core/loot.ts → BETA_CUTOFF)
  { id: "title_beta_tester", kind: "title", rarity: "legendary", reward: true, exclusive: "beta" },
  { id: "ring_beta", kind: "ring", rarity: "legendary", reward: true, exclusive: "beta" },
];

export const COLLECTIONS: readonly { id: CollectionId; kind: ItemKind; medal: string; title?: string }[] = [
  { id: "planets", kind: "satellite", medal: "collection_planets", title: "title_system_master" },
  { id: "orbits", kind: "ring", medal: "collection_orbits", title: "title_orbit_cartographer" },
  { id: "sky", kind: "background", medal: "collection_sky", title: "title_stargazer" },
  { id: "voices", kind: "title", medal: "collection_voices" },
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));
export const itemById = (id: string): Item | undefined => BY_ID.get(id);

// Предметы, которые можно получить из капсулы (и собрать в коллекцию)
export const CAPSULE_ITEMS = ITEMS.filter((i) => !i.reward);
// Награды за полный сбор и особые — их только надевают
export const REWARD_ITEMS = ITEMS.filter((i) => i.reward);
export const collectionItems = (c: CollectionId) => CAPSULE_ITEMS.filter((i) => i.collection === c);
