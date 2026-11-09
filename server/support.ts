// Отправка сообщения в поддержку в чат команды. Токен бота и чат — только из переменных окружения Netlify
import { adminAuth } from "./admin";
import { supportText, type SupportInput } from "./core/support";
import type { Reply } from "./progress";

export async function sendSupport(uid: string, input: SupportInput): Promise<Reply> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set");

  const email = (await adminAuth().getUser(uid)).email ?? null;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: supportText(input, email) }),
  });
  if (!res.ok) {
    console.error("[support] telegram", res.status, await res.text().catch(() => ""));
    return { status: 502, body: { error: "telegram" } };
  }
  return { status: 200, body: { ok: true } };
}
