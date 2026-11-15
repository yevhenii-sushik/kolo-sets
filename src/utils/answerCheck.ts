// Проверка письменного ответа в тесте. Раньше сравнивали строки побуквенно: «smorbrod» вместо «smørbrød»,
// «gå» вместо «å gå» или одна опечатка считались ошибкой — и письменные задания бросали.
// Теперь: точное совпадение → «верно»; без артикля, без диакритики или с одной-двумя опечатками →
// «почти» (засчитываем и показываем, где ошибка); остальное → «неверно».

// expected — вариант правильного ответа, с которым совпало (в написании карточки): по нему
// spellingDiff показывает, где опечатка. У неверного ответа он есть, только если промах небольшой
export type AnswerVerdict =
  | { result: "exact" }
  | { result: "close"; reason: "article" | "accents" | "typo"; expected: string }
  | { result: "wrong"; expected?: string };

// Артикли и частицы инфинитива, которые часто пишут (или не пишут) перед словом.
// Неоднозначные слова («at», «as», «o», «i») не берём: «i dag» без «i» — уже другое слово.
export const ARTICLES = new Set([
  "a", "an", "the", "to", // en
  "en", "ei", "et", "ett", "å", "att", // nb, sv, da
  "der", "die", "das", "ein", "eine", "einen", "zu", // de
  "le", "la", "les", "un", "une", // fr
  "el", "los", "las", "una", // es
  "il", "gli", // it
  "um", "uma", // pt
]);

const SPECIAL: Record<string, string> = { ø: "o", æ: "ae", œ: "oe", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i" };

// Пробелы, кавычки и знаки препинания не важны; апостроф и дефис внутри слова — важны.
// Регистр сохраняем: так правильное написание показывается, как на карточке
function tidy(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeAnswer(s: string): string {
  return tidy(s).toLowerCase();
}

// Без диакритики и особых букв: «smørbrød» → «smorbrod», «Straße» → «strasse»
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[øæœßłđðþı]/g, (ch) => SPECIAL[ch]);
}

// Отделить артикль: «en bil» → ["en", "bil"], «l'homme» → ["l'", "homme"], «bil» → ["", "bil"]
function splitArticle(s: string): [string, string] {
  if (/^l'\S/.test(s)) return ["l'", s.slice(2)];
  const space = s.indexOf(" ");
  return space > 0 && ARTICLES.has(s.slice(0, space)) ? [s.slice(0, space), s.slice(space + 1)] : ["", s];
}

interface Variant {
  norm: string; // для сравнения
  shown: string; // для показа — в написании карточки
}

// Допустимые варианты: целиком, части через , ; / и формы со скобками и без: «(to) run» → «run», «to run»
function variantForms(correct: string): Variant[] {
  const out = new Map<string, string>();
  const add = (s: string) => {
    const shown = tidy(s);
    const norm = shown.toLowerCase();
    if (norm && !out.has(norm)) out.set(norm, shown);
  };
  for (const part of [correct, ...correct.split(/[,;/]/)]) {
    add(part);
    if (part.includes("(")) {
      add(part.replace(/\([^)]*\)/g, " "));
      add(part.replace(/[()]/g, " "));
    }
  }
  return [...out].map(([norm, shown]) => ({ norm, shown }));
}

export function answerVariants(correct: string): string[] {
  return variantForms(correct).map((v) => v.norm);
}

// Сколько опечаток прощаем: в коротких словах любая буква меняет слово
const typoBudget = (length: number) => (length >= 8 ? 2 : length >= 4 ? 1 : 0);

// Расстояние Дамерау — Левенштейна (перестановка соседних букв — одна опечатка)
function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

// Небольшой промах в неверном ответе: «hsu» вместо «hus», «ei bil» вместо «en bil». Засчитать нельзя
// (короткое слово, другой артикль), но показать, где ошибка, — полезно. Совсем другое слово — не промах
function nearMiss(answer: string, variants: Variant[]): string | undefined {
  let best: { shown: string; dist: number } | undefined;
  for (const v of variants) {
    const limit = Math.min(2, Math.floor((Array.from(v.norm).length - 1) / 2));
    if (limit < 1) continue;
    const dist = editDistance(answer, v.norm, limit);
    if (dist <= limit && (!best || dist < best.dist)) best = { shown: v.shown, dist };
  }
  return best?.shown;
}

/**
 * @param input   что ввёл пользователь
 * @param correct правильный ответ с карточки
 * @param others  ответы других карточек набора: если ввели другое слово целиком — это ошибка, а не опечатка
 */
export function checkAnswer(input: string, correct: string, others: string[] = []): AnswerVerdict {
  const answer = normalizeAnswer(input);
  if (!answer) return { result: "wrong" };
  const forms = variantForms(correct);
  const variants = forms.map((v) => v.norm);
  if (variants.includes(answer)) return { result: "exact" };
  const wrong = (): AnswerVerdict => ({ result: "wrong", expected: nearMiss(answer, forms) });

  const otherWords = new Set(others.flatMap(answerVariants).filter((v) => !variants.includes(v)));
  if (otherWords.has(answer)) return wrong();

  // Дальше сравниваем слово без артикля. Если артикль есть и у ответа, и у варианта, он должен совпасть:
  // «ei bil» вместо «en bil» — ошибка (род слова), а не опечатка
  const [article, word] = splitArticle(answer);
  const comparable = forms
    .map((v) => ({ shown: v.shown, parts: splitArticle(v.norm) }))
    .filter(({ parts: [a] }) => !article || !a || a === article);
  const close = (reason: "article" | "accents" | "typo", shown: string): AnswerVerdict => ({ result: "close", reason, expected: shown });

  // Забыли артикль или добавили лишний
  const sameWord = comparable.find(({ parts: [, w] }) => w === word);
  if (sameWord) return close("article", sameWord.shown);

  // Без диакритики и особых букв (в том числе вместе с артиклем: «ga» вместо «å gå»)
  const folded = fold(word);
  const sameLetters = comparable.find(({ parts: [, w] }) => fold(w) === folded);
  if (sameLetters) return close("accents", sameLetters.shown);

  for (const { shown, parts: [, w] } of comparable) {
    const target = fold(w);
    const budget = typoBudget(target.length);
    if (budget > 0 && editDistance(folded, target, budget) <= budget) return close("typo", shown);
  }
  return wrong();
}

// ── «Добавить в карточку» вместо «Мой ответ верный» (docs/specs/perigee.md, «Тест: честный ответ») ──
//
// Засчитать ответ «на слово» нельзя: это обман одним нажатием (набор «сдан», рекорд, «Знаю всё!»).
// Если проверка не знала верного варианта, его можно дописать в карточку — текущий ответ остаётся
// ошибкой, а со следующего раза проверка примет его сама.

/** Предлагать ли «Добавить в карточку»: другое слово, а не опечатка (её видно в разборе) и не слово другой карточки */
export function canAddVariant(input: string, verdict: AnswerVerdict, others: string[]): boolean {
  const answer = normalizeAnswer(input);
  if (!answer || verdict.result !== "wrong" || verdict.expected) return false;
  return !others.some((o) => answerVariants(o).includes(answer));
}

/** Слово карточки с ещё одним допустимым вариантом — в той же записи, что понимает проверка: «glad / lykkelig» */
export const withVariant = (word: string, answer: string): string => `${word.trim()} / ${tidy(answer)}`;

// ── Где ошибка: побуквенное сравнение ответа с правильным написанием ──
//
// typed — ответ пользователя: wrong — не та буква, extra — лишняя, missing — здесь пропущена буква
// (показываем «_»). fixed — правильное написание: fixed — буквы, которые надо было написать иначе.
// Регистр не считается ошибкой, диакритика — считается: «o» вместо «ø» подсветится.

export type DiffMark = "same" | "wrong" | "extra" | "missing" | "fixed";
export interface DiffPart {
  text: string;
  mark: DiffMark;
}

export function spellingDiff(input: string, expected: string): { typed: DiffPart[]; fixed: DiffPart[] } {
  const a = Array.from(tidy(input));
  const b = Array.from(tidy(expected));
  const eq = (x: string, y: string) => x.toLowerCase() === y.toLowerCase();

  // Та же матрица Дамерау — Левенштейна, но без отсечки: нужен путь, а не только расстояние
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (eq(a[i - 1], b[j - 1]) ? 0 : 1));
      if (i > 1 && j > 1 && eq(a[i - 1], b[j - 2]) && eq(a[i - 2], b[j - 1])) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }

  // Обратный проход с конца; при равной цене — замена буквы, а не «лишняя + пропущенная»
  const typed: DiffPart[] = [];
  const fixed: DiffPart[] = [];
  const push = (list: DiffPart[], text: string, mark: DiffMark) => {
    const first = list[0];
    if (first && first.mark === mark) {
      if (mark !== "missing") first.text = text + first.text; // пропуск подряд — один «_»
    } else list.unshift({ text: mark === "missing" ? "_" : text, mark });
  };
  let i = a.length;
  let j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && eq(a[i - 1], b[j - 1]) && d[i][j] === d[i - 1][j - 1]) {
      push(typed, a[i - 1], "same");
      push(fixed, b[j - 1], "same");
      i--;
      j--;
    } else if (i > 1 && j > 1 && eq(a[i - 1], b[j - 2]) && eq(a[i - 2], b[j - 1]) && d[i][j] === d[i - 2][j - 2] + 1) {
      push(typed, a[i - 2] + a[i - 1], "wrong"); // перестановка соседних букв
      push(fixed, b[j - 2] + b[j - 1], "fixed");
      i -= 2;
      j -= 2;
    } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
      push(typed, a[i - 1], "wrong");
      push(fixed, b[j - 1], "fixed");
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      push(typed, a[i - 1], "extra");
      i--;
    } else {
      push(typed, "", "missing");
      push(fixed, b[j - 1], "fixed");
      j--;
    }
  }
  return { typed, fixed };
}
