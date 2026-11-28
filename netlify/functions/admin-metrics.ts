// POST /api/admin-metrics — удержание: когорты по неделе регистрации и воронка новичка (docs/specs/admin.md)
import { adminHandler } from "../../server/http";
import { adminMetrics } from "../../server/admin-panel";

export default adminHandler(() => adminMetrics());
