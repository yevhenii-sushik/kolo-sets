import { Card, Collection, KnowledgeLevel } from "../types";
import { AnswerOutcome, introducedOn, isDueAt, isNewCard, levelForAnswer, toDate } from "../utils/srs";
import { blankExample } from "./cloze";

// Сессия Perigee — чистая логика без React и Firebase: какие слова взять, какие шаги им дать,
// куда вставить повтор после ошибки и что записать в расписание. Правила — docs/specs/perigee.md.

export const SESSION_CARDS = 20;
export const NEW_PER_SESSION = 6;
export const DAILY_NEW = 12; // по умолчанию; темп 5 / 12 / 20 выбирает человек (src/perigee/prefs.ts)
const GROUP = 3; // новые слова идут группами: знакомство с тремя, потом проверка каждого
const RETRY_GAP = 3; // повтор после ошибки — через три шага
const MAX_RETRIES = 3;

export interface PlanCard {
  key: string; // collectionId/cardId
  card: Card;
  collectionId: string;
  isNew: boolean;
}

// cloze — пропуск в примере, listen — аудирование (этап C): оба выбирают из вариантов и оцениваются как выбор
export type StepKind = "intro" | "choice" | "type" | "flash" | "cloze" | "listen";

export interface Step {
  id: number; // уникален в сессии — ключ для анимации
  key: string;
  kind: StepKind;
  reverse: boolean; // подсказка — перевод, ответ — слово
  graded: boolean; // повтор после ошибки не оценивается
}

interface CardProgress {
  mistakes: number;
  first?: boolean; // верно ли с первого раза
  self?: boolean; // ответ — самооценка во флэшкарте: в «верно с первого раза» и «Знаю всё!» не идёт
  done: boolean; // оценка уже записана
  order?: number; // каким по счёту слово завершилось — лист ответов в шапке заполняется слева направо
}

export interface SessionState {
  cards: Record<string, PlanCard>;
  queue: Step[];
  pos: number;
  nextId: number;
  progress: Record<string, CardProgress>;
  retries: Record<string, number>;
  canChoose: boolean;
  ask: Record<string, Choosable>; // можно ли спросить слово выбором: в какую сторону хватает трёх вариантов
}

/** В какую сторону слово можно спросить выбором из четырёх (без синонимов хватает трёх неверных) */
export interface Choosable {
  word: boolean; // перевод → выбрать слово
  translation: boolean; // слово → выбрать перевод
}

/** Запись в расписание после ответа */
export interface SrsEffect {
  collectionId: string;
  cardId: string;
  level: KnowledgeLevel;
}

const time = (value: unknown) => toDate(value)?.getTime() ?? 0;

/** Сколько новых слов ещё можно начать сегодня при темпе dailyNew */
export const newLeftToday = (collections: Collection[], now: Date, dailyNew: number = DAILY_NEW) =>
  Math.max(0, dailyNew - introducedOn(collections.flatMap((c) => c.cards), now));

/**
 * Слова для сессии: сначала к повторению (самые просроченные), потом новые (старые первыми)
 * в пределах лимита. extra — «Ещё новые слова» в обход дневного лимита.
 */
// only — сессия по одному набору (кнопка «Учить» в наборе). Дневной лимит новых слов всё равно считаем
// по всему курсу: иначе его легко обойти, проходя наборы по очереди
export function pickCards(collections: Collection[], now: Date, extra = false, only?: string, dailyNew: number = DAILY_NEW): PlanCard[] {
  const all = collections
    .filter((col) => !only || col.id === only)
    .flatMap((col) => col.cards.map((card) => ({ key: `${col.id}/${card.id}`, card, collectionId: col.id })));
  const due = all
    .filter((c) => isDueAt(c.card, now))
    .sort((a, b) => time(a.card.srsData.nextReview) - time(b.card.srsData.nextReview))
    .slice(0, SESSION_CARDS)
    .map((c) => ({ ...c, isNew: false }));
  const allowance = extra ? NEW_PER_SESSION : newLeftToday(collections, now, dailyNew);
  const fresh = all
    .filter((c) => isNewCard(c.card))
    .sort((a, b) => time(a.card.createdAt) - time(b.card.createdAt))
    .slice(0, Math.min(SESSION_CARDS - due.length, NEW_PER_SESSION, allowance))
    .map((c) => ({ ...c, isNew: true }));
  return [...due, ...fresh];
}

// Длинную фразу печатать мучительно — такие слова вспоминаем флэшкартой
export const typeable = (word: string) => {
  const w = word.trim();
  return w.length > 0 && w.length <= 30 && w.split(/\s+/).length <= 4;
};

type Draft = Omit<Step, "id">;

export interface QueueOptions {
  canChoose?: boolean; // в курсе достаточно слов для четырёх вариантов
  canListen?: (pc: PlanCard) => boolean; // есть голос для языка и звук не выключен
  // Выбор — по слову, а не по курсу: у слова с синонимами вариантов может не хватить, и раньше на кнопке
  // появлялась заглушка «—»
  choosable?: (pc: PlanCard) => Choosable;
}

const ALL: Choosable = { word: true, translation: true };

// Формат проверки слова к повторению — по силе памяти. Пропуск в примере и аудирование разбавляют
// выбор у свежих слов и изредка появляются у выученных — для разнообразия, оцениваются как выбор.
// Вспомнить слово — вводом; флэшкарта (самооценка) — только для длинных фраз, которые мучительно печатать:
// раньше половина крепких слов шла флэшкартой, и «Помню» засчитывалось как проверенный ответ
function reviewStep(pc: PlanCard, random: () => number, { canChoose = true, canListen }: QueueOptions, ask: Choosable): Draft {
  const reps = pc.card.srsData?.repetitions ?? 0;
  const choice = canChoose && ask.word; // у слова к повторению выбор — обратный: перевод → слово
  const cloze = choice && blankExample(pc.card) !== null;
  const listen = canChoose && ask.translation && !!canListen?.(pc);
  const recall: StepKind = typeable(pc.card.word) ? "type" : "flash";
  let kind: StepKind;
  if (reps === 0) {
    const options: StepKind[] = [...(choice ? ["choice" as const] : []), ...(cloze ? ["cloze" as const] : []), ...(listen ? ["listen" as const] : [])];
    kind = options.length ? options[Math.min(options.length - 1, Math.floor(random() * options.length))] : recall;
  } else if (reps === 1) {
    kind = recall;
  } else {
    const r = random();
    kind = cloze && r < 0.2 ? "cloze" : listen && r < 0.35 ? "listen" : recall;
  }
  return { key: pc.key, kind, reverse: true, graded: true };
}

const chunk = <T,>(arr: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

/**
 * Очередь шагов. Новые: знакомство → выбор перевода (или аудирование) → выбор слова, группами по три.
 * Слова к повторению делятся между группами: сессия начинается с разминки знакомыми словами.
 */
export function buildQueue(cards: PlanCard[], random: () => number = Math.random, options: QueueOptions = {}): Step[] {
  const { canChoose = true, canListen, choosable = () => ALL } = options;
  const reviews = cards.filter((c) => !c.isNew).map((c) => reviewStep(c, random, options, choosable(c)));
  // Проверка нового слова выбором; null — в эту сторону вариантов не хватает
  const check = (c: PlanCard, reverse: boolean): Draft | null => {
    if (!canChoose || !choosable(c)[reverse ? "word" : "translation"]) return null;
    // Услышать только что выученное слово — половине новых слов вместо выбора перевода
    const listen = !reverse && !!canListen?.(c) && random() < 0.5;
    return { key: c.key, kind: listen ? "listen" : "choice", reverse, graded: true };
  };
  const groups = chunk(cards.filter((c) => c.isNew), GROUP).map((g) => {
    const forward = g.map((c) => check(c, false));
    const back = g.map((c) => check(c, true));
    // Ни в одну сторону выбором не спросить — проверка флэшкартой
    const fallback = g.flatMap((c, i): Draft[] => (forward[i] || back[i] ? [] : [{ key: c.key, kind: "flash", reverse: true, graded: true }]));
    return [
      ...g.map((c): Draft => ({ key: c.key, kind: "intro", reverse: false, graded: false })),
      ...forward.filter((d): d is Draft => d !== null),
      ...fallback,
      ...back.filter((d): d is Draft => d !== null),
    ];
  });

  const slices = groups.length + 1;
  const per = Math.ceil(reviews.length / slices);
  const drafts: Draft[] = [];
  for (let i = 0; i < slices; i++) {
    drafts.push(...reviews.slice(i * per, (i + 1) * per));
    if (groups[i]) drafts.push(...groups[i]);
  }
  return drafts.map((d, id) => ({ ...d, id }));
}

export function startSession(cards: PlanCard[], random: () => number = Math.random, options: QueueOptions = {}): SessionState {
  const canChoose = options.canChoose ?? true;
  const queue = buildQueue(cards, random, options);
  const choosable = options.choosable ?? (() => ALL);
  return {
    cards: Object.fromEntries(cards.map((c) => [c.key, c])),
    queue,
    pos: 0,
    nextId: queue.length,
    progress: {},
    retries: {},
    canChoose,
    ask: Object.fromEntries(cards.map((c) => [c.key, choosable(c)])),
  };
}

// Повтор после ошибки — выбор полегче: в нужную сторону, а не хватает вариантов — в другую; никак — флэшкарта
function retryKind(s: SessionState, step: Step): Pick<Step, "kind" | "reverse"> {
  const reverse = step.kind === "choice" ? step.reverse : true;
  const ask = s.ask[step.key] ?? ALL;
  if (s.canChoose && ask[reverse ? "word" : "translation"]) return { kind: "choice", reverse };
  if (s.canChoose && ask[reverse ? "translation" : "word"]) return { kind: "choice", reverse: !reverse };
  return { kind: "flash", reverse: true };
}

export const isFinished = (s: SessionState) => s.pos >= s.queue.length;

const isRight = (o: AnswerOutcome) =>
  o.kind === "choice" ? o.correct : o.kind === "type" ? o.result !== "wrong" : o.level === KnowledgeLevel.REMEMBER || o.level === KnowledgeLevel.KNOW;

/**
 * Ответ на текущий шаг (null — «Дальше» на знакомстве). Ошибка ставит повтор через три шага —
 * кроме «Забыл» во флэшкарте: ответ увиден и узнан, слово вернётся завтра (как во флэшкартах набора).
 * В расписание идёт одна оценка на слово: у слова к повторению — по первому ответу,
 * у нового — после его последнего шага («Помню» без ошибок, иначе «Забыл»: ещё один короткий шаг).
 */
export function answer(s: SessionState, outcome: AnswerOutcome | null): { state: SessionState; effect?: SrsEffect } {
  const step = s.queue[s.pos];
  if (!step) return { state: s };
  const pc = s.cards[step.key];
  const right = outcome === null || isRight(outcome);
  const progress: CardProgress = { ...(s.progress[step.key] ?? { mistakes: 0, done: false }) };

  let queue = s.queue;
  let nextId = s.nextId;
  let retries = s.retries;
  if (!right) {
    progress.mistakes += 1;
    const used = retries[step.key] ?? 0;
    const forgotSelf = outcome?.kind === "self" && outcome.level === KnowledgeLevel.FORGOT;
    if (used < MAX_RETRIES && !forgotSelf) {
      // После ввода и флэшкарты — выбор полегче; после выбора — тот же выбор заново
      const retry: Step = { id: nextId++, key: step.key, ...retryKind(s, step), graded: false };
      const at = Math.min(s.pos + 1 + RETRY_GAP, queue.length);
      queue = [...queue.slice(0, at), retry, ...queue.slice(at)];
      retries = { ...retries, [step.key]: used + 1 };
    }
  }

  // Самооценка во флэшкарте — данные о памяти, но не проверенный ответ: в «верно с первого раза» (опыт)
  // и «Знаю всё!» такое слово не идёт (правило «не награждать самооценку»)
  if (step.graded && outcome?.kind === "self" && !progress.done) progress.self = true;

  let effect: SrsEffect | undefined;
  const target = { collectionId: pc.collectionId, cardId: pc.card.id };
  const doneBefore = Object.values(s.progress).filter((p) => p.done).length;
  if (!pc.isNew && step.graded && outcome && progress.first === undefined) {
    progress.first = right;
    progress.done = true;
    progress.order = doneBefore;
    effect = { ...target, level: levelForAnswer(outcome) };
  }
  if (pc.isNew && !progress.done && !queue.slice(s.pos + 1).some((x) => x.key === step.key)) {
    progress.first = progress.mistakes === 0;
    progress.done = true;
    progress.order = doneBefore;
    effect = { ...target, level: progress.mistakes === 0 ? KnowledgeLevel.REMEMBER : KnowledgeLevel.FORGOT };
  }

  return {
    state: { ...s, queue, nextId, retries, pos: s.pos + 1, progress: { ...s.progress, [step.key]: progress } },
    effect,
  };
}

export type SheetMark = "right" | "wrong" | "self";

/**
 * Лист ответов: завершённые слова по порядку (как в тесте и флэшкартах): верно с первого раза, ошибка
 * или «помню» по самооценке — своим цветом, потому что это не проверенный ответ
 */
export function answerSheet(s: SessionState): SheetMark[] {
  return Object.values(s.progress)
    .filter((p) => p.done)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((p) => (p.first !== true ? "wrong" : p.self ? "self" : "right"));
}

export interface SessionSummary {
  cards: number;
  reviewed: number;
  learned: number;
  correctFirst: number; // верно с первого раза по проверенному ответу — за них опыт и «Знаю всё!»
  checked: number; // слов, проверенных ответом (не самооценкой)
  selfRated: number; // слов, оценённых самим человеком во флэшкарте
  tough: string[]; // ключи слов с ошибками — «Трудные слова» в итоге
}

export function summarize(s: SessionState): SessionSummary {
  const list = Object.values(s.cards);
  const done = list.filter((c) => s.progress[c.key]?.done);
  return {
    cards: list.length,
    reviewed: list.filter((c) => !c.isNew).length,
    learned: list.filter((c) => c.isNew && s.progress[c.key]?.done).length,
    correctFirst: done.filter((c) => s.progress[c.key].first === true && !s.progress[c.key].self).length,
    checked: done.filter((c) => !s.progress[c.key].self).length,
    selfRated: done.filter((c) => s.progress[c.key].self).length,
    tough: list.filter((c) => (s.progress[c.key]?.mistakes ?? 0) > 0).map((c) => c.key),
  };
}

/** Сколько слов будет ждать завтра — по свежим интервалам */
export function dueTomorrow(collections: Collection[], now: Date): number {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
  return collections.reduce((n, c) => n + c.cards.filter((card) => isDueAt(card, tomorrow)).length, 0);
}
