// Запрос к серверным функциям /api/*: POST с токеном Firebase, ответ — JSON
import { auth } from "../firebase/config";

export class ApiError extends Error {
  constructor(public status: number) {
    super(`api ${status}`);
  }
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new ApiError(401);
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json() as Promise<T>;
}
