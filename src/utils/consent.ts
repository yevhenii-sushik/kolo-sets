// Согласие на необязательное хранилище (cookie / localStorage).
// Сейчас Kolo использует только необходимое; категория analytics заведена заранее:
// любая будущая аналитика (напр. Firebase Analytics — measurementId уже в конфиге)
// должна стартовать только при hasConsent('analytics').
// Поменялись категории или цели — подними CONSENT_VERSION, и баннер спросит заново.
export const CONSENT_VERSION = 1;

const CONSENT_KEY = 'kolo_cookie_consent';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // переспрашиваем раз в 12 месяцев
export const OPEN_SETTINGS_EVENT = 'kolo:cookie-settings';

export type ConsentCategory = 'analytics';

export interface ConsentState {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

export const getConsent = (): ConsentState | null => {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const consent = JSON.parse(raw) as ConsentState;
    if (consent.version !== CONSENT_VERSION) return null;
    if (Date.now() - Date.parse(consent.decidedAt) > MAX_AGE_MS) return null;
    return consent;
  } catch {
    return null;
  }
};

export const saveConsent = (choices: Pick<ConsentState, ConsentCategory>): ConsentState => {
  const consent = { version: CONSENT_VERSION, ...choices, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
  } catch {
    // Приватный режим / заблокированное хранилище — баннер просто покажется снова
  }
  return consent;
};

export const hasConsent = (category: ConsentCategory): boolean => getConsent()?.[category] === true;

// Открыть настройки из любого места (ссылка в футере, страница Cookie Policy)
export const openCookieSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
