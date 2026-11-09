import { describe, expect, it } from "vitest";
import { MESSAGE_MAX, parseSupport, supportText } from "./support";

describe("поддержка", () => {
  it("принимает тему, сообщение и флаг ответа; сообщение без пробелов по краям", () => {
    expect(parseSupport({ topic: "idea", message: "  Тёмная тема для карточек \n", reply: true })).toEqual({
      ok: true,
      input: { topic: "idea", message: "Тёмная тема для карточек", reply: true },
    });
  });
  it("отклоняет неизвестную тему, пустое или слишком длинное сообщение, флаг не того типа", () => {
    expect(parseSupport(null)).toEqual({ ok: false, reason: "body" });
    expect(parseSupport({ topic: "bug", message: "x", reply: true })).toEqual({ ok: false, reason: "topic" });
    expect(parseSupport({ topic: "problem", message: "   ", reply: true })).toEqual({ ok: false, reason: "message" });
    expect(parseSupport({ topic: "problem", message: "x".repeat(MESSAGE_MAX + 1), reply: true })).toEqual({ ok: false, reason: "message" });
    expect(parseSupport({ topic: "problem", message: "x", reply: "yes" })).toEqual({ ok: false, reason: "reply" });
  });
  it("текст для команды: тема по-английски, почта аккаунта, символы разметки как есть", () => {
    const text = supportText({ topic: "problem", message: "Не открывается *набор* user_1", reply: true }, "a_b@example.com");
    expect(text).toBe("Support · Problem\nFrom: a_b@example.com\nReply: yes\n\nНе открывается *набор* user_1");
  });
  it("без почты ответить некуда — даже если просили", () => {
    expect(supportText({ topic: "question", message: "?", reply: true }, null)).toContain("From: unknown\nReply: not needed");
  });
});
