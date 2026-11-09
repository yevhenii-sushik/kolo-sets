// POST /api/support — сообщение в поддержку уходит в чат команды в Telegram
import { handler } from "../../server/http";
import { parseSupport } from "../../server/core/support";
import { sendSupport } from "../../server/support";

export default handler(async (uid, body) => {
  const parsed = parseSupport(body);
  if (!parsed.ok) return { status: 400, body: { error: "bad-request", field: parsed.reason } };
  return sendSupport(uid, parsed.input);
});
