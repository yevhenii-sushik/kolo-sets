// POST /api/capsules-open — открыть капсулу (docs/specs/02-progression.md → «Капсулы»)
import { handler } from "../../server/http";
import { openUserCapsule } from "../../server/progress";

export default handler((uid) => openUserCapsule(uid));
