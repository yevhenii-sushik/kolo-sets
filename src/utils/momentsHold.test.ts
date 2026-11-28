import { describe, expect, it } from "vitest";
import { isStudyPath } from "./momentsHold";

describe("isStudyPath", () => {
  it("тренировки — да", () => {
    expect(isStudyPath("/learn")).toBe(true);
    expect(isStudyPath("/collection/abc/flashcards")).toBe(true);
    expect(isStudyPath("/collection/abc/quiz")).toBe(true);
    expect(isStudyPath("/collection/abc/speed")).toBe(true);
  });
  it("остальные экраны — нет", () => {
    expect(isStudyPath("/")).toBe(false);
    expect(isStudyPath("/collection/abc/edit")).toBe(false);
    expect(isStudyPath("/rewards")).toBe(false);
    expect(isStudyPath("/learning")).toBe(false);
  });
});
