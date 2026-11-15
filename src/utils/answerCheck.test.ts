import { describe, expect, it } from "vitest";
import { answerVariants, checkAnswer, spellingDiff, canAddVariant, withVariant } from "./answerCheck";

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

// Ответ пользователя: [не та буква], (лишняя), _ пропуск; правильное написание: [исправленные буквы]
const diff = (input: string, expected: string) => {
  const { typed, fixed } = spellingDiff(input, expected);
  const show = (parts: typeof typed) =>
    parts.map((p) => (p.mark === "same" ? p.text : p.mark === "extra" ? `(${p.text})` : p.mark === "missing" ? "_" : `[${p.text}]`)).join("");
  return `${show(typed)} → ${show(fixed)}`;
};

describe("spellingDiff", () => {
  it("пропущенная, лишняя и не та буква", () => {
    expect(diff("kjøken", "kjøkken")).toBe("kjø_ken → kjø[k]ken");
    expect(diff("huus", "hus")).toBe("h(u)us → hus"); // какая из двух «u» лишняя — неважно
    expect(diff("bok", "bak")).toBe("b[o]k → b[a]k");
  });

  it("перестановка — одна ошибка из двух букв", () => {
    expect(diff("vinude", "vindue")).toBe("vin[ud]e → vin[du]e");
  });

  it("диакритика подсвечивается, регистр — нет", () => {
    expect(diff("smorbrod", "smørbrød")).toBe("sm[o]rbr[o]d → sm[ø]rbr[ø]d");
    expect(diff("haus", "Haus")).toBe("haus → Haus");
  });

  it("артикль: пропущенный и лишний", () => {
    expect(diff("bil", "en bil")).toBe("_bil → [en ]bil");
    expect(diff("der hund", "Hund")).toBe("(der )hund → Hund");
  });
});

describe("где ошибка: вариант для сравнения", () => {
  it("«почти» — с вариантом, который совпал, в написании карточки", () => {
    expect(checkAnswer("kjøken", "kjøkken")).toEqual({ result: "close", reason: "typo", expected: "kjøkken" });
    expect(checkAnswer("haus", "das Haus")).toEqual({ result: "close", reason: "article", expected: "das Haus" });
    expect(checkAnswer("sprnit", "run, sprint")).toEqual({ result: "close", reason: "typo", expected: "sprint" });
  });

  it("небольшой промах в неверном ответе тоже показываем; другое слово — нет", () => {
    expect(checkAnswer("hsu", "hus")).toEqual({ result: "wrong", expected: "hus" });
    expect(checkAnswer("ei bil", "en bil")).toEqual({ result: "wrong", expected: "en bil" });
    expect(checkAnswer("katt", "hund")).toEqual({ result: "wrong", expected: undefined });
    expect(checkAnswer("ja", "nei")).toEqual({ result: "wrong", expected: undefined });
  });
});

describe("«Добавить в карточку» вместо «Мой ответ верный»", () => {
  const others = ["glad", "hus", "bil"];

  it("предлагаем только для другого слова: не опечатка и не слово другой карточки", () => {
    expect(canAddVariant("lykkelig", checkAnswer("lykkelig", "glad", others), others)).toBe(true);
    expect(canAddVariant("gald", checkAnswer("gald", "glad", others), others)).toBe(false); // почти — засчитано
    expect(canAddVariant("hus", checkAnswer("hus", "glad", others), others)).toBe(false); // слово другой карточки
    expect(canAddVariant("", checkAnswer("", "glad", others), others)).toBe(false); // «Не помню»
    expect(canAddVariant("glad", checkAnswer("glad", "glad", others), others)).toBe(false); // и так верно
  });

  it("вариант дописывается в слово, и со следующего раза проверка его принимает", () => {
    const word = withVariant("glad", "  lykkelig! ");
    expect(word).toBe("glad / lykkelig");
    expect(checkAnswer("lykkelig", word).result).toBe("exact");
    expect(checkAnswer("glad", word).result).toBe("exact");
  });
});
