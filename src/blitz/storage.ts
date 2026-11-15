// Удобства Блица на этом устройстве — в localStorage, как у теста и флэшкарт: как спрашивать (общая
// настройка) и очки по набору для рекорда и «в прошлый раз» — отдельно для каждого способа: на слух
// и в обратную сторону играть труднее, рекорд там свой. Это не данные аккаунта

import { BLITZ_MODES, BlitzHistory, BlitzMode, BlitzSettings, DEFAULT_BLITZ_SETTINGS } from "./plan";

const PREFS_KEY = "kolo_blitz_prefs";
const historyKey = (collectionId: string) => `kolo_blitz_hist_${collectionId}`;

export type BlitzHistories = Partial<Record<BlitzMode, BlitzHistory>>;

export function parseBlitzPrefs(raw: string | null): BlitzSettings {
  if (!raw) return DEFAULT_BLITZ_SETTINGS;
  try {
    const v = JSON.parse(raw) as { mode?: unknown } | null;
    return v && BLITZ_MODES.includes(v.mode as BlitzMode) ? { mode: v.mode as BlitzMode } : DEFAULT_BLITZ_SETTINGS;
  } catch {
    return DEFAULT_BLITZ_SETTINGS;
  }
}

export function readBlitzPrefs(): BlitzSettings {
  try {
    return parseBlitzPrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return DEFAULT_BLITZ_SETTINGS;
  }
}

export function saveBlitzPrefs(prefs: BlitzSettings) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Хранилище недоступно — настройка проживёт до конца захода
  }
}

export function parseBlitzHistories(raw: string | null): BlitzHistories {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const score = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.round(x) : undefined);
    const out: BlitzHistories = {};
    for (const mode of BLITZ_MODES) {
      const h = (v as Record<string, unknown>)[mode] as Record<string, unknown> | undefined;
      if (!h || typeof h !== "object") continue;
      const entry: BlitzHistory = { last: score(h.last), best: score(h.best) };
      if (entry.last !== undefined || entry.best !== undefined) out[mode] = entry;
    }
    return out;
  } catch {
    return {};
  }
}

export function readBlitzHistory(collectionId: string, mode: BlitzMode): BlitzHistory {
  try {
    return parseBlitzHistories(localStorage.getItem(historyKey(collectionId)))[mode] ?? {};
  } catch {
    return {};
  }
}

export function saveBlitzHistory(collectionId: string, mode: BlitzMode, history: BlitzHistory) {
  try {
    const all = parseBlitzHistories(localStorage.getItem(historyKey(collectionId)));
    all[mode] = history;
    localStorage.setItem(historyKey(collectionId), JSON.stringify(all));
  } catch {
    // Рекорд просто не запомнится
  }
}
