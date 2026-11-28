// Сообщение в поддержку отправляет сервер (server/support.ts): токен бота в браузер не попадает
import type { PresetReport, SupportTopic } from "../../server/core/support";
import { ApiError, post } from "./http";

export type { PresetReport, SupportTopic };

// ok — отправлено; limit — на сегодня лимит сообщений исчерпан (server/core/access.ts → supportLimit);
// failed — не отправилось (нет сети, сервер или Telegram недоступны).
// preset — ошибка в карточке готового набора (docs/specs/05-ready-sets.md, «Ошибки в наборах»)
export type SupportResult = "ok" | "limit" | "failed";
export const sendSupport = (topic: SupportTopic, message: string, reply: boolean, preset?: PresetReport): Promise<SupportResult> =>
  post<{ ok: true }>("/api/support", preset ? { topic, message, reply, preset } : { topic, message, reply }).then(
    () => "ok" as const,
    (err) => (err instanceof ApiError && err.status === 429 ? "limit" : "failed"),
  );
