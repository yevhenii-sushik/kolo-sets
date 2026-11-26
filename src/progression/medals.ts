// Медали одним счётом — главная и профиль показывают одно и то же число (docs/specs/06-audit-fixes.md, шаг 1).
// Раньше кубок на главной считал только достижения, а бейдж в профиле — ещё и медали коллекций и бета-медаль.
// В счёт идут: достижения, памятная медаль за старые огоньки, медали собранных коллекций и бета-медаль.
// Неизвестные id (старые или будущие) не считаются, чтобы открытых не стало больше, чем всего.
import { ALL_ACHIEVEMENTS } from "../utils/achievements";
import { COLLECTIONS } from "../../server/core/items";
import { BETA_MEDAL } from "../../server/core/loot";

export interface MedalInput {
  achievements: readonly string[]; // profile.achievements
  medals: readonly string[]; // loot.medals: медали коллекций и бета-медаль
  legacyFlames: number | null | undefined; // рекорд старых огоньков — памятная медаль
}

const COLLECTION_MEDALS = new Set(COLLECTIONS.map((c) => c.medal));

export function medalCount({ achievements, medals, legacyFlames }: MedalInput): { unlocked: number; total: number } {
  const legacy = typeof legacyFlames === "number" && legacyFlames > 0 ? 1 : 0;
  const beta = medals.includes(BETA_MEDAL) ? 1 : 0;
  const achieved = ALL_ACHIEVEMENTS.filter((a) => achievements.includes(a.id)).length;
  const collected = COLLECTIONS.filter((c) => medals.includes(c.medal)).length;
  return {
    unlocked: achieved + legacy + collected + beta,
    // Бета-медаль и огоньки есть не у всех: в «всего» они входят, только если получены
    total: ALL_ACHIEVEMENTS.length + legacy + COLLECTION_MEDALS.size + beta,
  };
}
