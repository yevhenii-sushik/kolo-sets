// Общая обвязка HTTP для функций: проверка токена Firebase и ответы JSON
import { adminAuth } from "./admin";

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

// uid из «Authorization: Bearer <Firebase ID token>»; null — токена нет или он недействителен
export async function uidFrom(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  try {
    return (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    return null;
  }
}

// POST + проверка токена + обработка ошибок — одинаково для всех функций
export function handler(run: (uid: string, body: unknown) => Promise<{ status: number; body: unknown }>) {
  return async (req: Request): Promise<Response> => {
    if (req.method !== "POST") return json(405, { error: "method" });
    const uid = await uidFrom(req);
    if (!uid) return json(401, { error: "unauthorized" });
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    try {
      const reply = await run(uid, body);
      return json(reply.status, reply.body);
    } catch (err) {
      console.error("[api] failed", err);
      return json(500, { error: "internal" });
    }
  };
}
