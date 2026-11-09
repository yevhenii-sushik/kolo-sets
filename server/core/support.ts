// Сообщение в поддержку: проверка запроса и текст для чата команды в Telegram.
// Отправляет сервер (server/support.ts) — токен бота в браузер не попадает

export const SUPPORT_TOPICS = ["problem", "question", "idea", "feedback"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];
export const MESSAGE_MAX = 3000; // у Telegram предел 4096 символов — с запасом на шапку

// Подписи — для команды, поэтому по-английски и не зависят от языка интерфейса
const LABELS: Record<SupportTopic, string> = { problem: "Problem", question: "Question", idea: "Idea", feedback: "Feedback" };

export interface SupportInput {
  topic: SupportTopic;
  message: string;
  reply: boolean;
}

export function parseSupport(body: unknown): { ok: true; input: SupportInput } | { ok: false; reason: string } {
  if (!body || typeof body !== "object") return { ok: false, reason: "body" };
  const b = body as Record<string, unknown>;
  if (!SUPPORT_TOPICS.includes(b.topic as SupportTopic)) return { ok: false, reason: "topic" };
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message || message.length > MESSAGE_MAX) return { ok: false, reason: "message" };
  if (typeof b.reply !== "boolean") return { ok: false, reason: "reply" };
  return { ok: true, input: { topic: b.topic as SupportTopic, message, reply: b.reply } };
}

// Простой текст без parse_mode: в Markdown Telegram отклоняет сообщение, если в тексте или почте есть «_» или «*».
// Почта — из аккаунта, а не из запроса: подписаться чужим адресом нельзя
export function supportText(input: SupportInput, email: string | null): string {
  return (
    `Support · ${LABELS[input.topic]}\n` +
    `From: ${email ?? "unknown"}\n` +
    `Reply: ${input.reply && email ? "yes" : "not needed"}\n\n` +
    input.message
  );
}
