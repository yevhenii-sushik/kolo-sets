// Гость открыл набор по ссылке и пошёл регистрироваться или входить: после входа возвращаем его на ту же ссылку,
// а не на главную (docs/specs/07-shared-sets.md). Сутки — дальше ссылка уже не то, ради чего человек пришёл
const KEY = "kolo_pending_share";
const TTL_MS = 24 * 60 * 60 * 1000;

export function rememberPendingShare(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    // Хранилище закрыто (приватный режим) — после входа человек попадёт на главную
  }
}

// Куда вести после входа: на ссылку, если гость пришёл с неё, иначе на главную
export function afterSignInPath(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as { id?: unknown; at?: unknown } | null;
    if (saved && typeof saved.id === "string" && typeof saved.at === "number" && Date.now() - saved.at < TTL_MS) {
      return `/s/${encodeURIComponent(saved.id)}`;
    }
  } catch {
    // Испорченная запись — как будто её нет
  }
  return "/";
}

export function clearPendingShare(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // нечего чистить
  }
}
