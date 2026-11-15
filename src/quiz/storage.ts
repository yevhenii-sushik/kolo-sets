// Удобства теста на этом устройстве, как и у флэшкарт, — в localStorage: настройки (общие для всех
// наборов) и ошибки прошлого теста по каждому набору — с них начнётся следующий тест.
// Это не данные аккаунта: память о словах — в расписании Perigee

import { DEFAULT_QUIZ_SETTINGS, QUIZ_ANSWERS, QUIZ_LENGTHS, QuizAnswers, QuizLength, QuizSettings } from "./plan";

const PREFS_KEY = "kolo_quiz_prefs";
const missKey = (collectionId: string) => `kolo_quiz_miss_${collectionId}`;

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

export function parseMisses(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const v: unknown = JSON.parse(raw);
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

export function readMisses(collectionId: string): Set<string> {
  try {
    return parseMisses(localStorage.getItem(missKey(collectionId)));
  } catch {
    return new Set();
  }
}

// Первый ответ на слово в тесте: ошибка — слово в список, верно — из списка. Пишем сразу, а не в конце:
// ошибки брошенного теста тоже стоит проверить первыми
export function markAnswer(collectionId: string, cardId: string, correct: boolean) {
  try {
    const misses = readMisses(collectionId);
    if (correct) misses.delete(cardId);
    else misses.add(cardId);
    if (misses.size) localStorage.setItem(missKey(collectionId), JSON.stringify([...misses]));
    else localStorage.removeItem(missKey(collectionId));
  } catch {
    // Без хранилища тест просто начнётся без приоритета ошибок
  }
}
