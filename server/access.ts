// Кто вызывает функцию: проба, почта без подтверждения, подтверждённый (правило — server/core/access.ts).
// Способ входа и подтверждение почты есть в токене; дату создания аккаунта спрашиваем у Auth только
// у неподтверждённой почты — ей важно, идёт ли ещё неделя и не старый ли это аккаунт
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./admin";
import { standing, type Standing } from "./core/access";

const iso = (s: string | undefined | null) => {
  const t = s ? Date.parse(s) : NaN;
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};

export async function standingOf(token: DecodedIdToken, now = new Date()): Promise<Standing> {
  const provider = token.firebase?.sign_in_provider ?? null;
  const emailVerified = token.email_verified === true;
  if (provider !== "password" || emailVerified) return standing({ provider, emailVerified, createdAt: null }, now);
  const user = await adminAuth().getUser(token.uid);
  return standing({ provider, emailVerified: user.emailVerified, createdAt: iso(user.metadata.creationTime) }, now);
}
