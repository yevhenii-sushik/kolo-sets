// Сообщение в поддержку: проверка запроса и текст для чата команды в Telegram.
// Отправляет сервер (server/support.ts) — токен бота в браузер не попадает

export const SUPPORT_TOPICS = ["problem", "question", "idea", "feedback"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];
export const MESSAGE_MAX = 3000; // у Telegram предел 4096 символов — с запасом на шапку
const PRESET_TEXT_MAX = 200; // слово и перевод карточки — короткие

// Подписи — для команды, поэтому по-английски и не зависят от языка интерфейса
const LABELS: Record<SupportTopic, string> = { problem: "Problem", question: "Question", idea: "Idea", feedback: "Feedback" };

// Ошибка в готовом наборе Kolo (docs/specs/05-ready-sets.md, «Ошибки в наборах»): набор, карточка и язык
// перевода — команда находит её в src/presets/<курс>/<уровень>/<тема>.json без переписки.
// Слово и перевод — как карточка выглядит у человека сейчас: он мог её уже поправить
export interface PresetReport {
  set: string; // id готового набора: nb-a1-food
  version: number;
  card: string; // id карточки в наборе
  lang: string; // язык перевода
  word: string;
  translation: string;
}

export interface SupportInput {
  topic: SupportTopic;
  message: string;
  reply: boolean;
  preset?: PresetReport;
}

const PRESET_ID = /^[a-z0-9-]{1,80}$/;
const LANG = /^[a-zA-Z-]{2,8}$/;

function parsePreset(value: unknown): PresetReport | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  if (typeof p.set !== "string" || !PRESET_ID.test(p.set)) return null;
  if (typeof p.card !== "string" || !PRESET_ID.test(p.card)) return null;
  if (typeof p.lang !== "string" || !LANG.test(p.lang)) return null;
  if (typeof p.version !== "number" || !Number.isInteger(p.version) || p.version < 1 || p.version > 1_000_000) return null;
  const word = typeof p.word === "string" ? p.word.trim() : "";
  const translation = typeof p.translation === "string" ? p.translation.trim() : null;
  if (!word || word.length > PRESET_TEXT_MAX || translation === null || translation.length > PRESET_TEXT_MAX) return null;
  return { set: p.set, version: p.version, card: p.card, lang: p.lang, word, translation };
}

export function parseSupport(body: unknown): { ok: true; input: SupportInput } | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;
  if (!SUPPORT_TOPICS.includes(b.topic as SupportTopic)) return { ok: false, reason: "topic" };
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message || message.length > MESSAGE_MAX) return { ok: false, reason: "message" };
  if (typeof b.reply !== "boolean") return { ok: false, reason: "reply" };
  const input: SupportInput = { topic: b.topic as SupportTopic, message, reply: b.reply };
  if (b.preset !== undefined) {
    const preset = parsePreset(b.preset);
    if (!preset) return { ok: false, reason: "preset" };
    input.preset = preset;
  }
  return { ok: true, input };
}

// Простой текст без parse_mode: в Markdown Telegram отклоняет сообщение, если в тексте или почте есть «_» или «*».
// Почта — из аккаунта, а не из запроса: подписаться чужим адресом нельзя
export function supportText(input: SupportInput, email: string | null): string {
  const p = input.preset;
  return (
    `Support · ${p ? "Ready-set mistake" : LABELS[input.topic]}\n` +
    `From: ${email ?? "unknown"}\n` +
    `Reply: ${input.reply && email ? "yes" : "not needed"}\n` +
    (p ? `Set: ${p.set} v${p.version} · translation: ${p.lang}\nCard: ${p.card} · ${p.word} — ${p.translation || "(empty)"}\n` : "") +
    `\n${input.message}`
  );
}
