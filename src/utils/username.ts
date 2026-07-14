// Username — обязательное, уникальное поле профиля (фундамент для друзей
// и социальных функций: поиск/добавление пользователя по @имени).

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(name: string): string {
  return name.trim().toLowerCase();
}

export function isValidUsername(normalized: string): boolean {
  return USERNAME_RE.test(normalized);
}

// Авто-генерируемый "уникальный токен" для юзеров без имени пользователя —
// user_ + 8 случайных base36-символов. Уникальность в масштабах базы
// гарантирует не сама генерация, а транзакционная резервация в Firestore
// (claimUsername/assignAutoUsername) — коллизия здесь просто означает retry.
export function generateUsername(): string {
  const suffix = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `user_${suffix}`;
}
