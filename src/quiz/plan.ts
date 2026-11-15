// Тест: какие слова спросить и как (docs/specs/perigee.md, «Тест: понятность и честность»). Чистые функции.
//
// Тест — экзамен по набору: проверяет слова, когда хочешь ты, а не расписание. Поэтому порция небольшая
// (10 / 20 / весь набор) и в ней сначала то, что важнее проверить: ошибки прошлого теста, слова к
// повторению и слабые, потом крепкие и в самом конце новые, которых человек ещё не видел.

import { Card, TaskType } from "../types";
import { isDueAt, isNewCard, memoryStrength, toDate } from "../utils/srs";
import { distractorsFor, shuffle } from "../utils/gameUtils";
import { normalizeAnswer } from "../utils/answerCheck";
import { typeable } from "../perigee/plan";

export type QuizLength = 10 | 20 | 0; // 0 — весь набор
export type QuizAnswers = "choice" | "type" | "mixed";

export interface QuizSettings {
  length: QuizLength;
  answers: QuizAnswers; // выбор из вариантов, ввод или вперемешку
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = { length: 20, answers: "mixed" };
export const QUIZ_LENGTHS: QuizLength[] = [10, 20, 0];
export const QUIZ_ANSWERS: QuizAnswers[] = ["choice", "type", "mixed"];

// Хвост короче — присоединяем к тесту: отдельный тест из двух слов ни о чём не говорит
const MIN_TAIL = 5;

export interface QuizQuestion {
  type: TaskType;
  prompt: string; // что показано: перевод, слово или описание
  options?: string[]; // варианты — у заданий с выбором
  correctAnswer: string;
  card: Card;
}

export const isTyping = (type: TaskType) => type === TaskType.WRITE_WORD_BY_TRANSLATION || type === TaskType.WRITE_WORD_BY_EXPLANATION;

/** Сколько слов взять из оставшихся: длина теста, а короткий хвост — вместе с ним */
export function portionSize(available: number, length: QuizLength): number {
  if (length === 0 || available - length < MIN_TAIL) return available;
  return length;
}

const time = (value: unknown) => toDate(value)?.getTime() ?? 0;

// Чем меньше, тем раньше в порции
function rank(card: Card, misses: ReadonlySet<string>, now: Date): number {
  if (misses.has(card.id)) return 0; // ошиблся в прошлом тесте — проверим первым
  if (isNewCard(card)) return 4; // ещё не встречал — в самом конце
  if (isDueAt(card, now)) return 1;
  if (memoryStrength(card) === 1) return 2; // учится: интервал меньше недели
  return 3;
}

/**
 * Слова для теста по важности, в случайном порядке вопросов.
 * misses — ошибки прошлого теста по этому набору; exclude — уже спрошенные в этот заход («Следующие 20»)
 */
export function pickQuizCards(
  cards: Card[],
  { length, misses = new Set(), exclude = new Set(), now = new Date() }: { length: QuizLength; misses?: ReadonlySet<string>; exclude?: ReadonlySet<string>; now?: Date },
): Card[] {
  const pool = cards.map((card, index) => ({ card, index, rank: rank(card, misses, now) })).filter((x) => !exclude.has(x.card.id));
  pool.sort(
    (a, b) =>
      a.rank - b.rank ||
      // Новые — по порядку набора; остальные — кому раньше на повторение (самые просроченные первыми)
      (a.rank === 4 ? a.index - b.index : time(a.card.srsData?.nextReview) - time(b.card.srsData?.nextReview)),
  );
  return shuffle(pool.slice(0, portionSize(pool.length, length)).map((x) => x.card));
}

const fieldOf = (type: TaskType): "word" | "translation" => (type === TaskType.TRANSLATION_BY_WORD ? "translation" : "word");

function promptOf(card: Card, type: TaskType): string {
  switch (type) {
    case TaskType.TRANSLATION_BY_WORD:
      return card.word;
    case TaskType.WORD_BY_EXPLANATION:
    case TaskType.WRITE_WORD_BY_EXPLANATION:
      return card.explanation;
    default:
      return card.translation;
  }
}

/**
 * Вопрос о слове. Формат — по настройке «Как отвечать»; вопрос по описанию появляется сам, если оно
 * есть у слова. Вариантов без синонимов меньше трёх — спрашиваем вводом (раньше на кнопках были
 * заглушки «[2]»); длинную фразу печатать мучительно — её спрашиваем выбором
 */
export function questionFor(card: Card, answers: QuizAnswers, pool: Card[], random: () => number = Math.random): QuizQuestion {
  const explained = !!card.explanation?.trim();
  const distractors = {
    word: distractorsFor(card, pool, "word"),
    translation: distractorsFor(card, pool, "translation"),
  };
  const choice = [TaskType.WORD_BY_TRANSLATION, TaskType.TRANSLATION_BY_WORD, ...(explained ? [TaskType.WORD_BY_EXPLANATION] : [])].filter(
    (t) => distractors[fieldOf(t)].length >= 3,
  );
  const typing = typeable(card.word) ? [TaskType.WRITE_WORD_BY_TRANSLATION, ...(explained ? [TaskType.WRITE_WORD_BY_EXPLANATION] : [])] : [];

  // «Вперемешку» — сначала выбор или ввод поровну, потом задание внутри: иначе слова с описанием
  // чаще получали бы выбор
  const wanted = answers === "choice" ? choice : answers === "type" ? typing : choice.length && typing.length ? (random() < 0.5 ? choice : typing) : [];
  const types = wanted.length ? wanted : choice.length ? choice : typing.length ? typing : [TaskType.WRITE_WORD_BY_TRANSLATION];
  const type = types[Math.min(types.length - 1, Math.floor(random() * types.length))];

  const field = fieldOf(type);
  return {
    type,
    prompt: promptOf(card, type),
    options: isTyping(type) ? undefined : shuffle([...distractors[field].slice(0, 3), card[field]]),
    correctAnswer: card[field],
    card,
  };
}

export const buildQuestions = (cards: Card[], answers: QuizAnswers, pool: Card[], random: () => number = Math.random): QuizQuestion[] =>
  cards.map((card) => questionFor(card, answers, pool, random));

/**
 * Слова набора с тем же переводом — при вводе их засчитать нельзя (спрашиваем конкретное слово),
 * но и ошибкой это не считаем: «lykkelig — тоже „счастливый“, здесь другое слово»
 */
export function synonymsOf(card: Card, pool: Card[]): string[] {
  const meaning = normalizeAnswer(card.translation);
  const own = normalizeAnswer(card.word);
  if (!meaning) return [];
  return pool.filter((c) => c.id !== card.id && normalizeAnswer(c.translation) === meaning && normalizeAnswer(c.word) !== own).map((c) => c.word);
}
