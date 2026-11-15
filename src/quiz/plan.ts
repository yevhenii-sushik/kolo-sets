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

/**
 * Итог последней проверки каждого слова в тесте по набору: true — верно, false — ошибка, нет — ещё не
 * проверялось. Из этого — ошибки прошлого теста (их спрашиваем первыми) и путь «верно 48 из 300»
 */
export type QuizChecks = Readonly<Record<string, boolean>>;

// Чем меньше, тем раньше в порции
function rank(card: Card, checks: QuizChecks, now: Date): number {
  if (checks[card.id] === false) return 0; // ошибся в прошлый раз — проверим первым
  if (isNewCard(card)) return 4; // ещё не встречал — в самом конце
  if (isDueAt(card, now)) return 1;
  if (memoryStrength(card) === 1) return 2; // учится: интервал меньше недели
  return 3;
}

/**
 * Слова для теста по важности, в случайном порядке вопросов.
 * checks — итоги прошлых проверок по этому набору; exclude — уже спрошенные в этот заход («Следующие 20»)
 */
export function pickQuizCards(
  cards: Card[],
  { length, checks = {}, exclude = new Set(), now = new Date() }: { length: QuizLength; checks?: QuizChecks; exclude?: ReadonlySet<string>; now?: Date },
): Card[] {
  const pool = cards
    .map((card, index) => ({ card, index, rank: rank(card, checks, now), checked: card.id in checks }))
    .filter((x) => !exclude.has(x.card.id));
  pool.sort(
    (a, b) =>
      a.rank - b.rank ||
      // Слабые и крепкие: сначала ещё не проверенные тестом — так за несколько заходов тест проходит весь набор
      (a.rank === 2 || a.rank === 3 ? Number(a.checked) - Number(b.checked) : 0) ||
      // Новые — по порядку набора; остальные — кому раньше на повторение (самые просроченные первыми)
      (a.rank === 4 ? a.index - b.index : time(a.card.srsData?.nextReview) - time(b.card.srsData?.nextReview)),
  );
  return shuffle(pool.slice(0, portionSize(pool.length, length)).map((x) => x.card));
}

const fieldOf = (type: TaskType): "word" | "translation" =>
  type === TaskType.TRANSLATION_BY_WORD || type === TaskType.LISTEN ? "translation" : "word";

function promptOf(card: Card, type: TaskType): string {
  switch (type) {
    case TaskType.TRANSLATION_BY_WORD:
    case TaskType.LISTEN: // звучит слово; на экране оно появится после ответа
      return card.word;
    case TaskType.WORD_BY_EXPLANATION:
    case TaskType.WRITE_WORD_BY_EXPLANATION:
      return card.explanation;
    default:
      return card.translation;
  }
}

// «Вперемешку»: доля ввода по силе памяти слова (memoryStrength 0–3). Узнать среди вариантов легче,
// вспомнить и написать — труднее и полезнее: свежие слова чаще выбором, крепкие чаще вводом. Не всегда:
// разнообразие держит в тонусе
export const MIXED_TYPING = [0.15, 0.35, 0.65, 0.85] as const;
// Вопрос на слух — изредка, вместо одного из заданий с выбором (как аудирование в сессии Perigee)
const LISTEN_SHARE = 0.2;

export interface QuestionOptions {
  random?: () => number;
  canListen?: boolean; // есть голос для языка курса и звук не выключен
}

/**
 * Вопрос о слове. Формат — по настройке «Как отвечать»; вопрос по описанию появляется сам, если оно
 * есть у слова, на слух — если есть голос. Вариантов без синонимов меньше трёх — спрашиваем вводом
 * (раньше на кнопках были заглушки «[2]»); длинную фразу печатать мучительно — её спрашиваем выбором
 */
export function questionFor(card: Card, answers: QuizAnswers, pool: Card[], { random = Math.random, canListen = false }: QuestionOptions = {}): QuizQuestion {
  const explained = !!card.explanation?.trim();
  const distractors = {
    word: distractorsFor(card, pool, "word"),
    translation: distractorsFor(card, pool, "translation"),
  };
  const choice = [TaskType.WORD_BY_TRANSLATION, TaskType.TRANSLATION_BY_WORD, ...(explained ? [TaskType.WORD_BY_EXPLANATION] : [])].filter(
    (t) => distractors[fieldOf(t)].length >= 3,
  );
  const typing = typeable(card.word) ? [TaskType.WRITE_WORD_BY_TRANSLATION, ...(explained ? [TaskType.WRITE_WORD_BY_EXPLANATION] : [])] : [];

  // «Вперемешку» — сначала выбор или ввод (по силе слова), потом задание внутри: иначе слова с описанием
  // чаще получали бы выбор
  const wanted =
    answers === "choice" ? choice : answers === "type" ? typing : choice.length && typing.length ? (random() < MIXED_TYPING[memoryStrength(card)] ? typing : choice) : [];
  const types = wanted.length ? wanted : choice.length ? choice : typing.length ? typing : [TaskType.WRITE_WORD_BY_TRANSLATION];
  const listen = canListen && types === choice && distractors.translation.length >= 3 && random() < LISTEN_SHARE;
  const type = listen ? TaskType.LISTEN : types[Math.min(types.length - 1, Math.floor(random() * types.length))];

  const field = fieldOf(type);
  return {
    type,
    prompt: promptOf(card, type),
    options: isTyping(type) ? undefined : shuffle([...distractors[field].slice(0, 3), card[field]]),
    correctAnswer: card[field],
    card,
  };
}

export const buildQuestions = (cards: Card[], answers: QuizAnswers, pool: Card[], options: QuestionOptions = {}): QuizQuestion[] =>
  cards.map((card) => questionFor(card, answers, pool, options));

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

// ── Путь по набору и счёт в контексте (docs/specs/perigee.md, «Тест, шаг 2») ──

export interface SetProgress {
  total: number; // слов в наборе
  right: number; // последняя проверка — верно
  wrong: number; // последняя проверка — ошибка
}

/** Сколько слов набора уже проверено тестом и с каким итогом. Удалённые из набора слова не в счёт */
export function setProgress(cards: Card[], checks: QuizChecks): SetProgress {
  let right = 0;
  let wrong = 0;
  for (const c of cards) {
    if (checks[c.id] === true) right += 1;
    else if (checks[c.id] === false) wrong += 1;
  }
  return { total: cards.length, right, wrong };
}

/** Набор сдан: каждое слово в последней проверке отвечено верно */
export const isSetPassed = (p: SetProgress) => p.total > 0 && p.right === p.total;

export interface QuizHistory {
  last?: number; // точность прошлого теста по набору, %
  best?: number; // лучшая точность среди полноценных тестов, %
}

/**
 * Записать точность теста. Рекорд — только у полноценного теста: от 10 вопросов или весь набор, если он
 * меньше. Иначе четыре слова на 100% ставили бы рекорд, который не побить. Первый тест рекордом не считаем
 */
export function recordHistory(prev: QuizHistory, pct: number, questions: number, setSize: number) {
  const full = questions >= Math.min(10, setSize);
  const record = full && prev.best !== undefined && pct > prev.best;
  const history: QuizHistory = { last: pct, best: full ? Math.max(prev.best ?? 0, pct) : prev.best };
  return { history, previous: prev.last, record };
}

// Серия верных ответов: звук «верно» поднимается ступенями и остаётся в до-мажорной пентатонике
// (у answer-correct квинта G–D: сдвиги 0, +2, +5, +7 полутонов — scripts/sounds/README.md)
export const streakPitch = (streak: number) => (streak >= 10 ? 7 : streak >= 6 ? 5 : streak >= 3 ? 2 : 0);
