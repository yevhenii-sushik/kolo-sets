import { describe, expect, it } from "vitest";
import { DEFAULT_FLASH_PREFS, parseFlashPrefs, pickReverse } from "./flashPrefs";

describe("настройки флэшкарт", () => {
  it("сохранённое читается, мусор — по умолчанию", () => {
    expect(parseFlashPrefs(JSON.stringify({ direction: "reverse", shuffle: true, speak: false }))).toEqual({ direction: "reverse", shuffle: true, speak: false });
    expect(parseFlashPrefs(JSON.stringify({ direction: "sideways", shuffle: "yes" }))).toEqual(DEFAULT_FLASH_PREFS);
    expect(parseFlashPrefs("{bad")).toEqual(DEFAULT_FLASH_PREFS);
    expect(parseFlashPrefs(null)).toEqual(DEFAULT_FLASH_PREFS);
  });

  it("сторона карточки по направлению", () => {
    expect(pickReverse("forward", () => 0)).toBe(false);
    expect(pickReverse("reverse", () => 0.99)).toBe(true);
    expect(pickReverse("mixed", () => 0.2)).toBe(true);
    expect(pickReverse("mixed", () => 0.7)).toBe(false);
  });
});
