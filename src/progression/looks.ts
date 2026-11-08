// Как выглядят предметы (docs/specs/02-progression.md → «Как рисуем»). Это рисунки, а не цвета интерфейса:
// здесь допустимы свои цвета. Каталог (вид, редкость) — server/core/items.ts, названия — locales/*/rewards.json.

export interface PlanetLook {
  base: string;
  shade: string;
  light: string;
  bands?: string[]; // полосы, как у Юпитера
  ring?: string; // кольцо, как у Сатурна
  craters?: boolean;
  glow?: string; // свечение вокруг
  rays?: boolean; // лучи сверхновой
}

export const PLANETS: Record<string, PlanetLook> = {
  sat_moon: { base: "#C9CED8", shade: "#8E95A5", light: "#F1F3F7", craters: true },
  sat_mars: { base: "#E2603A", shade: "#9E3420", light: "#F59A72" },
  sat_mercury: { base: "#A89F94", shade: "#6E665D", light: "#D6CFC6", craters: true },
  sat_venus: { base: "#F2C46D", shade: "#C28A2E", light: "#FBE3A9" },
  sat_neptune: { base: "#3D6BFF", shade: "#1C3A9E", light: "#8FB0FF", bands: ["#5C84FF"] },
  sat_uranus: { base: "#7FE0E6", shade: "#3A9EA8", light: "#C8F5F7", ring: "#BFEFF2" },
  sat_jupiter: { base: "#E6B98A", shade: "#A8693C", light: "#F7DEC2", bands: ["#C98D5C", "#F3D3AE", "#B9754A"] },
  sat_saturn: { base: "#F0D58C", shade: "#B9933F", light: "#FFF0C4", ring: "#E2C178", glow: "#F0D58C" },
  sat_supernova: { base: "#FFD15A", shade: "#FF5A1F", light: "#FFFFFF", glow: "#FF8A3D", rays: true },
};

export interface RingLook {
  stops: string[]; // цвета кольца по кругу
  dash?: boolean; // пунктир со звёздами
  glow?: boolean;
  spin?: boolean; // медленно вращается
}

export const RINGS: Record<string, RingLook> = {
  ring_mint: { stops: ["#34D399", "#10B981"] },
  ring_lavender: { stops: ["#C4B5FD", "#8B5CF6"] },
  ring_sky: { stops: ["#7DD3FC", "#0EA5E9"] },
  ring_coral: { stops: ["#FDA4AF", "#F43F5E"] },
  ring_sunset: { stops: ["#FF5A1F", "#F59E0B", "#EC4899"] },
  ring_ocean: { stops: ["#14B8A6", "#0EA5E9", "#2563EB"] },
  ring_aurora: { stops: ["#22D3EE", "#A78BFA", "#34D399"] },
  ring_constellation: { stops: ["#E0E7FF", "#93C5FD", "#E0E7FF"], dash: true },
  ring_neon: { stops: ["#F0ABFC", "#8B5CF6", "#22D3EE"], glow: true },
  ring_corona: { stops: ["#FFE08A", "#FF5A1F", "#FFE08A"], glow: true, spin: true },
};

export interface SkyLook {
  gradient: string; // CSS-градиент
  stars?: number; // сколько звёзд
  aurora?: string[]; // полосы сияния
  band?: boolean; // Млечный Путь — густая полоса звёзд
  nebula?: string[]; // облака туманности
  meteors?: boolean;
}

export const SKIES: Record<string, SkyLook> = {
  bg_dawn: { gradient: "linear-gradient(135deg, #FFD3B5 0%, #FF9A8B 50%, #A18CD1 100%)" },
  bg_dusk: { gradient: "linear-gradient(160deg, #2E3A87 0%, #8E4DA6 55%, #F27C6B 100%)", stars: 8 },
  bg_mist: { gradient: "linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 60%, #94A3B8 100%)" },
  bg_starry: { gradient: "linear-gradient(180deg, #0B1026 0%, #1C2452 100%)", stars: 40 },
  bg_northern: { gradient: "linear-gradient(180deg, #06141F 0%, #0B2A3A 100%)", stars: 20, aurora: ["#34D399", "#22D3EE"] },
  bg_milkyway: { gradient: "linear-gradient(160deg, #0B0E19 0%, #1B1636 100%)", stars: 30, band: true },
  bg_nebula: { gradient: "linear-gradient(160deg, #0B0E19 0%, #170F2E 100%)", stars: 24, nebula: ["#A855F7", "#EC4899", "#3B82F6"] },
  bg_meteors: { gradient: "linear-gradient(180deg, #050816 0%, #121A3D 100%)", stars: 36, meteors: true },
};

// Одни и те же «случайные» звёзды для одного фона при каждом показе
export function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
