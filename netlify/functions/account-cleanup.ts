// POST /api/account-cleanup — перед удалением аккаунта: удалить журнал тренировок (его пишет только сервер),
// ссылки на наборы (docs/specs/07-shared-sets.md), чтобы они перестали работать, и счётчики лимитов
import { handler } from "../../server/http";
import { deleteSessions } from "../../server/progress";
import { deleteShareLinks } from "../../server/shareLinks";
import { rateLimitDoc } from "../../server/support";

export default handler(async (uid) => {
  await deleteShareLinks(uid);
  await rateLimitDoc(uid).delete();
  return deleteSessions(uid);
});
