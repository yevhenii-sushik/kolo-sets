// Удобства теста на этом устройстве, как и у флэшкарт, — в localStorage: настройки (общие для всех
// наборов), итог последней проверки каждого слова по набору (с ошибок начнётся следующий тест, из
// верных складывается путь «верно 48 из 300») и точность прошлых тестов для сравнения.
// Это не данные аккаунта: память о словах — в расписании Perigee

import { DEFAULT_QUIZ_SETTINGS, QUIZ_ANSWERS, QUIZ_LENGTHS, QuizAnswers, QuizChecks, QuizHistory, QuizLength, QuizSettings } from "./plan";

const PREFS_KEY = "kolo_quiz_prefs";
const checksKey = (collectionId: string) => `kolo_quiz_checks_${collectionId}`;
const historyKey = (collectionId: string) => `kolo_quiz_hist_${collectionId}`;

export function parseQuizPrefs(raw: string | null): QuizSettings {
  if (!raw) return DEFAULT_QUIZ_SETTINGS;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof QuizSettings, unknown>>;
    if (!v || typeof v !== "object") return DEFAULT_QUIZ_SETTINGS;
    return {
      length: QUIZ_LENGTHS.includes(v.length as QuizLength) ? (v.length as QuizLength) : DEFAULT_QUIZ_SETTINGS.length,
      answers: QUIZ_ANSWERS.includes(v.answers as QuizAnswers) ? (v.answers as QuizAnswers) : DEFAULT_QUIZ_SETTINGS.answers,
    };
  } catch {
    return DEFAULT_QUIZ_SETTINGS;
  }
}

export function readQuizPrefs(): QuizSettings {
  try {
    return parseQuizPrefs(localStorage.getItem(PREFS_KEY));
  } catch {
    return DEFAULT_QUIZ_SETTINGS;
  }
}

export function saveQuizPrefs(prefs: QuizSettings) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Хранилище недоступно — настройки проживут до конца захода
  }
}

export function parseChecks(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const v: unknown = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, boolean> = {};
    for (const [id, ok] of Object.entries(v)) if (typeof ok === "boolean") out[id] = ok;
    return out;
  } catch {
    return {};
  }
}

export function readChecks(collectionId: string): QuizChecks {
  try {
    return parseChecks(localStorage.getItem(checksKey(collectionId)));
  } catch {
    return {};
  }
}

// Первый ответ на слово в тесте: верно или ошибка. Пишем сразу, а не в конце: ошибки брошенного теста
// тоже стоит проверить первыми. Удалённые из набора слова вычищаем, чтобы запись не росла
export function markAnswer(collectionId: string, cardId: string, correct: boolean, cardIds?: readonly string[]) {
  try {
    const checks = parseChecks(localStorage.getItem(checksKey(collectionId)));
    checks[cardId] = correct;
    if (cardIds) {
      const alive = new Set(cardIds);
      for (const id of Object.keys(checks)) if (!alive.has(id)) delete checks[id];
    }
    localStorage.setItem(checksKey(collectionId), JSON.stringify(checks));
  } catch {
    // Без хранилища тест просто начнётся без приоритета ошибок
  }
}

export function parseHistory(raw: string | null): QuizHistory {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof QuizHistory, unknown>>;
    if (!v || typeof v !== "object") return {};
    const pct = (x: unknown) => (typeof x === "number" && x >= 0 && x <= 100 ? x : undefined);
    return { last: pct(v.last), best: pct(v.best) };
  } catch {
    return {};
  }
}

export function readHistory(collectionId: string): QuizHistory {
  try {
    return parseHistory(localStorage.getItem(historyKey(collectionId)));
  } catch {
    return {};
  }
}

export function saveHistory(collectionId: string, history: QuizHistory) {
  try {
    localStorage.setItem(historyKey(collectionId), JSON.stringify(history));
  } catch {
    // Сравнение с прошлым разом просто не покажется
  }
}
