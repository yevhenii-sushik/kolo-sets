// POST /api/support — сообщение в поддержку уходит в чат команды в Telegram
import { handler } from "../../server/http";
import { parseSupport } from "../../server/core/support";
import { sendSupport } from "../../server/support";
import { standingOf } from "../../server/access";
import { supportLimit } from "../../server/core/access";

export default handler(async (uid, body, token) => {
  const parsed = parseSupport(body);
  if (!parsed.ok) return { status: 400, body: { error: "bad-request", field: parsed.reason } };
  return sendSupport(uid, parsed.input, supportLimit(await standingOf(token)));
});
