// POST /api/achievements — пересчёт достижений за наборы и слова (docs/specs/00-server.md)
import { handler } from "../../server/http";
import { recheckCollectionAchievements } from "../../server/progress";

export default handler((uid) => recheckCollectionAchievements(uid));
