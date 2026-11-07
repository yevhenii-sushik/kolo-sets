// POST /api/orbit-goal — цель недели (docs/specs/02-progression.md)
import { handler } from "../../server/http";
import { GOAL_MAX, GOAL_MIN } from "../../server/core/orbit";
import { setOrbitGoal } from "../../server/progress";

export default handler(async (uid, body) => {
  const b = (body ?? {}) as { goal?: unknown; timezone?: unknown };
  const goal = b.goal;
  if (typeof goal !== "number" || !Number.isInteger(goal) || goal < GOAL_MIN || goal > GOAL_MAX)
    return { status: 400, body: { error: "bad-request", field: "goal" } };
  return setOrbitGoal(uid, goal, b.timezone);
});
