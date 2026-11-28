// Плановая функция Netlify, раз в сутки: удалить пробные аккаунты, которые 30 дней не открывали
// (шаг 16 в docs/specs/06-audit-fixes.md). По адресу её не вызвать — Netlify запускает её только по расписанию
// и только на опубликованной выкладке (не на превью)
import { cleanupTrials } from "../../server/trial";

export default async () => {
  try {
    const result = await cleanupTrials();
    console.log("[trial-cleanup]", JSON.stringify(result));
  } catch (err) {
    console.error("[trial-cleanup] failed", err);
  }
};

export const config = { schedule: "@daily" };
