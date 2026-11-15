// Настройки флэшкарт (docs/specs/perigee.md, «Флэшкарты, шаг 2»): направление, порядок, озвучка.
// Удобство устройства, как и позиция круга, — в localStorage, общие для всех наборов

export type FlashDirection = "forward" | "reverse" | "mixed";

export interface FlashPrefs {
  direction: FlashDirection; // слово → перевод, перевод → слово, в обе стороны
  shuffle: boolean; // вперемешку вместо порядка набора
  speak: boolean; // озвучивать слово, когда открываешь ответ
}

export const DEFAULT_FLASH_PREFS: FlashPrefs = { direction: "forward", shuffle: false, speak: true };

const DIRECTIONS: FlashDirection[] = ["forward", "reverse", "mixed"];
const KEY = "kolo_flash_prefs";

export function parseFlashPrefs(raw: string | null): FlashPrefs {
  if (!raw) return DEFAULT_FLASH_PREFS;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof FlashPrefs, unknown>>;
    if (!v || typeof v !== "object") return DEFAULT_FLASH_PREFS;
    return {
      direction: DIRECTIONS.includes(v.direction as FlashDirection) ? (v.direction as FlashDirection) : DEFAULT_FLASH_PREFS.direction,
      shuffle: typeof v.shuffle === "boolean" ? v.shuffle : DEFAULT_FLASH_PREFS.shuffle,
      speak: typeof v.speak === "boolean" ? v.speak : DEFAULT_FLASH_PREFS.speak,
    };
  } catch {
    return DEFAULT_FLASH_PREFS;
  }
}

export function readFlashPrefs(): FlashPrefs {
  try {
    return parseFlashPrefs(localStorage.getItem(KEY));
  } catch {
    return DEFAULT_FLASH_PREFS;
  }
}

export function saveFlashPrefs(prefs: FlashPrefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Хранилище недоступно — настройки проживут до конца тренировки
  }
}

// Какой стороной показать карточку. В обе стороны — случайно для каждого слова: вспомнить слово по
// переводу труднее и полезнее для речи, узнать — легче; смесь держит в тонусе
export const pickReverse = (direction: FlashDirection, rng: () => number = Math.random): boolean =>
  direction === "reverse" || (direction === "mixed" && rng() < 0.5);
