import { PRESET_LEVELS, comparePresets, presetId, type PresetFile, type PresetLevel, type PresetSet } from "./levels";

export * from "./levels";

// Каждый набор — свой файл и свой чанк: открытая страница грузит только наборы активного курса,
// в основной файл приложения карточки не попадают
const FILES = import.meta.glob<PresetFile>("./*/*/*.json", { import: "default" });

interface PresetRef {
  id: string;
  course: string;
  level: PresetLevel;
  topic: string;
  load: () => Promise<PresetFile>;
}

const parsePath = (path: string) => {
  const m = path.match(/^\.\/([^/]+)\/([^/]+)\/([^/]+)\.json$/);
  if (!m) return null;
  const level = m[2].toUpperCase() as PresetLevel;
  if (!PRESET_LEVELS.includes(level)) return null;
  return { course: m[1], level, topic: m[3] };
};

const REFS: PresetRef[] = Object.entries(FILES)
  .flatMap(([path, load]) => {
    const p = parsePath(path);
    return p ? [{ ...p, id: presetId(p.course, p.level, p.topic), load }] : [];
  })
  .sort(comparePresets);

// Есть ли у курса готовые наборы — без загрузки самих наборов
export const hasPresets = (course: string): boolean => REFS.some((r) => r.course === course);

export async function loadCoursePresets(course: string): Promise<PresetSet[]> {
  const refs = REFS.filter((r) => r.course === course);
  const files = await Promise.all(refs.map((r) => r.load()));
  return refs.map(({ id, level, topic }, i) => ({ id, course, level, topic, version: files[i].version, cards: files[i].cards }));
}

// Первая тема курса, которой ещё нет у человека (по порядку уровней и тем) — без загрузки наборов.
// Её предлагает сценарий «Первый набор» в «Первых шагах»
export const firstMissingPreset = (course: string, added: ReadonlySet<string>) => {
  const ref = REFS.find((r) => r.course === course && !added.has(r.id));
  return ref ? { id: ref.id, level: ref.level, topic: ref.topic } : null;
};

export async function loadPreset(id: string): Promise<PresetSet | null> {
  const ref = REFS.find((r) => r.id === id);
  if (!ref) return null;
  const file = await ref.load();
  return { id: ref.id, course: ref.course, level: ref.level, topic: ref.topic, version: file.version, cards: file.cards };
}
