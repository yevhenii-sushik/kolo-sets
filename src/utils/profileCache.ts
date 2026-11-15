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

// На устройстве уже кто-то входил. Пока Firebase не ответил, это лучшая догадка, вошёл ли
// пользователь и сейчас: копия профиля при выходе не стирается, так что догадка может ошибаться
// только в сторону «подождать» — как было раньше для всех
export function hadSignInOnDevice(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('profile_cache_')) return true;
    }
  } catch {}
  return false;
}
