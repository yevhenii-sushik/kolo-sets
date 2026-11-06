// Единый список языков интерфейса. Порядок = порядок во всех переключателях.
// Как принято (Википедия, Google, Apple): каждый язык назван на нём самом и стоит
// по алфавиту этих названий — сначала латиница, потом кириллица. Новый язык
// вставляйте на его место по алфавиту, а не в конец.
// app: true — переведено всё приложение; false — пока только лендинг
// (остальные разделы берутся из английского, см. locales/index.ts).
export const LANGUAGES = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', htmlLang: 'de', app: false },
  { code: 'en', label: 'English', flag: '🇬🇧', htmlLang: 'en', app: true },
  { code: 'es', label: 'Español', flag: '🇪🇸', htmlLang: 'es', app: false },
  { code: 'fr', label: 'Français', flag: '🇫🇷', htmlLang: 'fr', app: false },
  { code: 'no', label: 'Norsk', flag: '🇳🇴', htmlLang: 'nb', app: true },
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷', htmlLang: 'pt-BR', app: false },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', htmlLang: 'ru', app: true },
  { code: 'uk', label: 'Українська', flag: '🇺🇦', htmlLang: 'uk', app: true },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];
export type LanguageInfo = (typeof LANGUAGES)[number];

export const APP_LANGUAGES = LANGUAGES.filter((l) => l.app);

// Язык по умолчанию — английский (не первый в списке: список отсортирован по алфавиту)
export const DEFAULT_LANGUAGE: Language = 'en';

export const getLanguageInfo = (code: Language): LanguageInfo =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES.find((l) => l.code === DEFAULT_LANGUAGE)!;

// Браузерный тег → язык интерфейса: сначала точное совпадение (pt-BR),
// потом по основному коду (pt-PT → pt-BR, nb/nn → no)
const BROWSER_ALIASES: Record<string, Language> = { pt: 'pt-BR', nb: 'no', nn: 'no' };

export const detectBrowserLanguage = (): Language => {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of tags) {
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === tag.toLowerCase());
    if (exact) return exact.code;
    const base = tag.toLowerCase().split('-')[0];
    const match = LANGUAGES.find((l) => l.code === base)?.code ?? BROWSER_ALIASES[base];
    if (match) return match;
  }
  return DEFAULT_LANGUAGE;
};
