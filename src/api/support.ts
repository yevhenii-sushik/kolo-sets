// Сообщение в поддержку отправляет сервер (server/support.ts): токен бота в браузер не попадает
import type { PresetReport, SupportTopic } from "../../server/core/support";
import { post } from "./http";

export type { PresetReport, SupportTopic };

// false — не отправилось (нет сети, сервер или Telegram недоступны).
// preset — ошибка в карточке готового набора (docs/specs/05-ready-sets.md, «Ошибки в наборах»)
export const sendSupport = (topic: SupportTopic, message: string, reply: boolean, preset?: PresetReport) =>
  post<{ ok: true }>("/api/support", preset ? { topic, message, reply, preset } : { topic, message, reply }).then(
    () => true,
    () => false,
  );
