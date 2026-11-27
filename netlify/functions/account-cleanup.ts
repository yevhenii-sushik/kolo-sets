// POST /api/account-cleanup — перед удалением аккаунта: удалить журнал тренировок (его пишет только сервер)
// и ссылки на наборы (docs/specs/07-shared-sets.md), чтобы они перестали работать
import { handler } from "../../server/http";
import { deleteSessions } from "../../server/progress";
import { deleteShareLinks } from "../../server/shareLinks";

export default handler(async (uid) => {
  await deleteShareLinks(uid);
  return deleteSessions(uid);
});
