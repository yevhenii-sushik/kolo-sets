import { describe, expect, it } from "vitest";
import { isShareId, makeShareId, parseSharedSetRequest, parseShareLink, publicSet, SHARE_ID_LENGTH } from "./shareLinks";
import { randomBytes } from "node:crypto";

describe("makeShareId", () => {
  it("даёт 12 букв и цифр", () => {
    for (let i = 0; i < 200; i++) {
      const id = makeShareId((n) => randomBytes(n));
      expect(id).toHaveLength(SHARE_ID_LENGTH);
      expect(isShareId(id)).toBe(true);
    }
  });

  it("отбрасывает байты от 248, а не сворачивает их в начало алфавита", () => {
    // Сначала одни «плохие» байты, потом нули — id из одних «A», и цикл не зависает
    let call = 0;
    const id = makeShareId((n) => new Uint8Array(n).fill(call++ === 0 ? 250 : 0));
    expect(id).toBe("AAAAAAAAAAAA");
  });

  it("берёт буквы по модулю 62", () => {
    const id = makeShareId((n) => Uint8Array.from({ length: n }, (_, i) => 61 + i * 62));
    // 61 → '9', 123 → '9', 185 → '9', 247 → '9', 309 & 255 = 53 → '1'…
    expect(id.startsWith("9999")).toBe(true);
  });
});

describe("isShareId", () => {
  it("принимает только 12 латинских букв и цифр", () => {
    expect(isShareId("abcDEF123456")).toBe(true);
    expect(isShareId("abcDEF12345")).toBe(false);
    expect(isShareId("abcDEF1234567")).toBe(false);
    expect(isShareId("abcDEF12345/")).toBe(false);
    expect(isShareId("../users/xxx")).toBe(false);
    expect(isShareId(123)).toBe(false);
  });
});

describe("parseShareLink", () => {
  it("разбирает действие и набор", () => {
    expect(parseShareLink({ action: "create", collectionId: "7f1c-uuid" })).toEqual({ action: "create", collectionId: "7f1c-uuid" });
    expect(parseShareLink({ action: "status", collectionId: "1700000000000" })).toEqual({ action: "status", collectionId: "1700000000000" });
    // Импорт из JSON сохраняет id как в файле
    expect(parseShareLink({ action: "status", collectionId: "my set.v2" })?.collectionId).toBe("my set.v2");
  });

  it("отклоняет неизвестное действие и путь вместо id", () => {
    expect(parseShareLink({ action: "delete", collectionId: "a" })).toBeNull();
    expect(parseShareLink({ action: "create", collectionId: "a/b" })).toBeNull();
    expect(parseShareLink({ action: "create", collectionId: "" })).toBeNull();
    expect(parseShareLink({ action: "create", collectionId: ".." })).toBeNull();
    expect(parseShareLink({ action: "create", collectionId: "x".repeat(257) })).toBeNull();
    expect(parseShareLink({ action: "create" })).toBeNull();
    expect(parseShareLink(null)).toBeNull();
  });
});

describe("parseSharedSetRequest", () => {
  it("берёт только правильный id", () => {
    expect(parseSharedSetRequest({ id: "abcDEF123456" })).toBe("abcDEF123456");
    expect(parseSharedSetRequest({ id: "nope" })).toBeNull();
    expect(parseSharedSetRequest(null)).toBeNull();
  });
});

describe("publicSet", () => {
  const doc = {
    id: "set-1",
    name: "Kjøkken",
    language: "nb-NO",
    courseId: "nb",
    folderId: "folder-1",
    isFavorite: true,
    cards: [
      {
        id: "c1",
        word: "kniv",
        translation: "нож",
        explanation: "brukes til å skjære",
        example: "Kniven er skarp.",
        partOfSpeech: "noun",
        srsData: { interval: 12, repetitions: 4 },
        presetCardId: "p1",
      },
      { id: "c2", word: "  ", translation: "" },
      { id: "c3", word: "gaffel" },
    ],
  };

  it("отдаёт слова без расписания, id и данных владельца", () => {
    expect(publicSet(doc)).toEqual({
      name: "Kjøkken",
      course: "nb",
      voice: "nb-NO",
      cards: [
        { word: "kniv", translation: "нож", explanation: "brukes til å skjære", example: "Kniven er skarp.", partOfSpeech: "noun" },
        { word: "gaffel", translation: "", explanation: "", example: "", partOfSpeech: "" },
      ],
    });
  });

  it("старый набор без курса и без карточек", () => {
    expect(publicSet({ name: "Old", language: "en-US" })).toEqual({ name: "Old", course: null, voice: "en-US", cards: [] });
  });
});
