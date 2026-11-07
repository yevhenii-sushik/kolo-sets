// POST /api/progress-sync — итоги прошедших недель при открытии приложения (docs/specs/02-progression.md)
import { handler } from "../../server/http";
import { syncUserProgress } from "../../server/progress";

export default handler((uid, body) => syncUserProgress(uid, (body as { timezone?: unknown } | null)?.timezone));
