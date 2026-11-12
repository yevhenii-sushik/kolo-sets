import { describe, expect, it } from "vitest";
import { blankExample } from "./cloze";

const blank = (word: string, example: string) => {
  const c = blankExample({ word, example });
  return c ? `${c.before}[${c.answer}]${c.after}` : null;
};

describe("blankExample", () => {
  it("точное совпадение, без учёта регистра", () => {
    expect(blank("bil", "Bil er dyr.")).toBe("[Bil] er dyr.");
    expect(blank("hus", "Vi har et stort hus.")).toBe("Vi har et stort [hus].");
  });

  it("другая форма слова и слово с артиклем или частицей", () => {
    expect(blank("hus", "Huset er gammelt.")).toBe("[Huset] er gammelt.");
    expect(blank("å spise", "Jeg spiser frokost.")).toBe("Jeg [spiser] frokost.");
    expect(blank("en bil", "Bilen står ute.")).toBe("[Bilen] står ute.");
  });

  it("фраза — только целиком", () => {
    expect(blank("ta seg sammen", "Du må ta deg sammen.")).toBeNull();
    expect(blank("god morgen", "God morgen, alle sammen!")).toBe("[God morgen], alle sammen!");
  });

  it("сомнения — без пропуска", () => {
    expect(blank("hus", "")).toBeNull();
    expect(blank("bok", "Han leser.")).toBeNull();
    expect(blank("spise", "Vi spiser og spiste.")).toBeNull(); // два кандидата
    expect(blank("a", "a b c")).toBeNull(); // слишком короткое
  });
});
