import { describe, expect, it } from "vitest";
import { clampLines, wrapText } from "./wrapText";

// Моноширинная мерка: каждый символ — 1
const mono = (s: string) => Array.from(s).length;

describe("wrapText", () => {
  it("переносит по пробелам, не оставляя пробелов по краям строк", () => {
    expect(wrapText("en liten hund og en stor katt", 10, mono)).toEqual(["en liten", "hund og en", "stor katt"]);
  });

  it("схлопывает переводы строк и двойные пробелы", () => {
    expect(wrapText("  hei\n\n  på   deg ", 20, mono)).toEqual(["hei på deg"]);
  });

  it("режет по символам слово, которое не влезает целиком", () => {
    expect(wrapText("arbeidsmiljøloven er lang", 8, mono)).toEqual(["arbeidsm", "iljølove", "n er", "lang"]);
  });

  it("переносит текст без пробелов (японский)", () => {
    expect(wrapText("今日はいい天気ですね", 4, mono)).toEqual(["今日はい", "い天気で", "すね"]);
  });

  it("не разрывает эмодзи из двух половинок", () => {
    expect(wrapText("😀😀😀", 2, mono)).toEqual(["😀😀", "😀"]);
  });

  it("пустой текст — ни одной строки", () => {
    expect(wrapText("   ", 10, mono)).toEqual([]);
  });
});

describe("clampLines", () => {
  it("оставляет строки как есть, если их не больше лимита", () => {
    expect(clampLines(["a", "b"], 2, 10, mono)).toEqual(["a", "b"]);
  });

  it("обрезает лишние строки и ставит многоточие, укладываясь в ширину", () => {
    expect(clampLines(["en liten", "hund og en", "stor katt"], 2, 10, mono)).toEqual(["en liten", "hund og e…"]);
  });
});
