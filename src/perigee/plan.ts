import { Card, Collection, KnowledgeLevel } from "../types";
import { AnswerOutcome, introducedOn, isDueAt, isNewCard, levelForAnswer, toDate } from "../utils/srs";
import { blankExample } from "./cloze";

// Сессия Perigee — чистая логика без React и Firebase: какие слова взять, какие шаги им дать,
// куда вставить повтор после ошибки и что записать в расписание. Правила — docs/specs/perigee.md.

export const SESSION_CARDS = 20;
export const NEW_PER_SESSION = 6;
export const DAILY_NEW = 12;
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
  done: boolean; // оценка уже записана
}

export interface SessionState {
  cards: Record<string, PlanCard>;
  queue: Step[];
  pos: number;
  nextId: number;
  progress: Record<string, CardProgress>;
  retries: Record<string, number>;
  canChoose: boolean;
}

/** Запись в расписание после ответа */
export interface SrsEffect {
  collectionId: string;
  cardId: string;
  level: KnowledgeLevel;
}

const time = (value: unknown) => toDate(value)?.getTime() ?? 0;

/** Сколько новых слов ещё можно начать сегодня */
export const newLeftToday = (collections: Collection[], now: Date) =>
  Math.max(0, DAILY_NEW - introducedOn(collections.flatMap((c) => c.cards), now));

/**
 * Слова для сессии: сначала к повторению (самые просроченные), потом новые (старые первыми)
 * в пределах лимита. extra — «Ещё новые слова» в обход дневного лимита.
 */
// only — сессия по одному набору (кнопка «Учить» в наборе). Дневной лимит новых слов всё равно считаем
// по всему курсу: иначе его легко обойти, проходя наборы по очереди
export function pickCards(collections: Collection[], now: Date, extra = false, only?: string): PlanCard[] {
  const all = collections
    .filter((col) => !only || col.id === only)
    .flatMap((col) => col.cards.map((card) => ({ key: `${col.id}/${card.id}`, card, collectionId: col.id })));
  const due = all
    .filter((c) => isDueAt(c.card, now))
    .sort((a, b) => time(a.card.srsData.nextReview) - time(b.card.srsData.nextReview))
    .slice(0, SESSION_CARDS)
    .map((c) => ({ ...c, isNew: false }));
  const allowance = extra ? NEW_PER_SESSION : newLeftToday(collections, now);
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
}

// Формат проверки слова к повторению — по силе памяти. Пропуск в примере и аудирование разбавляют
// выбор у свежих слов и изредка появляются у выученных — для разнообразия, оцениваются как выбор
function reviewStep(pc: PlanCard, random: () => number, { canChoose = true, canListen }: QueueOptions): Draft {
  const reps = pc.card.srsData?.repetitions ?? 0;
  const cloze = canChoose && blankExample(pc.card) !== null;
  const listen = canChoose && !!canListen?.(pc);
  const recall: StepKind = typeable(pc.card.word) ? "type" : "flash";
  let kind: StepKind;
  if (reps === 0) {
    const options: StepKind[] = canChoose ? ["choice", ...(cloze ? ["cloze" as const] : []), ...(listen ? ["listen" as const] : [])] : ["flash"];
    kind = options[Math.min(options.length - 1, Math.floor(random() * options.length))];
  } else if (reps === 1) {
    kind = recall;
  } else {
    const r = random();
    kind = cloze && r < 0.2 ? "cloze" : listen && r < 0.35 ? "listen" : recall === "type" && random() < 0.5 ? "type" : "flash";
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
  const { canChoose = true, canListen } = options;
  const reviews = cards.filter((c) => !c.isNew).map((c) => reviewStep(c, random, options));
  const check = (c: PlanCard, reverse: boolean): Draft => {
    if (!canChoose) return { key: c.key, kind: "flash", reverse: true, graded: true };
    // Услышать только что выученное слово — половине новых слов вместо выбора перевода
    const listen = !reverse && !!canListen?.(c) && random() < 0.5;
    return { key: c.key, kind: listen ? "listen" : "choice", reverse, graded: true };
  };
  const groups = chunk(cards.filter((c) => c.isNew), GROUP).map((g) => [
    ...g.map((c): Draft => ({ key: c.key, kind: "intro", reverse: false, graded: false })),
    ...g.map((c) => check(c, false)),
    ...(canChoose ? g.map((c) => check(c, true)) : []),
  ]);

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
  return {
    cards: Object.fromEntries(cards.map((c) => [c.key, c])),
    queue,
    pos: 0,
    nextId: queue.length,
    progress: {},
    retries: {},
    canChoose,
  };
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
      const retry: Step = {
        id: nextId++,
        key: step.key,
        kind: step.kind === "choice" || s.canChoose ? "choice" : "flash",
        reverse: step.kind === "choice" ? step.reverse : true,
        graded: false,
      };
      const at = Math.min(s.pos + 1 + RETRY_GAP, queue.length);
      queue = [...queue.slice(0, at), retry, ...queue.slice(at)];
      retries = { ...retries, [step.key]: used + 1 };
    }
  }

  let effect: SrsEffect | undefined;
  const target = { collectionId: pc.collectionId, cardId: pc.card.id };
  if (!pc.isNew && step.graded && outcome && progress.first === undefined) {
    progress.first = right;
    progress.done = true;
    effect = { ...target, level: levelForAnswer(outcome) };
  }
  if (pc.isNew && !progress.done && !queue.slice(s.pos + 1).some((x) => x.key === step.key)) {
    progress.first = progress.mistakes === 0;
    progress.done = true;
    effect = { ...target, level: progress.mistakes === 0 ? KnowledgeLevel.REMEMBER : KnowledgeLevel.FORGOT };
  }

  return {
    state: { ...s, queue, nextId, retries, pos: s.pos + 1, progress: { ...s.progress, [step.key]: progress } },
    effect,
  };
}

export interface SessionSummary {
  cards: number;
  reviewed: number;
  learned: number;
  correctFirst: number;
}

export function summarize(s: SessionState): SessionSummary {
  const list = Object.values(s.cards);
  return {
    cards: list.length,
    reviewed: list.filter((c) => !c.isNew).length,
    learned: list.filter((c) => c.isNew && s.progress[c.key]?.done).length,
    correctFirst: list.filter((c) => s.progress[c.key]?.first === true).length,
  };
}

/** Сколько слов будет ждать завтра — по свежим интервалам */
export function dueTomorrow(collections: Collection[], now: Date): number {
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
  return collections.reduce((n, c) => n + c.cards.filter((card) => isDueAt(card, tomorrow)).length, 0);
}
