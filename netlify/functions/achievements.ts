// POST /api/achievements — пересчёт достижений за наборы и слова с опытом и капсулами (docs/specs/00-server.md)
import { handler } from "../../server/http";
import { recheckCollectionAchievements } from "../../server/progress";

export default handler((uid, body) => recheckCollectionAchievements(uid, (body as { timezone?: unknown } | null)?.timezone));
