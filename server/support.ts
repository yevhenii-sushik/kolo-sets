// Отправка сообщения в поддержку в чат команды. Токен бота и чат — только из переменных окружения Netlify
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, db } from "./admin";
import { supportText, type SupportInput } from "./core/support";
import { takeDaily } from "./core/rateLimit";
import type { Reply } from "./progress";

// Счётчики «сколько сегодня» по людям: rateLimits/{uid}. Пишет и читает только сервер (общий запрет в правилах)
export const rateLimitDoc = (uid: string) => db().doc(`rateLimits/${uid}`);

// limit — сколько сообщений в сутки можно этому аккаунту (server/core/access.ts → supportLimit):
// без лимита пробный вход позволял бы одним нажатием засыпать чат команды
export async function sendSupport(uid: string, input: SupportInput, limit: number, now = new Date()): Promise<Reply> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID are not set");

  const ref = rateLimitDoc(uid);
  const allowed = await db().runTransaction(async (tx) => {
    const next = takeDaily((await tx.get(ref)).get("support"), limit, now);
    if (!next) return false;
    tx.set(ref, { support: next }, { merge: true });
    return true;
  });
  if (!allowed) return { status: 429, body: { error: "limit" } };

  const email = (await adminAuth().getUser(uid)).email ?? null;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: supportText(input, email) }),
  });
  if (!res.ok) {
    console.error("[support] telegram", res.status, await res.text().catch(() => ""));
    // Не дошло не по вине человека — попытку не засчитываем
    await ref.update({ "support.count": FieldValue.increment(-1) }).catch(() => {});
    return { status: 502, body: { error: "telegram" } };
  }
  return { status: 200, body: { ok: true } };
}
