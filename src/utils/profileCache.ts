// Копии профиля и прогресса в localStorage: шапка, главная и профиль показывают их сразу,
// не дожидаясь сервера. Список ключей — в политике конфиденциальности (legal-docs, раздел о хранилище)

export function readCache(key: string): any | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export const profileCacheKey = (uid: string) => `profile_cache_${uid}`;
// Шапка показывает орбиту сразу, не дожидаясь сервера
export const progressionCacheKey = (uid: string) => `progression_cache_${uid}`;

// Профиль этого пользователя уже загружался на устройстве — значит, документ в базе есть
export const hasCachedProfile = (uid: string) => readCache(profileCacheKey(uid)) !== null;
