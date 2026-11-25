import { describe, expect, it } from "vitest";
import { pickLanguage, startLanguage } from "./languages";
import { languageForTimeZone } from "./regionLanguages";

describe("pickLanguage: язык при первом заходе", () => {
  it("английский браузер — решает страна", () => {
    expect(pickLanguage(["en-US", "en"], "Europe/Oslo")).toBe("no");
    expect(pickLanguage(["en-GB"], "Europe/Kyiv")).toBe("uk");
    expect(pickLanguage(["en"], "America/Sao_Paulo")).toBe("pt-BR");
    expect(pickLanguage(["en"], "Europe/Zurich")).toBe("de");
  });

  it("страны, языка которой нет, — английский", () => {
    expect(pickLanguage(["en-US"], "Europe/Warsaw")).toBe("en");
    expect(pickLanguage(["en-US"], "America/New_York")).toBe("en");
    expect(pickLanguage(["pl-PL", "pl"], "Europe/Warsaw")).toBe("en");
  });

  it("браузер на одном из наших языков, кроме английского, важнее страны", () => {
    expect(pickLanguage(["uk-UA", "en"], "Europe/Oslo")).toBe("uk");
    expect(pickLanguage(["ru"], "Europe/Berlin")).toBe("ru");
    expect(pickLanguage(["nb-NO"], "America/New_York")).toBe("no");
    expect(pickLanguage(["pt-PT"], "Europe/Paris")).toBe("pt-BR");
  });

  it("неизвестный язык браузера пропускаем и смотрим следующий", () => {
    expect(pickLanguage(["pl-PL", "de"], "Europe/Oslo")).toBe("de");
    expect(pickLanguage(["pl-PL", "en"], "Europe/Oslo")).toBe("no");
  });

  it("без пояса и без языков браузера — английский", () => {
    expect(pickLanguage([], undefined)).toBe("en");
    expect(pickLanguage(["en"], undefined)).toBe("en");
    expect(pickLanguage([], "Europe/Madrid")).toBe("es");
  });
});

describe("startLanguage: язык при запуске", () => {
  const device = { browserTags: ["en-US", "en"], timeZone: "Europe/Oslo" };

  it("выбранный язык важнее всего", () => {
    expect(startLanguage({ ...device, saved: "uk", returning: false })).toBe("uk");
  });

  it("новичок без выбора — по стране", () => {
    expect(startLanguage({ ...device, saved: null, returning: false })).toBe("no");
  });

  it("кто пользовался Kolo до 0.4.1 и язык не выбирал, остаётся на языке браузера", () => {
    expect(startLanguage({ ...device, saved: null, returning: true })).toBe("en");
    expect(startLanguage({ browserTags: ["pl-PL"], timeZone: "Europe/Oslo", saved: null, returning: true })).toBe("en");
    expect(startLanguage({ browserTags: ["ru-RU"], timeZone: "Europe/Oslo", saved: null, returning: true })).toBe("ru");
  });

  it("незнакомое сохранённое значение не считается выбором", () => {
    expect(startLanguage({ ...device, saved: "xx", returning: false })).toBe("no");
  });
});

describe("languageForTimeZone", () => {
  it("знает и старые, и новые имена поясов", () => {
    expect(languageForTimeZone("Europe/Kiev")).toBe("uk");
    expect(languageForTimeZone("Europe/Kyiv")).toBe("uk");
    expect(languageForTimeZone("America/Buenos_Aires")).toBe("es");
    expect(languageForTimeZone("America/Argentina/Buenos_Aires")).toBe("es");
  });

  it("русский — там, где он официальный", () => {
    expect(languageForTimeZone("Europe/Moscow")).toBe("ru");
    expect(languageForTimeZone("Europe/Minsk")).toBe("ru");
    expect(languageForTimeZone("Asia/Almaty")).toBe("ru");
    expect(languageForTimeZone("Asia/Tashkent")).toBeUndefined();
  });
});
