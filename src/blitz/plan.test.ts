import { describe, expect, it } from "vitest";
import { Card, TaskType } from "../types";
import {
  DECK_MAX,
  DECK_MIN,
  MISS_GAP,
  blitzQuestion,
  blitzTier,
  canAsk,
  feedsSchedule,
  multiplierFor,
  nextQueue,
  pickBlitzDeck,
  pointsFor,
  recordBlitz,
  startQueue,
} from "./plan";
import { parseBlitzHistories, parseBlitzPrefs } from "./storage";

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

const ids = (cards: Card[]) => cards.map((c) => c.id);
// Предсказуемый «случай» для тестов
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("очки", () => {
  it("множитель за серию: ×2 с трёх, ×3 с шести, ×4 с десяти", () => {
    expect([0, 2, 3, 5, 6, 9, 10, 30].map(multiplierFor)).toEqual([1, 1, 2, 2, 3, 3, 4, 4]);
    expect(pointsFor(1)).toBe(10);
    expect(pointsFor(10)).toBe(40);
  });
});

describe("pickBlitzDeck", () => {
  const cards = [
    card("new1"),
    studied("strong", 40, 20),
    studied("weak", 3, 2),
    studied("due", 6, -1),
    studied("middle", 12, 5),
    studied("overdue", 6, -5),
    card("new2"),
    studied("weak2", 2, 1),
    studied("strong2", 60, 30),
  ];

  it("сначала к повторению (самые просроченные), потом слабые, потом крепкие; новые — добором до восьми", () => {
    const deck = pickBlitzDeck(cards, { now: NOW });
    expect(ids(deck)).toEqual(["overdue", "due", "weak2", "weak", "middle", "strong", "strong2", "new1"]);
    expect(deck).toHaveLength(DECK_MIN);
  });

  it("изученных хватает — новых в колоде нет, и не больше двадцати слов", () => {
    const many = [card("fresh"), ...Array.from({ length: 30 }, (_, i) => studied(`s${i}`, 3, 1))];
    const deck = pickBlitzDeck(many, { now: NOW });
    expect(deck).toHaveLength(DECK_MAX);
    expect(ids(deck)).not.toContain("fresh");
  });

  it("набор только из новых слов — играем ими, но колода маленькая", () => {
    const fresh = Array.from({ length: 30 }, (_, i) => card(`n${i}`));
    expect(ids(pickBlitzDeck(fresh, { now: NOW }))).toEqual(ids(fresh.slice(0, DECK_MIN)));
  });

  it("«Сыграть ещё»: верно отвеченные в этот заход уходят в конец очереди важности", () => {
    const many = Array.from({ length: 25 }, (_, i) => studied(`s${i}`, 3, 1 + (i % 3)));
    const first = pickBlitzDeck(many, { now: NOW });
    const second = pickBlitzDeck(many, { now: NOW, exclude: new Set(ids(first)) });
    expect(second.slice(0, 5).every((c) => !first.includes(c))).toBe(true);
    expect(second).toHaveLength(DECK_MAX); // не хватило новых — добираем уже сыгранными
  });

  it("слово, которое нельзя спросить выбором (синонимы, мало вариантов), в колоду не попадает", () => {
    const twins = [
      studied("a", 3, 1, { translation: "счастливый" }),
      studied("b", 3, 1, { translation: "счастливый" }),
      studied("c", 3, 1, { word: "same" }),
      studied("d", 3, 1, { word: "same" }),
    ];
    // У каждой карточки в обе стороны остаётся меньше трёх вариантов
    expect(twins.some((c) => canAsk(c, twins))).toBe(false);
    expect(pickBlitzDeck(twins, { now: NOW })).toEqual([]);
  });
});

describe("feedsSchedule", () => {
  it("в расписание — только слова, которые уже учатся", () => {
    expect(feedsSchedule(card("new"))).toBe(false);
    expect(feedsSchedule(studied("old", 3, 1))).toBe(true);
  });
});

describe("очередь", () => {
  const deck = ["a", "b", "c", "d", "e", "f"].map((id) => studied(id, 3, 1));

  it("верно — следующее слово; круг кончился — новый круг, не с того же слова", () => {
    const q = startQueue(deck, seq(0.99));
    expect(nextQueue(q, deck, true)).toEqual(q.slice(1));
    const last = [q[5]];
    const refilled = nextQueue(last, deck, true, seq(0.99));
    expect(refilled).toHaveLength(deck.length);
    expect(refilled[0].id).not.toBe(q[5].id);
  });

  it("ошибка — слово вернётся через три вопроса", () => {
    const q = startQueue(deck);
    const after = nextQueue(q, deck, false);
    expect(after[MISS_GAP].id).toBe(q[0].id);
    expect(after.filter((c) => c.id === q[0].id)).toHaveLength(1);
  });

  it("ошибка на последнем слове круга — возвращается в новом круге, а не сразу и не дважды", () => {
    const q = startQueue(deck);
    const last = q.slice(-1);
    const after = nextQueue(last, deck, false);
    expect(after[0].id).not.toBe(last[0].id);
    expect(after[MISS_GAP].id).toBe(last[0].id);
    expect(after.filter((c) => c.id === last[0].id)).toHaveLength(1);
  });

  it("маленькая колода: ошибка встаёт в конец оставшегося", () => {
    const small = deck.slice(0, 2);
    const after = nextQueue([small[0], small[1]], small, false);
    expect(ids(after)).toEqual([small[1].id, small[0].id]);
  });
});

describe("blitzQuestion", () => {
  const pool = ["a", "b", "c", "d", "e"].map((id) => studied(id, 3, 1));

  it("к переводу: показано слово, варианты — переводы, верный среди них", () => {
    const q = blitzQuestion(pool[0], pool, "forward")!;
    expect(q.type).toBe(TaskType.TRANSLATION_BY_WORD);
    expect(q.prompt).toBe("w-a");
    expect(q.options).toHaveLength(4);
    expect(q.options).toContain("t-a");
    expect(q.correctAnswer).toBe("t-a");
  });

  it("к слову: показан перевод, варианты — слова", () => {
    const q = blitzQuestion(pool[0], pool, "reverse")!;
    expect(q.type).toBe(TaskType.WORD_BY_TRANSLATION);
    expect(q.prompt).toBe("t-a");
    expect(q.options).toContain("w-a");
  });

  it("вперемешку — то так, то так", () => {
    expect(blitzQuestion(pool[0], pool, "mixed", { random: seq(0.1) })!.type).toBe(TaskType.WORD_BY_TRANSLATION);
    expect(blitzQuestion(pool[0], pool, "mixed", { random: seq(0.9) })!.type).toBe(TaskType.TRANSLATION_BY_WORD);
  });

  it("на слух — только с голосом, иначе слово на экране", () => {
    expect(blitzQuestion(pool[0], pool, "listen", { canListen: true })!.type).toBe(TaskType.LISTEN);
    expect(blitzQuestion(pool[0], pool, "listen", { canListen: false })!.type).toBe(TaskType.TRANSLATION_BY_WORD);
  });

  it("в нужную сторону вариантов не хватает — спрашиваем в другую, ни в какую — вопроса нет", () => {
    // У остальных слов один перевод на всех: неверный перевод для «a» только один, а слов — три
    const twins = [studied("a", 3, 1), ...["b", "c", "d"].map((id) => studied(id, 3, 1, { translation: "общий" }))];
    expect(blitzQuestion(twins[0], twins, "forward")!.type).toBe(TaskType.WORD_BY_TRANSLATION);
    const same = ["a", "b"].map((id) => studied(id, 3, 1));
    expect(blitzQuestion(same[0], same, "forward")).toBeNull();
  });
});

describe("итог и рекорд", () => {
  it("меньше 10 ответов — не засчитан; иначе рекорд или ступень по точности", () => {
    expect(blitzTier({ answers: 9, correct: 9, record: true })).toBe("uncounted");
    expect(blitzTier({ answers: 20, correct: 12, record: true })).toBe("record");
    expect(blitzTier({ answers: 20, correct: 18, record: false })).toBe("great");
    expect(blitzTier({ answers: 20, correct: 14, record: false })).toBe("good");
    expect(blitzTier({ answers: 20, correct: 0, record: false })).toBe("slow");
  });

  it("первый раунд — не рекорд; рекорд — строго больше прежнего; незасчитанный раунд историю не трогает", () => {
    const first = recordBlitz({}, 200, true);
    expect(first).toEqual({ history: { last: 200, best: 200 }, previous: undefined, record: false });
    expect(recordBlitz(first.history, 200, true).record).toBe(false);
    const better = recordBlitz(first.history, 260, true);
    expect(better).toEqual({ history: { last: 260, best: 260 }, previous: 200, record: true });
    expect(recordBlitz({ last: 100, best: 300 }, 120, true).history).toEqual({ last: 120, best: 300 });
    expect(recordBlitz({ last: 100, best: 300 }, 999, false)).toEqual({ history: { last: 100, best: 300 }, previous: 100, record: false });
  });
});

describe("хранилище", () => {
  it("настройка: мусор и неизвестный способ — по умолчанию", () => {
    expect(parseBlitzPrefs(null).mode).toBe("forward");
    expect(parseBlitzPrefs("{bad").mode).toBe("forward");
    expect(parseBlitzPrefs('{"mode":"telepathy"}').mode).toBe("forward");
    expect(parseBlitzPrefs('{"mode":"listen"}').mode).toBe("listen");
  });

  it("история: по способу, без мусора", () => {
    expect(parseBlitzHistories('{"forward":{"last":120,"best":300},"listen":{"best":"x"},"evil":{"best":5}}')).toEqual({
      forward: { last: 120, best: 300 },
    });
    expect(parseBlitzHistories("[1,2]")).toEqual({});
    expect(parseBlitzHistories(null)).toEqual({});
  });
});
