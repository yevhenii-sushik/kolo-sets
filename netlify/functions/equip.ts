// POST /api/equip — надеть или снять предмет, выбрать витрину (только из своего)
import { handler } from "../../server/http";
import { equipUserItem } from "../../server/progress";

export default handler((uid, body) => equipUserItem(uid, (body ?? {}) as Record<string, unknown>));
