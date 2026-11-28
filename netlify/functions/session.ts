// POST /api/session — тренировка завершена (docs/specs/00-server.md)
import { handler } from "../../server/http";
import { parseSession } from "../../server/core/session";
import { recordSession } from "../../server/progress";
import { standingOf } from "../../server/access";
import { canStudy } from "../../server/core/access";

export default handler(async (uid, body, token) => {
  const parsed = parseSession(body);
  if (!parsed.ok) return { status: 400, body: { error: "bad-request", field: parsed.reason } };
  // Неделя на подтверждение почты прошла — тренировки не принимаем, пока не подтвердит (server/core/access.ts).
  // Клиент держит такую тренировку в очереди и отправит после подтверждения
  if (!canStudy(await standingOf(token))) return { status: 403, body: { error: "verify-email" } };
  return recordSession(uid, parsed.session);
});
