import { describe, expect, it } from "vitest";
import { Card, TaskType } from "../types";
import { buildQuestions, isSetPassed, isTyping, pickQuizCards, portionSize, questionFor, recordHistory, setProgress, streakPitch, synonymsOf } from "./plan";
import { parseChecks, parseHistory, parseQuizPrefs } from "./storage";
import { DEFAULT_QUIZ_SETTINGS } from "./plan";

const NOW = new Date(2026, 10, 15, 12);
const day = (offset: number) => new Date(2026, 10, 15 + offset, 12);

const card = (id: string, over: Partial<Card> = {}): Card => ({
  id,
  word: `w-${id}`,
  translation: `t-${id}`,
  explanation: "",
  example: "",
  partOfSpeech: "",
  createdAt: new Date(2026, 10, 1),
  srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: new Date(2026, 10, 1) },
  ...over,
});
// Выученное слово: интервал в днях, повтор через offset дней (отрицательный — просрочено)
const studied = (id: string, interval: number, offset: number, over: Partial<Card> = {}) =>
  card(id, { srsData: { easinessFactor: 2.5, interval, repetitions: 2, nextReview: day(offset), lastReviewed: day(offset - interval) }, ...over });

const set = (n: number) => Array.from({ length: n }, (_, i) => card(`c${i}`));

describe("portionSize", () => {
  it("длина теста, короткий хвост — вместе с ним", () => {
    expect(portionSize(300, 20)).toBe(20);
    expect(portionSize(23, 20)).toBe(23); // хвост из 3 не отдельный тест
    expect(portionSize(25, 20)).toBe(20);
    expect(portionSize(12, 10)).toBe(12);
    expect(portionSize(300, 0)).toBe(300); // весь набор
    expect(portionSize(6, 20)).toBe(6);
  });
});

describe("pickQuizCards", () => {
  const cards = [
    card("new1"),
    studied("strong", 40, 20),
    studied("weak", 3, 2),
    studied("due", 6, -1),
    card("new2"),
    studied("overdue", 6, -5),
    studied("missed", 40, 30),
  ];

  it("порядок важности: ошибки прошлого теста, к повторению, слабые, крепкие, новые в конце", () => {
    // 7 слов + 10 новых в хвосте: порция 10 — все выученные и ошибка, потом новые по порядку набора
    const big = [...cards, ...Array.from({ length: 10 }, (_, i) => card(`tail${i}`))];
    const first = new Set(pickQuizCards(big, { length: 10, checks: { missed: false }, now: NOW }).map((c) => c.id));
    for (const id of ["missed", "overdue", "due", "weak", "strong", "new1", "new2"]) expect(first.has(id)).toBe(true);
    expect([...first].filter((id) => id.startsWith("tail"))).toEqual(expect.arrayContaining(["tail0", "tail1", "tail2"]));
    expect([...first].filter((id) => id.startsWith("tail"))).toHaveLength(3);
    expect(pickQuizCards(cards, { length: 0, now: NOW })).toHaveLength(cards.length); // весь набор
  });

  it("ошибка прошлого теста идёт раньше просроченных", () => {
    const many = [...Array.from({ length: 12 }, (_, i) => studied(`due${i}`, 6, -3)), studied("missed", 40, 30)];
    const picked = pickQuizCards(many, { length: 10, checks: { missed: false }, now: NOW });
    expect(picked.some((c) => c.id === "missed")).toBe(true);
  });

  it("новые слова не вытесняют выученные", () => {
    const many = [...Array.from({ length: 30 }, (_, i) => card(`n${i}`)), ...Array.from({ length: 10 }, (_, i) => studied(`s${i}`, 10, 5))];
    const picked = pickQuizCards(many, { length: 10, now: NOW });
    expect(picked.every((c) => c.id.startsWith("s"))).toBe(true);
  });

  it("среди крепких сначала ещё не проверенные тестом — за несколько тестов проходим весь набор", () => {
    const strong = Array.from({ length: 30 }, (_, i) => studied(`s${i}`, 40, 20 + i));
    const checks = Object.fromEntries(strong.slice(0, 20).map((c) => [c.id, true]));
    const picked = pickQuizCards(strong, { length: 10, checks, now: NOW });
    expect(picked.every((c) => !(c.id in checks))).toBe(true);
  });

  it("«Следующие 20» — без уже спрошенных", () => {
    const many = set(50);
    const first = pickQuizCards(many, { length: 20, now: NOW });
    const second = pickQuizCards(many, { length: 20, exclude: new Set(first.map((c) => c.id)), now: NOW });
    expect(second).toHaveLength(20);
    expect(second.some((c) => first.includes(c))).toBe(false);
    const rest = pickQuizCards(many, { length: 20, exclude: new Set([...first, ...second].map((c) => c.id)), now: NOW });
    expect(rest).toHaveLength(10);
  });
});

describe("questionFor", () => {
  it("синонимы не попадают в варианты: на «счастливый» верен только один ответ", () => {
    const pool = [
      card("glad", { word: "glad", translation: "счастливый" }),
      card("lykkelig", { word: "lykkelig", translation: "счастливый" }),
      ...set(6),
    ];
    for (let i = 0; i < 50; i++) {
      const q = questionFor(pool[0], "choice", pool);
      if (q.type === TaskType.WORD_BY_TRANSLATION) expect(q.options).not.toContain("lykkelig");
      if (q.type === TaskType.TRANSLATION_BY_WORD) expect(q.options?.filter((o) => o === "счастливый")).toHaveLength(1);
    }
  });

  it("омоним: другой перевод того же слова не становится неверным вариантом", () => {
    const pool = [card("bank1", { word: "bank", translation: "банк" }), card("bank2", { word: "bank", translation: "берег" }), ...set(6)];
    for (let i = 0; i < 50; i++) {
      const q = questionFor(pool[0], "choice", pool);
      if (q.type === TaskType.TRANSLATION_BY_WORD) expect(q.options).not.toContain("берег");
    }
  });

  it("вариантов меньше четырёх — спрашиваем вводом, без заглушек", () => {
    const pool = [card("a"), card("b"), card("c", { translation: "t-a" }), card("d", { translation: "t-a" })];
    for (let i = 0; i < 30; i++) {
      const q = questionFor(pool[0], "choice", pool);
      expect(isTyping(q.type) || q.options?.every((o) => !/^\[\d\]$/.test(o) && o !== "—")).toBe(true);
      if (q.options) expect(q.options).toHaveLength(4);
    }
  });

  it("«Как отвечать» соблюдается; длинную фразу не печатаем", () => {
    const pool = set(8);
    for (let i = 0; i < 30; i++) {
      expect(isTyping(questionFor(pool[0], "type", pool).type)).toBe(true);
      expect(isTyping(questionFor(pool[0], "choice", pool).type)).toBe(false);
    }
    const phrase = card("p", { word: "a very long phrase that nobody wants to type out" });
    expect(isTyping(questionFor(phrase, "type", [phrase, ...pool]).type)).toBe(false);
  });

  it("вперемешку — и выбор, и ввод; по описанию — только если оно есть", () => {
    const pool = [card("e", { explanation: "описание" }), ...set(7)];
    const types = new Set(Array.from({ length: 200 }, () => questionFor(pool[0], "mixed", pool).type));
    expect(types.size).toBe(5);
    const plain = new Set(Array.from({ length: 200 }, () => questionFor(pool[1], "mixed", pool).type));
    expect(plain.has(TaskType.WORD_BY_EXPLANATION) || plain.has(TaskType.WRITE_WORD_BY_EXPLANATION)).toBe(false);
  });

  it("вперемешку по силе слова: новые чаще выбором, крепкие чаще вводом", () => {
    const pool = set(8);
    const fresh = pool[0];
    const strong = studied("strong", 40, 20);
    const share = (c: Card) => Array.from({ length: 400 }, () => questionFor(c, "mixed", [c, ...pool])).filter((q) => isTyping(q.type)).length / 400;
    expect(share(fresh)).toBeLessThan(0.3);
    expect(share(strong)).toBeGreaterThan(0.7);
  });

  it("на слух — изредка, только с голосом и не в режиме ввода; выбираем перевод", () => {
    const pool = set(8);
    const heard = Array.from({ length: 300 }, () => questionFor(pool[0], "choice", pool, { canListen: true })).filter((q) => q.type === TaskType.LISTEN);
    expect(heard.length).toBeGreaterThan(20);
    expect(heard.length).toBeLessThan(120);
    for (const q of heard) {
      expect(q.correctAnswer).toBe(pool[0].translation);
      expect(q.options).toContain(pool[0].translation);
    }
    const silent = Array.from({ length: 200 }, () => questionFor(pool[0], "choice", pool)).some((q) => q.type === TaskType.LISTEN);
    expect(silent).toBe(false);
    const typed = Array.from({ length: 200 }, () => questionFor(pool[0], "type", pool, { canListen: true })).some((q) => q.type === TaskType.LISTEN);
    expect(typed).toBe(false);
  });

  it("по вопросу на каждое слово, ответ — с карточки", () => {
    const pool = set(10);
    const qs = buildQuestions(pool, "mixed", pool);
    expect(qs.map((q) => q.card.id)).toEqual(pool.map((c) => c.id));
    for (const q of qs) {
      expect(q.correctAnswer).toBe(q.type === TaskType.TRANSLATION_BY_WORD ? q.card.translation : q.card.word);
      if (q.options) expect(q.options).toContain(q.correctAnswer);
    }
  });
});

describe("synonymsOf", () => {
  it("слова набора с тем же переводом, без самого слова", () => {
    const pool = [
      card("glad", { word: "glad", translation: "Счастливый " }),
      card("lykkelig", { word: "lykkelig", translation: "счастливый" }),
      card("same", { word: "glad", translation: "счастливый" }),
      card("x"),
    ];
    expect(synonymsOf(pool[0], pool)).toEqual(["lykkelig"]);
    expect(synonymsOf(pool[3], pool)).toEqual([]);
  });
});

describe("хранилище теста", () => {
  it("настройки: мусор и старые значения — по умолчанию", () => {
    expect(parseQuizPrefs(null)).toEqual(DEFAULT_QUIZ_SETTINGS);
    expect(parseQuizPrefs("{bad")).toEqual(DEFAULT_QUIZ_SETTINGS);
    expect(parseQuizPrefs(JSON.stringify({ enabledTaskTypes: ["word_by_translation"] }))).toEqual(DEFAULT_QUIZ_SETTINGS);
    expect(parseQuizPrefs(JSON.stringify({ length: 0, answers: "type" }))).toEqual({ length: 0, answers: "type" });
    expect(parseQuizPrefs(JSON.stringify({ length: 15, answers: "type" }))).toEqual({ length: 20, answers: "type" });
  });

  it("итоги проверок и история точности", () => {
    expect(parseChecks(JSON.stringify({ a: true, b: false, c: 1 }))).toEqual({ a: true, b: false });
    expect(parseChecks(JSON.stringify(["a"]))).toEqual({});
    expect(parseChecks("nope")).toEqual({});
    expect(parseHistory(JSON.stringify({ last: 70, best: 140 }))).toEqual({ last: 70, best: undefined });
    expect(parseHistory(null)).toEqual({});
  });
});

describe("счёт в контексте и путь по набору", () => {
  it("путь по набору: верно / ошибка / не проверено; удалённые слова не в счёт", () => {
    const cards = set(5);
    const p = setProgress(cards, { c0: true, c1: true, c2: false, gone: true });
    expect(p).toEqual({ total: 5, right: 2, wrong: 1 });
    expect(isSetPassed(p)).toBe(false);
    expect(isSetPassed(setProgress(cards, Object.fromEntries(cards.map((c) => [c.id, true]))))).toBe(true);
  });

  it("рекорд — только у полноценного теста и не с первого раза", () => {
    const first = recordHistory({}, 80, 20, 300);
    expect(first).toEqual({ history: { last: 80, best: 80 }, previous: undefined, record: false });
    const better = recordHistory(first.history, 90, 20, 300);
    expect(better.record).toBe(true);
    expect(better.previous).toBe(80);
    const short = recordHistory(better.history, 100, 4, 300); // четыре вопроса — не рекорд
    expect(short).toEqual({ history: { last: 100, best: 90 }, previous: 90, record: false });
    expect(recordHistory({ last: 50, best: 50 }, 100, 6, 6).record).toBe(true); // маленький набор целиком
  });

  it("звук серии — ступенями пентатоники", () => {
    expect([1, 2, 3, 5, 6, 9, 10, 30].map(streakPitch)).toEqual([0, 0, 2, 2, 5, 5, 7, 7]);
  });
});
