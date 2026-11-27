// Набор по ссылке (docs/specs/07-shared-sets.md): id ссылки, разбор запросов и то, что из набора видно
// по ссылке. Без ввода-вывода — Firestore в server/shareLinks.ts

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
export const SHARE_ID_LENGTH = 12; // 62^12 ≈ 2^71 — адрес не подобрать перебором
const SHARE_ID = /^[A-Za-z0-9]{12}$/;
// 248 = 62 · 4: байты от 248 отбрасываем, иначе первые буквы алфавита выпадали бы чаще остальных
const BYTE_LIMIT = 248;

// random(n) — n случайных байт (на сервере — crypto.randomBytes)
export function makeShareId(random: (n: number) => Uint8Array): string {
  let id = "";
  while (id.length < SHARE_ID_LENGTH) {
    for (const b of random(SHARE_ID_LENGTH * 2)) {
      if (b >= BYTE_LIMIT) continue;
      id += ALPHABET[b % ALPHABET.length];
      if (id.length === SHARE_ID_LENGTH) break;
    }
  }
  return id;
}

export const isShareId = (v: unknown): v is string => typeof v === "string" && SHARE_ID.test(v);

export type ShareAction = "status" | "create" | "revoke";
export interface ShareLinkInput {
  action: ShareAction;
  collectionId: string;
}

const ACTIONS: ShareAction[] = ["status", "create", "revoke"];
// id набора — любой допустимый id документа Firestore: у импортированных из JSON он остаётся как в файле.
// Главное — без «/» и не «.» / «..»: иначе из id вышел бы другой путь в базе
const isCollectionId = (v: unknown): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= 256 && !v.includes("/") && v !== "." && v !== "..";

export function parseShareLink(body: unknown): ShareLinkInput | null {
  const b = body as Record<string, unknown> | null;
  if (!b || typeof b !== "object") return null;
  if (!ACTIONS.includes(b.action as ShareAction)) return null;
  if (!isCollectionId(b.collectionId)) return null;
  return { action: b.action as ShareAction, collectionId: b.collectionId };
}

export function parseSharedSetRequest(body: unknown): string | null {
  const id = (body as Record<string, unknown> | null)?.id;
  return isShareId(id) ? id : null;
}

// Что видно по ссылке: слова набора без расписания, id карточек и всего, что касается владельца
export interface SharedCard {
  word: string;
  translation: string;
  explanation: string;
  example: string;
  partOfSpeech: string;
}

export interface SharedSet {
  name: string;
  course: string | null; // id курса набора; у старых наборов нет — тогда курс по voice
  voice: string; // язык набора для озвучки: 'nb-NO', 'en-GB'…
  cards: SharedCard[];
}

const text = (v: unknown): string => (typeof v === "string" ? v : "");

// Документ набора из Firestore → то, что уходит по ссылке. Пустые карточки (без слова и перевода) не показываем
export function publicSet(data: Record<string, unknown>): SharedSet {
  const cards = Array.isArray(data.cards) ? (data.cards as Record<string, unknown>[]) : [];
  return {
    name: text(data.name),
    course: typeof data.courseId === "string" && data.courseId ? data.courseId : null,
    voice: text(data.language),
    cards: cards
      .filter((c) => c && typeof c === "object" && (text(c.word).trim() || text(c.translation).trim()))
      .map((c) => ({
        word: text(c.word),
        translation: text(c.translation),
        explanation: text(c.explanation),
        example: text(c.example),
        partOfSpeech: text(c.partOfSpeech),
      })),
  };
}
