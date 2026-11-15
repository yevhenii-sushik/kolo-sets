export type DeepPartial<T> = T extends readonly unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

// Чего нет в переводе, берём из английского — по ключам, а не целым разделом. Так раздел можно
// переводить частями (например, только флэшкарты в words) и показывать сразу, не дожидаясь всего
// раздела. Массивы — целиком: их элементы не сопоставить по ключам. Лишние ключи перевода
// (формы множественного числа few/many) сохраняются
export function fillFrom<T>(base: T, part: unknown): T {
  if (part === undefined || part === null) return base;
  if (Array.isArray(base)) return (Array.isArray(part) ? part : base) as T;
  if (base !== null && typeof base === 'object') {
    if (typeof part !== 'object' || Array.isArray(part)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [key, value] of Object.entries(part as Record<string, unknown>)) {
      out[key] = key in out ? fillFrom(out[key], value) : value;
    }
    return out as T;
  }
  return (typeof part === typeof base ? part : base) as T;
}
