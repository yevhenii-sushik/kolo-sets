// POST /api/account-cleanup — перед удалением аккаунта: удалить журнал тренировок (его пишет только сервер)
import { handler } from "../../server/http";
import { deleteSessions } from "../../server/progress";

export default handler((uid) => deleteSessions(uid));
