// POST /api/share-link — владелец узнаёт, создаёт или выключает ссылку на свой набор (docs/specs/07-shared-sets.md)
import { handler } from "../../server/http";
import { parseShareLink } from "../../server/core/shareLinks";
import { shareLink } from "../../server/shareLinks";

export default handler(async (uid, body) => {
  const input = parseShareLink(body);
  if (!input) return { status: 400, body: { error: "bad-request" } };
  return shareLink(uid, input);
});
