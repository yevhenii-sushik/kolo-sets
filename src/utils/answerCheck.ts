// Проверка письменного ответа в тесте. Раньше сравнивали строки побуквенно: «smorbrod» вместо «smørbrød»,
// «gå» вместо «å gå» или одна опечатка считались ошибкой — и письменные задания бросали.
// Теперь: точное совпадение → «верно»; без артикля, без диакритики или с одной-двумя опечатками →
// «почти» (засчитываем и показываем правильное написание); остальное → «неверно».

export type AnswerVerdict =
  | { result: "exact" }
  | { result: "close"; reason: "article" | "accents" | "typo" }
  | { result: "wrong" };

// Артикли и частицы инфинитива, которые часто пишут (или не пишут) перед словом.
// Неоднозначные слова («at», «as», «o», «i») не берём: «i dag» без «i» — уже другое слово.
const ARTICLES = new Set([
  "a", "an", "the", "to", // en
  "en", "ei", "et", "ett", "å", "att", // nb, sv, da
  "der", "die", "das", "ein", "eine", "einen", "zu", // de
  "le", "la", "les", "un", "une", // fr
  "el", "los", "las", "una", // es
  "il", "gli", // it
  "um", "uma", // pt
]);

const SPECIAL: Record<string, string> = { ø: "o", æ: "ae", œ: "oe", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th", ı: "i" };

// Регистр, пробелы, кавычки и знаки препинания не важны; апостроф и дефис внутри слова — важны
export function normalizeAnswer(s: string): string {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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

// Допустимые варианты: целиком, части через , ; / и формы со скобками и без: «(to) run» → «run», «to run»
export function answerVariants(correct: string): string[] {
  const parts = [correct, ...correct.split(/[,;/]/)];
  const out = new Set<string>();
  for (const part of parts) {
    out.add(normalizeAnswer(part));
    if (part.includes("(")) {
      out.add(normalizeAnswer(part.replace(/\([^)]*\)/g, " ")));
      out.add(normalizeAnswer(part.replace(/[()]/g, " ")));
    }
  }
  out.delete("");
  return [...out];
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

/**
 * @param input   что ввёл пользователь
 * @param correct правильный ответ с карточки
 * @param others  ответы других карточек набора: если ввели другое слово целиком — это ошибка, а не опечатка
 */
export function checkAnswer(input: string, correct: string, others: string[] = []): AnswerVerdict {
  const answer = normalizeAnswer(input);
  if (!answer) return { result: "wrong" };
  const variants = answerVariants(correct);
  if (variants.includes(answer)) return { result: "exact" };

  const otherWords = new Set(others.flatMap(answerVariants).filter((v) => !variants.includes(v)));
  if (otherWords.has(answer)) return { result: "wrong" };

  // Дальше сравниваем слово без артикля. Если артикль есть и у ответа, и у варианта, он должен совпасть:
  // «ei bil» вместо «en bil» — ошибка (род слова), а не опечатка
  const [article, word] = splitArticle(answer);
  const comparable = variants.map(splitArticle).filter(([a]) => !article || !a || a === article);

  // Забыли артикль или добавили лишний
  if (comparable.some(([, w]) => w === word)) return { result: "close", reason: "article" };

  // Без диакритики и особых букв (в том числе вместе с артиклем: «ga» вместо «å gå»)
  const folded = fold(word);
  if (comparable.some(([, w]) => fold(w) === folded)) return { result: "close", reason: "accents" };

  for (const [, w] of comparable) {
    const target = fold(w);
    const budget = typoBudget(target.length);
    if (budget > 0 && editDistance(folded, target, budget) <= budget) return { result: "close", reason: "typo" };
  }
  return { result: "wrong" };
}
