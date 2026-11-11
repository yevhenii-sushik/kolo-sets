// POST /api/admin-overview — сводка для админ-панели: аккаунты, профили, тренировки (docs/specs/admin.md)
import { adminHandler } from "../../server/http";
import { adminOverview } from "../../server/admin-panel";

export default adminHandler(() => adminOverview());
