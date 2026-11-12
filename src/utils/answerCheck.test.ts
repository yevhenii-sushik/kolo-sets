import { describe, expect, it } from "vitest";
import { answerVariants, checkAnswer } from "./answerCheck";

const result = (input: string, correct: string, others?: string[]) => {
  const v = checkAnswer(input, correct, others);
  return v.result === "close" ? `close:${v.reason}` : v.result;
};

describe("checkAnswer", () => {
  it("регистр, пробелы и знаки препинания не важны", () => {
    expect(result("  Bil. ", "bil")).toBe("exact");
    expect(result("que tal", "¿Qué tal?")).toBe("close:accents");
    expect(result("yes please", "yes, please")).toBe("exact");
    expect(result("l’homme", "l'homme")).toBe("exact");
  });

  it("принимает любой из вариантов и формы со скобками", () => {
    expect(result("auto", "bil, auto")).toBe("exact");
    expect(result("bil", "bil; auto")).toBe("exact");
    expect(result("run", "(to) run")).toBe("exact");
    expect(result("to run", "(to) run")).toBe("exact");
  });

  it("забытый или лишний артикль — почти", () => {
    expect(result("gå", "å gå")).toBe("close:article");
    expect(result("bil", "en bil")).toBe("close:article");
    expect(result("der hund", "Hund")).toBe("close:article");
    expect(result("homme", "l'homme")).toBe("close:article");
  });

  it("другой артикль — ошибка", () => {
    expect(result("ei bil", "en bil")).toBe("wrong");
  });

  it("диакритика и особые буквы — почти", () => {
    expect(result("smorbrod", "smørbrød")).toBe("close:accents");
    expect(result("strasse", "Straße")).toBe("close:accents");
    expect(result("ga", "å gå")).toBe("close:accents");
  });

  it("опечатки: одна в словах от 4 букв, две — от 8", () => {
    expect(result("kjøken", "kjøkken")).toBe("close:typo");
    expect(result("hsu", "hus")).toBe("wrong"); // короткое слово — без поблажек
    expect(result("vinude", "vindue")).toBe("close:typo"); // перестановка
    expect(result("forstaelse", "forståelse")).toBe("close:accents");
    expect(result("forstaesle", "forståelse")).toBe("close:typo");
    expect(result("frstaesl", "forståelse")).toBe("wrong");
  });

  it("другое слово из набора — ошибка, даже если похоже", () => {
    expect(result("hand", "hund", ["hand", "katt"])).toBe("wrong");
    expect(result("hund", "hund", ["hund"])).toBe("exact");
  });

  it("пустой ответ — ошибка", () => {
    expect(result("  ", "bil")).toBe("wrong");
  });
});

describe("answerVariants", () => {
  it("целиком и по частям", () => {
    expect(answerVariants("bil, auto")).toEqual(["bil auto", "bil", "auto"]);
  });
});
