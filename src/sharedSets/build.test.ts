import { describe, expect, it } from "vitest";
import { isNewCard } from "../utils/srs";
import { buildSharedCollection, sharedSetCourse, sharedSetVoice } from "./build";
import type { SharedSet } from "../../server/core/shareLinks";

const set: SharedSet = {
  name: "Kjøkken",
  course: "nb",
  voice: "nb-NO",
  cards: [
    { word: "kniv", translation: "нож", explanation: "", example: "Kniven er skarp.", partOfSpeech: "noun" },
    { word: "gaffel", translation: "вилка", explanation: "", example: "", partOfSpeech: "noun" },
  ],
};
const now = new Date("2026-11-27T10:00:00Z");

describe("buildSharedCollection", () => {
  it("свой набор с чистым расписанием и отметкой, откуда он", () => {
    const col = buildSharedCollection(set, { shareId: "abcDEF123456", courseId: "nb", voice: "nb-NO", now });
    expect(col).toMatchObject({ name: "Kjøkken", language: "nb-NO", courseId: "nb", sharedFrom: "abcDEF123456" });
    expect(col.folderId).toBeUndefined();
    expect(col.cards.map((c) => [c.word, c.translation, c.example])).toEqual([
      ["kniv", "нож", "Kniven er skarp."],
      ["gaffel", "вилка", ""],
    ]);
    expect(col.cards.every(isNewCard)).toBe(true);
  });

  it("новые id и слова по порядку автора", () => {
    const a = buildSharedCollection(set, { shareId: "abcDEF123456", courseId: "nb", voice: "nb-NO", now });
    const b = buildSharedCollection(set, { shareId: "abcDEF123456", courseId: "nb", voice: "nb-NO", now });
    expect(a.id).not.toBe(b.id);
    expect(new Set([...a.cards, ...b.cards].map((c) => c.id)).size).toBe(4);
    expect(a.cards.map((c) => c.createdAt.getTime() - now.getTime())).toEqual([0, 1]);
  });
});

describe("sharedSetCourse", () => {
  it("курс набора, а у старых наборов — по языку озвучки", () => {
    expect(sharedSetCourse({ course: "nb", voice: "nb-NO" })).toBe("nb");
    expect(sharedSetCourse({ course: null, voice: "en-GB" })).toBe("en");
    expect(sharedSetCourse({ course: null, voice: "pt-BR" })).toBe("pt");
    expect(sharedSetCourse({ course: "klingon", voice: "de-DE" })).toBe("de");
    expect(sharedSetCourse({ course: null, voice: "" })).toBe("nb");
    expect(sharedSetCourse({ course: null, voice: "xx-YY" })).toBeNull();
  });
});

describe("sharedSetVoice", () => {
  it("голос автора, только если это вариант того же курса", () => {
    expect(sharedSetVoice({ voice: "en-GB" }, "en")).toBe("en-GB");
    expect(sharedSetVoice({ voice: "de-DE" }, "en")).toBeUndefined();
  });
});
