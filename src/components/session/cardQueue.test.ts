import { describe, expect, it } from "vitest";
import { shuffleRest, wordProgress } from "./cardQueue";

type Item = { id: string; retry?: boolean };
const reverse = (xs: Item[]) => [...xs].reverse();
const ids = (xs: Item[]) => xs.map((x) => (x.retry ? `${x.id}*` : x.id));

describe("перемешать оставшиеся", () => {
  it("пройденные и повторы остаются на местах, мешаются только новые впереди", () => {
    const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "a", retry: true }, { id: "d" }, { id: "e" }];
    expect(ids(shuffleRest(items, 2, reverse))).toEqual(["a", "b", "e", "a*", "d", "c"]);
  });

  it("с первой карточки — мешается всё", () => {
    const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(ids(shuffleRest(items, 0, reverse))).toEqual(["c", "b", "a"]);
  });
});

describe("счётчик по словам", () => {
  it("повтор после ошибки не прибавляет слов", () => {
    const items: Item[] = [{ id: "a" }, { id: "b" }, { id: "a", retry: true }, { id: "c" }];
    expect(wordProgress(items, 0)).toMatchObject({ position: 1, total: 3 });
    expect(wordProgress(items, 2)).toMatchObject({ position: 2, total: 3 }); // на повторе — всё ещё второе слово
    expect(wordProgress(items, 3)).toMatchObject({ position: 3, total: 3 });
  });

  it("круг продолжили с места — оценённые до перерыва уже в счёте", () => {
    const items: Item[] = [{ id: "p" }, { id: "q" }];
    expect(wordProgress(items, 0, 15)).toMatchObject({ position: 16, total: 17 });
    expect(wordProgress(items, 0, 15).progress).toBeCloseTo(15 / 17);
  });

  it("полоса не откатывается, когда вставили повтор", () => {
    const three: Item[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const before = wordProgress(three, 1).progress;
    const after = wordProgress([...three, { id: "b", retry: true }], 2).progress;
    expect(after).toBeGreaterThan(before);
  });
});
