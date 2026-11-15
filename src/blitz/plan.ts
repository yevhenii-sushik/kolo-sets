// Блиц: какие слова, в каком порядке и как спросить; итог и рекорд (docs/specs/perigee.md, «Блиц»).
// Чистые функции.
//
// Блиц — игра на мгновенное узнавание: минута, выбор из четырёх, серия умножает очки. Чтобы минута шла
// на пользу, в раунд берём важные слова (к повторению, слабые), а не случайные из всего набора, и
// ошибку возвращаем через пару вопросов. Новые слова — только добором для маленьких наборов, и в
// расписание они не идут: знакомит с ними Perigee, а угаданный в спешке перевод о памяти не говорит.

import { Card, TaskType } from "../types";
import { isDueAt, isNewCard, memoryStrength, toDate } from "../utils/srs";
import { distractorsFor, shuffle } from "../utils/gameUtils";
import { GAME_MIN_ANSWERS } from "../../server/core/xp";

export const BLITZ_SECONDS = 60;
export const DECK_MAX = 20; // за минуту успевают 25–40 ответов: каждое слово встретится раз-другой
export const DECK_MIN = 8; // меньше — на втором круге запоминаешь порядок, а не слова
export const MISS_GAP = 3; // ошибка вернётся через три вопроса: ещё в памяти, но уже не подряд
export const COUNTDOWN = 3;
export const CORRECT_MS = 400; // верно — вспышка зелёного, и дальше
export const WRONG_MS = 1200; // ошибка — время увидеть верный ответ; таймер идёт, угадывать невыгодно

export type BlitzMode = "forward" | "reverse" | "mixed" | "listen";
export const BLITZ_MODES: BlitzMode[] = ["forward", "reverse", "mixed", "listen"];

export interface BlitzSettings {
  mode: BlitzMode;
}
export const DEFAULT_BLITZ_SETTINGS: BlitzSettings = { mode: "forward" };

// ── Очки ──

/** Множитель очков за серию верных подряд */
export function multiplierFor(streak: number): number {
  if (streak >= 10) return 4;
  if (streak >= 6) return 3;
  if (streak >= 3) return 2;
  return 1;
}

export const pointsFor = (streak: number) => 10 * multiplierFor(streak);

// Ступени звука streak-up для ×2, ×3, ×4 в полутонах: G → A → C (scripts/sounds/README.md)
export const STREAK_STEP: Record<number, number> = { 2: 0, 3: 2, 4: 5 };

// ── Слова раунда ──

type Field = "word" | "translation";

/** Можно ли спросить слово выбором хоть в одну сторону: нужно три неверных варианта без синонимов */
export const canAsk = (card: Card, pool: Card[]) =>
  distractorsFor(card, pool, "translation").length >= 3 || distractorsFor(card, pool, "word").length >= 3;

const time = (value: unknown) => toDate(value)?.getTime() ?? 0;

// Чем меньше, тем раньше в колоде
function rank(card: Card, now: Date): number {
  if (isDueAt(card, now)) return 0;
  const strength = memoryStrength(card);
  return strength <= 1 ? 1 : strength === 2 ? 2 : 3;
}

/**
 * Колода раунда: сначала к повторению (самые просроченные первыми), потом слабые, потом крепкие.
 * exclude — слова, уже отвеченные верно в этот заход: «Сыграть ещё» берёт следующие по важности, а не
 * те же двадцать. Новые слова — только если изученных меньше DECK_MIN, по порядку набора
 */
export function pickBlitzDeck(
  cards: Card[],
  { exclude = new Set(), now = new Date() }: { exclude?: ReadonlySet<string>; now?: Date } = {},
): Card[] {
  const askable = cards.filter((c) => canAsk(c, cards));
  const studied = askable
    .filter((c) => !isNewCard(c))
    .map((card) => ({ card, rank: rank(card, now), played: exclude.has(card.id) }))
    .sort((a, b) => Number(a.played) - Number(b.played) || a.rank - b.rank || time(a.card.srsData?.nextReview) - time(b.card.srsData?.nextReview))
    .map((x) => x.card);
  const deck = studied.slice(0, DECK_MAX);
  if (deck.length >= DECK_MIN) return deck;
  const fresh = askable.filter((c) => isNewCard(c));
  return [...deck, ...fresh.slice(0, DECK_MIN - deck.length)];
}

/** Ответ на слово идёт в расписание Perigee: первый за раунд и только у слова, которое уже учится */
export const feedsSchedule = (card: Card) => !isNewCard(card);

// ── Очередь вопросов ──

// Новый круг по колоде — заново перемешан и не начинается со слова, которое только что было
function refill(deck: Card[], last: Card | undefined, random: () => number): Card[] {
  const order = shuffle(deck, random);
  if (order.length > 1 && last && order[0].id === last.id) [order[0], order[1]] = [order[1], order[0]];
  return order;
}

/** Очередь на старте раунда */
export const startQueue = (deck: Card[], random: () => number = Math.random) => refill(deck, undefined, random);

/**
 * Очередь после ответа на первое слово. Ошибка — слово вернётся через MISS_GAP вопросов (если оно и так
 * ждало дальше в круге, переносим его ближе). Круг кончился — новый, перемешанный заново: раньше слова
 * шли по кругу в одном порядке, и на маленьком наборе запоминался порядок, а не слова
 */
export function nextQueue(upcoming: Card[], deck: Card[], correct: boolean, random: () => number = Math.random): Card[] {
  const [answered, ...rest] = upcoming;
  let queue = rest.length > 0 ? rest : refill(deck, answered, random);
  if (!correct && answered) {
    queue = queue.filter((c) => c.id !== answered.id);
    if (queue.length === 0) queue = refill(deck, answered, random).filter((c) => c.id !== answered.id);
    queue.splice(Math.min(MISS_GAP, queue.length), 0, answered);
  }
  return queue;
}

// ── Вопрос ──

export interface BlitzQuestion {
  card: Card;
  type: TaskType.TRANSLATION_BY_WORD | TaskType.WORD_BY_TRANSLATION | TaskType.LISTEN;
  prompt: string; // что показано (на слух — слово звучит, на экране появится после ответа)
  options: string[];
  correctAnswer: string;
}

const fieldOf = (type: BlitzQuestion["type"]): Field => (type === TaskType.WORD_BY_TRANSLATION ? "word" : "translation");

/**
 * Вопрос о слове по настройке «Как спрашивать». Не хватает вариантов в эту сторону — спрашиваем в другую;
 * на слух — только если есть голос, иначе слово на экране
 */
export function blitzQuestion(
  card: Card,
  pool: Card[],
  mode: BlitzMode,
  { random = Math.random, canListen = false }: { random?: () => number; canListen?: boolean } = {},
): BlitzQuestion | null {
  const distractors: Record<Field, string[]> = {
    translation: distractorsFor(card, pool, "translation"),
    word: distractorsFor(card, pool, "word"),
  };
  const preferred: BlitzQuestion["type"] =
    mode === "reverse"
      ? TaskType.WORD_BY_TRANSLATION
      : mode === "listen"
        ? canListen
          ? TaskType.LISTEN
          : TaskType.TRANSLATION_BY_WORD
        : mode === "mixed" && random() < 0.5
          ? TaskType.WORD_BY_TRANSLATION
          : TaskType.TRANSLATION_BY_WORD;
  const fallback = preferred === TaskType.WORD_BY_TRANSLATION ? TaskType.TRANSLATION_BY_WORD : TaskType.WORD_BY_TRANSLATION;
  const type = distractors[fieldOf(preferred)].length >= 3 ? preferred : distractors[fieldOf(fallback)].length >= 3 ? fallback : null;
  if (!type) return null;
  const field = fieldOf(type);
  return {
    card,
    type,
    prompt: field === "word" ? card.translation : card.word,
    options: shuffle([...distractors[field].slice(0, 3), card[field]], random),
    correctAnswer: card[field],
  };
}

// ── Итог ──

export type BlitzTier = "uncounted" | "record" | "great" | "good" | "slow";

/**
 * Честный итог раунда. Меньше GAME_MIN_ANSWERS ответов — раунд не засчитан. Иначе рекорд набора, а без
 * него — по точности: кубок за ноль верных больше не выдаём
 */
export function blitzTier({ answers, correct, record }: { answers: number; correct: number; record: boolean }): BlitzTier {
  if (answers < GAME_MIN_ANSWERS) return "uncounted";
  if (record) return "record";
  const accuracy = correct / answers;
  if (accuracy >= 0.9) return "great";
  if (accuracy >= 0.7) return "good";
  return "slow";
}

export interface BlitzHistory {
  last?: number; // очки прошлого засчитанного раунда
  best?: number; // рекорд набора
}

/**
 * Записать очки раунда. Незасчитанный раунд историю не трогает. Первый раунд рекордом не считаем — побить
 * ещё нечего; рекорд — строго больше прежнего
 */
export function recordBlitz(prev: BlitzHistory, score: number, counted: boolean) {
  if (!counted) return { history: prev, previous: prev.last, record: false };
  const record = prev.best !== undefined && score > prev.best;
  return { history: { last: score, best: Math.max(prev.best ?? 0, score) }, previous: prev.last, record };
}
