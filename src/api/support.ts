// Сообщение в поддержку отправляет сервер (server/support.ts): токен бота в браузер не попадает
import type { SupportTopic } from "../../server/core/support";
import { post } from "./http";

export type { SupportTopic };

// false — не отправилось (нет сети, сервер или Telegram недоступны)
export const sendSupport = (topic: SupportTopic, message: string, reply: boolean) =>
  post<{ ok: true }>("/api/support", { topic, message, reply }).then(
    () => true,
    () => false,
  );
