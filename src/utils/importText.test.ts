import { describe, expect, it } from "vitest";
import { parseImportText, splitLine } from "./importText";

describe("splitLine", () => {
  it("табуляция — так вставляется из Excel, Google Таблиц, Quizlet и Anki", () => {
    expect(splitLine("hund\tсобака")).toEqual(["hund", "собака"]);
  });

  it("точка с запятой — прежний формат со всеми полями", () => {
    expect(splitLine("skrive; писать; å uttrykke tanker; Jeg skriver en bok; verb")).toEqual([
      "skrive",
      "писать",
      "å uttrykke tanker",
      "Jeg skriver en bok",
      "verb",
    ]);
  });

  it("тире с пробелами и знак равенства", () => {
    expect(splitLine("hund — собака")).toEqual(["hund", "собака"]);
    expect(splitLine("hund – собака")).toEqual(["hund", "собака"]);
    expect(splitLine("hund - собака")).toEqual(["hund", "собака"]);
    expect(splitLine("hund = собака")).toEqual(["hund", "собака"]);
    expect(splitLine("hund=собака")).toEqual(["hund", "собака"]);
  });

  it("дефис без пробелов не делит: e-mail и составные слова целы", () => {
    expect(splitLine("e-mail")).toBeNull();
    expect(splitLine("e-post - электронная почта")).toEqual(["e-post", "электронная почта"]);
  });

  it("табуляция побеждает «;» и тире внутри примера", () => {
    expect(splitLine("skrive\tписать\t\tJeg skriver; du leser - vi ser")).toEqual(["skrive", "писать", "", "Jeg skriver; du leser - vi ser"]);
  });

  it("поля в кавычках из CSV", () => {
    expect(splitLine('"hund";"собака"')).toEqual(["hund", "собака"]);
  });

  it("запятая — не разделитель: перевод может быть через запятую", () => {
    expect(splitLine("skrive, писать")).toBeNull();
    expect(splitLine("skrive; писать, записывать")).toEqual(["skrive", "писать, записывать"]);
  });
});

describe("parseImportText", () => {
  it("смешанные разделители, пустые строки и окончания строк Windows", () => {
    const res = parseImportText("hund\tсобака\r\n\r\nkatt; кошка\nhus — дом\n");
    expect(res.words.map((w) => [w.word, w.translation])).toEqual([
      ["hund", "собака"],
      ["katt", "кошка"],
      ["hus", "дом"],
    ]);
    expect(res.skipped).toEqual([]);
  });

  it("строки без перевода — в пропущенные с номером строки", () => {
    const res = parseImportText("hund\tсобака\nkatt\n\nhus;");
    expect(res.words).toHaveLength(1);
    expect(res.skipped).toEqual([
      { line: 2, text: "katt" },
      { line: 4, text: "hus;" },
    ]);
  });

  it("служебные строки Anki пропускаются молча", () => {
    const res = parseImportText("#separator:tab\n#html:false\nhund\tсобака");
    expect(res.words).toHaveLength(1);
    expect(res.skipped).toEqual([]);
  });

  it("дубль — то же слово с тем же переводом, в наборе или выше в списке; регистр и пробелы не важны", () => {
    const res = parseImportText("Hund\tсобака\nhund\t Собака \nbank\tберег\nkatt\tкошка", [
      { word: "bank", translation: "банк" },
      { word: "katt", translation: "кошка" },
    ]);
    // «bank — берег» не дубль «bank — банк»: другое значение
    expect(res.words.map((w) => w.word)).toEqual(["Hund", "bank"]);
    expect(res.duplicates.map((d) => d.line)).toEqual([2, 4]);
  });

  it("диакритика различает слова", () => {
    const res = parseImportText("for\tдля\nfør\tдо", [{ word: "for", translation: "для" }]);
    expect(res.words.map((w) => w.word)).toEqual(["før"]);
  });

  it("лишние столбцы (например, теги Anki) не мешают", () => {
    const res = parseImportText("hund\tсобака\tdyr\tHunden sover\tsubstantiv\ttag1 tag2");
    expect(res.words[0]).toEqual({ word: "hund", translation: "собака", explanation: "dyr", example: "Hunden sover", partOfSpeech: "substantiv" });
  });

  it("ничего не распознано — пустой список слов, все строки в пропущенных", () => {
    const res = parseImportText("просто текст\nещё строка");
    expect(res.words).toEqual([]);
    expect(res.skipped).toHaveLength(2);
  });
});
