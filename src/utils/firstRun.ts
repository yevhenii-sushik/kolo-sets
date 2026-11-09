// Знакомство новичка «делом»: короткое вступление, список «Первые шаги» на главной и подсказки на месте
// в первой тренировке. Отметки — в localStorage: это удобство одного устройства, а не данные аккаунта

export const ONBOARDING_STORAGE_KEY = "kolo_onboarding_v1";
const COACH_PREFIX = "kolo_coach_";
const FIRST_STEPS_PREFIX = "kolo_first_steps_";

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Хранилище недоступно (приватный режим) — подсказка просто покажется ещё раз
  }
};

// Подсказки на месте: показываются, пока человек не прошёл это действие до конца
export type Coach = "flashcards";
const COACHES: Coach[] = ["flashcards"];

export const coachSeen = (c: Coach) => read(COACH_PREFIX + c) === "seen";
export const markCoachSeen = (c: Coach) => write(COACH_PREFIX + c, "seen");

// «Первые шаги» на главной: active — список показывали незаконченным (значит, когда всё будет сделано,
// стоит поздравить); done — закрыт. Нет отметки — список ещё не показывали
export type FirstStepsMark = "active" | "done" | null;
export const getFirstSteps = (uid: string): FirstStepsMark => {
  const v = read(FIRST_STEPS_PREFIX + uid);
  return v === "active" || v === "done" ? v : null;
};
export const setFirstSteps = (uid: string, mark: "active" | "done") => write(FIRST_STEPS_PREFIX + uid, mark);

export const onboardingDone = () => !!read(ONBOARDING_STORAGE_KEY);
export const finishOnboarding = () => write(ONBOARDING_STORAGE_KEY, "done");

// «Пройти знакомство заново» (настройки, поддержка): вступление, подсказки и первые шаги — с начала
export function restartOnboarding(uid?: string) {
  write(ONBOARDING_STORAGE_KEY, null);
  COACHES.forEach((c) => write(COACH_PREFIX + c, null));
  if (uid) write(FIRST_STEPS_PREFIX + uid, null);
}
