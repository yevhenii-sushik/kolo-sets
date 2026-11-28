// POST /api/share-link — владелец узнаёт, создаёт или выключает ссылку на свой набор (docs/specs/07-shared-sets.md)
import { handler } from "../../server/http";
import { parseShareLink } from "../../server/core/shareLinks";
import { shareLink } from "../../server/shareLinks";
import { standingOf } from "../../server/access";
import { canShare } from "../../server/core/access";

export default handler(async (uid, body, token) => {
  const input = parseShareLink(body);
  if (!input) return { status: 400, body: { error: "bad-request" } };
  // Ссылка — публичная страница на нашем адресе: создать её может только подтверждённый аккаунт
  // (решение 2026-11-28). Узнать и выключить уже созданную можно всем
  if (input.action === "create") {
    const who = await standingOf(token);
    if (!canShare(who)) return { status: 403, body: { error: who === "trial" ? "trial" : "verify-email" } };
  }
  return shareLink(uid, input);
});
