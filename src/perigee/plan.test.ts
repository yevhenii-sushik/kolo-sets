import { describe, expect, it } from "vitest";
import { Card, Collection, KnowledgeLevel } from "../types";
import { answer, buildQueue, DAILY_NEW, dueTomorrow, isFinished, NEW_PER_SESSION, pickCards, PlanCard, SESSION_CARDS, startSession, summarize } from "./plan";
import { updateSRSData } from "../utils/srs";

const now = new Date(2026, 10, 12, 12);
const daysAgo = (n: number) => new Date(2026, 10, 12 - n, 12);

let seq = 0;
const card = (over: Partial<Card["srsData"]> = {}, word = `w${seq}`): Card => {
  seq += 1;
  return {
    id: `c${seq}`,
    word,
    translation: `t${seq}`,
    explanation: "",
    example: "",
    partOfSpeech: "",
    createdAt: daysAgo(30 - seq / 100),
    srsData: { easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: daysAgo(30), ...over },
  };
};
const due = (overdueDays: number, repetitions = 2) =>
  card({ interval: 6, repetitions, nextReview: daysAgo(overdueDays), lastReviewed: daysAgo(overdueDays + 6) });
const set = (cards: Card[], id = "s1"): Collection => ({ id, name: id, language: "nb-NO", cards, createdAt: daysAgo(40) });
const plan = (c: Card, isNew: boolean, col = "s1"): PlanCard => ({ key: `${col}/${c.id}`, card: c, collectionId: col, isNew });

const { REMEMBER, FORGOT } = KnowledgeLevel;

describe("pickCards", () => {
  it("сначала самые просроченные, потом новые — не больше лимита за сессию", () => {
    const old = due(5);
    const recent = due(1);
    const fresh = Array.from({ length: 10 }, () => card());
    const picked = pickCards([set([recent, ...fresh, old])], now);
    expect(picked.slice(0, 2).map((p) => p.card.id)).toEqual([old.id, recent.id]);
    expect(picked.filter((p) => p.isNew)).toHaveLength(NEW_PER_SESSION);
  });

  it("не больше 20 слов; при 20 повторениях новых нет", () => {
    const many = Array.from({ length: 25 }, (_, i) => due(i + 1));
    const picked = pickCards([set([...many, card()])], now);
    expect(picked).toHaveLength(SESSION_CARDS);
    expect(picked.every((p) => !p.isNew)).toBe(true);
  });

  it("дневной лимит новых слов; «ещё» его обходит", () => {
    const learnedToday = Array.from({ length: DAILY_NEW }, () => updateSRSData(card(), REMEMBER, now));
    const cards = [...learnedToday, card(), card()];
    expect(pickCards([set(cards)], now).filter((p) => p.isNew)).toHaveLength(0);
    expect(pickCards([set(cards)], now, true).filter((p) => p.isNew)).toHaveLength(2);
  });
});

describe("pickCards по одному набору", () => {
  it("слова только из набора, а дневной лимит — общий для курса", () => {
    const learnedToday = Array.from({ length: DAILY_NEW - 2 }, () => updateSRSData(card(), REMEMBER, now));
    const other = set([...learnedToday, due(3)], "other");
    const mine = set([due(1), card(), card(), card()], "mine");
    const picked = pickCards([other, mine], now, false, "mine");
    expect(picked.every((p) => p.collectionId === "mine")).toBe(true);
    expect(picked.filter((p) => !p.isNew)).toHaveLength(1);
    expect(picked.filter((p) => p.isNew)).toHaveLength(2); // осталось 2 из дневного лимита
  });
});

describe("buildQueue", () => {
  it("новые: знакомство группой, потом выбор перевода, потом выбор слова", () => {
    const cards = [card(), card(), card()].map((c) => plan(c, true));
    const steps = buildQueue(cards);
    expect(steps.map((s) => s.kind)).toEqual(["intro", "intro", "intro", "choice", "choice", "choice", "choice", "choice", "choice"]);
    expect(steps.slice(3, 6).every((s) => !s.reverse)).toBe(true);
    expect(steps.slice(6).every((s) => s.reverse)).toBe(true);
  });

  it("формат повторения — по силе памяти", () => {
    const steps = buildQueue(
      [plan(due(1, 0), false), plan(due(1, 1), false), plan(due(1, 3), false), plan(due(1, 1), false)],
      () => 0.9,
    );
    expect(steps.map((s) => s.kind)).toEqual(["choice", "type", "flash", "type"]);
    const longPhrase = plan({ ...due(1, 1), word: "å ta seg sammen og gjøre det" }, false);
    expect(buildQueue([longPhrase])[0].kind).toBe("flash");
  });

  it("повторения делятся между группами новых, начиная с разминки", () => {
    const steps = buildQueue([plan(due(2), false), plan(due(1), false), plan(card(), true)], () => 0);
    expect(steps.map((s) => s.kind)).toEqual(["type", "intro", "choice", "choice", "type"]);
  });

  it("в маленьком курсе вместо выбора — флэшкарта", () => {
    const steps = buildQueue([plan(card(), true), plan(due(1, 0), false)], Math.random, { canChoose: false });
    expect(steps.map((s) => s.kind)).toEqual(["flash", "intro", "flash"]);
  });
});

describe("answer", () => {
  it("ошибка ставит повтор через три шага, а в расписание идёт только первый ответ", () => {
    const reviews = Array.from({ length: 5 }, () => plan(due(1, 3), false));
    let s = startSession(reviews, () => 0); // все — ввод
    const first = answer(s, { kind: "type", result: "wrong" });
    expect(first.effect?.level).toBe(FORGOT);
    s = first.state;
    expect(s.queue).toHaveLength(6);
    expect(s.queue[4]).toMatchObject({ key: reviews[0].key, kind: "choice", reverse: true, graded: false });

    for (let i = 0; i < 3; i++) s = answer(s, { kind: "type", result: "exact" }).state;
    const retry = answer(s, { kind: "choice", correct: true });
    expect(retry.effect).toBeUndefined(); // повтор не оценивается
  });

  it("новое слово оценивается после последнего шага: без ошибок — «Помню»", () => {
    let s = startSession([plan(card(), true)]);
    expect(answer(s, null).effect).toBeUndefined();
    s = answer(s, null).state;
    const fwd = answer(s, { kind: "choice", correct: true });
    expect(fwd.effect).toBeUndefined();
    const rev = answer(fwd.state, { kind: "choice", correct: true });
    expect(rev.effect?.level).toBe(REMEMBER);
    expect(isFinished(rev.state)).toBe(true);
    expect(summarize(rev.state)).toEqual({ cards: 1, reviewed: 0, learned: 1, correctFirst: 1 });
  });

  it("новое слово с ошибкой — «Забыл» после закрепления", () => {
    let s = startSession([plan(card(), true)]);
    s = answer(s, null).state;
    const wrong = answer(s, { kind: "choice", correct: false });
    expect(wrong.effect).toBeUndefined(); // впереди ещё обратный выбор и повтор
    s = answer(wrong.state, { kind: "choice", correct: true }).state;
    const last = answer(s, { kind: "choice", correct: true });
    expect(last.effect?.level).toBe(FORGOT);
    expect(summarize(last.state).correctFirst).toBe(0);
  });

  it("«Не знаю» во флэшкарте возвращает слово в сессии, «Забыл» — нет", () => {
    const flash = () => startSession([plan(due(1, 3), false)], () => 0.9); // ввод недоступен → флэшкарта
    const lost = answer(flash(), { kind: "self", level: KnowledgeLevel.DONT_KNOW });
    expect(lost.state.queue).toHaveLength(2);
    const forgot = answer(flash(), { kind: "self", level: FORGOT });
    expect(forgot.effect?.level).toBe(FORGOT);
    expect(forgot.state.queue).toHaveLength(1);
    expect(isFinished(forgot.state)).toBe(true);
  });

  it("не больше трёх повторов на слово", () => {
    let s = startSession([plan(due(1, 0), false)]);
    for (let i = 0; i < 6 && !isFinished(s); i++) s = answer(s, { kind: "choice", correct: false }).state;
    expect(s.queue).toHaveLength(4);
    expect(isFinished(s)).toBe(true);
  });
});

describe("dueTomorrow", () => {
  it("считает слова, которые будут ждать завтра", () => {
    const tomorrowCard = card({ interval: 1, repetitions: 1, nextReview: new Date(2026, 10, 13, 9) });
    const later = card({ interval: 6, repetitions: 2, nextReview: new Date(2026, 10, 18) });
    expect(dueTomorrow([set([tomorrowCard, later, due(2)])], now)).toBe(2);
  });
});

describe("пропуск и аудирование", () => {
  const withExample = (reps: number) => plan({ ...due(1, reps), word: "hus", example: "Huset er gammelt." }, false);

  it("у свежего слова пропуск и аудирование разбавляют выбор", () => {
    const kinds = [0, 0.4, 0.8].map((r) => buildQueue([withExample(0)], () => r, { canListen: () => true })[0].kind);
    expect(kinds).toEqual(["choice", "cloze", "listen"]);
  });

  it("пропуск — только если слово нашлось в примере; аудирование — только с голосом", () => {
    expect(buildQueue([plan(due(1, 0), false)], () => 0.9)[0].kind).toBe("choice");
    expect(buildQueue([withExample(3)], () => 0.1)[0].kind).toBe("cloze");
    expect(buildQueue([withExample(3)], () => 0.3, { canListen: () => true })[0].kind).toBe("listen");
    expect(buildQueue([withExample(3)], () => 0.3)[0].kind).toBe("type");
  });

  it("новое слово с голосом может начать проверку с аудирования", () => {
    const steps = buildQueue([plan(card(), true)], () => 0.1, { canListen: () => true });
    expect(steps.map((s) => s.kind)).toEqual(["intro", "listen", "choice"]);
  });
});
