// POST /api/session — тренировка завершена (docs/specs/00-server.md)
import { handler } from "../../server/http";
import { parseSession } from "../../server/core/session";
import { recordSession } from "../../server/progress";

export default handler(async (uid, body) => {
  const parsed = parseSession(body);
  if (!parsed.ok) return { status: 400, body: { error: "bad-request", field: parsed.reason } };
  return recordSession(uid, parsed.session);
});
