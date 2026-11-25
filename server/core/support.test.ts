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
  it("ошибка в готовом наборе: набор, версия, карточка и язык перевода — в шапке для команды", () => {
    const preset = { set: "nb-a1-food", version: 2, card: "brod", lang: "ru", word: " et brød ", translation: "хлеб" };
    const parsed = parseSupport({ topic: "problem", message: "Пример с ошибкой", reply: false, preset });
    expect(parsed).toEqual({
      ok: true,
      input: { topic: "problem", message: "Пример с ошибкой", reply: false, preset: { ...preset, word: "et brød" } },
    });
    if (!parsed.ok) return;
    expect(supportText(parsed.input, "a@example.com")).toBe(
      "Support · Ready-set mistake\nFrom: a@example.com\nReply: not needed\n" +
        "Set: nb-a1-food v2 · translation: ru\nCard: brod · et brød — хлеб\n\nПример с ошибкой",
    );
  });
  it("ссылка на набор проверяется: id без лишних символов, целая версия, слово не пустое", () => {
    const ok = { set: "nb-a1-food", version: 1, card: "brod", lang: "pt-BR", word: "et brød", translation: "" };
    const bad = (preset: unknown) => parseSupport({ topic: "problem", message: "x", reply: false, preset });
    expect(bad(ok).ok).toBe(true);
    expect(bad(null)).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, set: "nb/../a1" })).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, card: "" })).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, version: 1.5 })).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, lang: "ru\nFrom: x" })).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, word: "  " })).toEqual({ ok: false, reason: "preset" });
    expect(bad({ ...ok, translation: "x".repeat(201) })).toEqual({ ok: false, reason: "preset" });
  });
  it("без почты ответить некуда — даже если просили", () => {
    expect(supportText({ topic: "question", message: "?", reply: true }, null)).toContain("From: unknown\nReply: not needed");
  });
});
