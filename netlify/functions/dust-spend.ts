// POST /api/dust-spend — щит или недостающий предмет коллекции за звёздную пыль
import { handler } from "../../server/http";
import { spendDust } from "../../server/progress";

export default handler((uid, body) => spendDust(uid, (body ?? {}) as Record<string, unknown>));
