// Импорт списка слов — чистая логика без React и Firebase (docs/specs/06-audit-fixes.md, шаг 2).
//
// Раньше понимали только «;», и список из Excel, Google Таблиц, Quizlet или Anki (там поля через табуляцию)
// давал «Слова импортированы: 0». Теперь разделитель определяется в каждой строке: табуляция, «;», тире
// с пробелами вокруг (« — », « – », « - ») или «=». Тире без пробелов не разделитель: e-mail и
// составные слова остаются целыми. Запятая — тоже нет: переводы часто через запятую («писать, записывать»).

export interface ImportedWord {
  word: string;
  translation: string;
  explanation: string;
  example: string;
  partOfSpeech: string;
}

export interface ImportLine {
  line: number; // номер строки во вставленном тексте, с 1
  text: string;
}

export interface ParsedImport {
  words: ImportedWord[];
  skipped: ImportLine[]; // нет слова или перевода — показать, что исправить
  duplicates: ImportLine[]; // такое слово с таким же переводом уже есть в наборе или выше в списке
}

// Порядок важен: табуляция побеждает — в строке из таблицы «;» или тире могут быть внутри примера
const SEPARATORS: RegExp[] = [/\t/, /;/, /\s+—\s+/, /\s+–\s+/, /\s+-\s+/, /\s*=\s*/];

// Поле из CSV может прийти в кавычках: "word" → word
const unquote = (s: string) => {
  const t = s.trim();
  return t.length >= 2 && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1).trim() : t;
};

/** Разбить одну строку на поля; null — разделителя нет */
export function splitLine(line: string): string[] | null {
  for (const sep of SEPARATORS) {
    if (sep.test(line)) return line.split(sep).map(unquote);
  }
  return null;
}

// Дубль — то же слово с тем же переводом без учёта регистра и лишних пробелов. Только слово сравнивать нельзя:
// «bank» — берег и «bank» — банк — разные карточки. Диакритику не убираем: в норвежском for и før — разные слова
export const normalizeWord = (s: string) => s.trim().replace(/\s+/g, " ").toLocaleLowerCase();
const keyOf = (word: string, translation: string) => `${normalizeWord(word)}\u0000${normalizeWord(translation)}`;

export function parseImportText(text: string, existing: readonly { word: string; translation: string }[] = []): ParsedImport {
  const seen = new Set(existing.map((c) => keyOf(c.word, c.translation)));
  const result: ParsedImport = { words: [], skipped: [], duplicates: [] };

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    // Пустые строки и служебные строки Anki («#separator:tab», «#html:false») пропускаем молча
    if (!line || line.startsWith("#")) return;
    const ref = { line: i + 1, text: line };
    const parts = splitLine(line);
    const [word = "", translation = "", explanation = "", example = "", partOfSpeech = ""] = parts ?? [];
    if (!word || !translation) {
      result.skipped.push(ref);
      return;
    }
    const key = keyOf(word, translation);
    if (seen.has(key)) {
      result.duplicates.push(ref);
      return;
    }
    seen.add(key);
    result.words.push({ word, translation, explanation, example, partOfSpeech });
  });

  return result;
}
