// POST /api/shared-set — слова набора по ссылке; вход не обязателен (docs/specs/07-shared-sets.md)
import { publicHandler } from "../../server/http";
import { parseSharedSetRequest } from "../../server/core/shareLinks";
import { readSharedSet } from "../../server/shareLinks";

export default publicHandler(async (viewer, body) => {
  const id = parseSharedSetRequest(body);
  if (!id) return { status: 404, body: { error: "not-found" } };
  return readSharedSet(id, viewer);
});
