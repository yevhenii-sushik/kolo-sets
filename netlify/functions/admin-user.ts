// POST /api/admin-user { query } — пользователь по email, @имени или uid (docs/specs/admin.md)
import { adminHandler } from "../../server/http";
import { adminUser } from "../../server/admin-panel";

export default adminHandler((admin, body) => adminUser(admin, (body as { query?: unknown } | null)?.query));
