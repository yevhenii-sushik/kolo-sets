// Общая обвязка HTTP для функций: проверка токена Firebase и ответы JSON
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./admin";
import { isAdminClaims } from "./core/admin";

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

// Проверенный токен из «Authorization: Bearer <Firebase ID token>»; null — токена нет или он недействителен.
// checkRevoked — ещё и не отозваны ли сессии (лишний запрос к Auth, поэтому только для админских функций)
async function verifiedToken(req: Request, checkRevoked = false): Promise<DecodedIdToken | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    return await adminAuth().verifyIdToken(token, checkRevoked);
  } catch {
    return null;
  }
}

export async function uidFrom(req: Request): Promise<string | null> {
  return (await verifiedToken(req))?.uid ?? null;
}

type Run<Who> = (who: Who, body: unknown) => Promise<{ status: number; body: unknown }>;

// POST + проверка доступа + разбор тела + обработка ошибок — одинаково для всех функций
function wrap<Who>(identify: (req: Request) => Promise<Who | Response>, run: Run<Who>) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return json(405, { error: "method" });
    const who = await identify(req);
    if (who instanceof Response) return who;
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    try {
      const reply = await run(who, body);
      return json(reply.status, reply.body);
    } catch (err) {
      console.error("[api] failed", err);
      return json(500, { error: "internal" });
    }
  };
}

export function handler(run: Run<string>) {
  return wrap(async (req) => (await uidFrom(req)) ?? json(401, { error: "unauthorized" }), run);
}

// Админские функции (docs/specs/admin.md): claim admin в токене; снятые права действуют сразу,
// потому что скрипт выдачи прав отзывает сессии, а здесь проверяется отзыв
export function adminHandler(run: Run<string>) {
  return wrap(async (req) => {
    const token = await verifiedToken(req, true);
    if (!token) return json(401, { error: "unauthorized" });
    if (!isAdminClaims(token)) return json(403, { error: "forbidden" });
    return token.uid;
  }, run);
}
