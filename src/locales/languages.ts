import { languageForTimeZone } from './regionLanguages';

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

const matchBrowserLanguage = (tags: readonly string[]): Language | undefined => {
  for (const tag of tags) {
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === tag.toLowerCase());
    if (exact) return exact.code;
    const base = tag.toLowerCase().split('-')[0];
    const match = LANGUAGES.find((l) => l.code === base)?.code ?? BROWSER_ALIASES[base];
    if (match) return match;
  }
  return undefined;
};

// Язык при первом заходе, пока человек сам ничего не выбрал.
// Сайт открывается на языке страны, где человек находится (по часовому поясу, см. regionLanguages.ts),
// а если языка этой страны у нас нет — на английском.
// Исключение — браузер, настроенный на один из наших языков, кроме английского: это осознанный выбор,
// и он важнее страны. Иначе украинец в Норвегии с украинским телефоном увидел бы сайт на норвежском,
// который он только собирается учить. Английский браузер ничего не говорит — он стоит по умолчанию у многих.
export const pickLanguage = (browserTags: readonly string[], timeZone: string | undefined): Language => {
  const browser = matchBrowserLanguage(browserTags);
  if (browser && browser !== DEFAULT_LANGUAGE) return browser;
  return languageForTimeZone(timeZone) ?? DEFAULT_LANGUAGE;
};

// Язык при запуске.
// saved — язык, который человек выбрал сам или который закрепился при входе (I18nContext).
// returning — на устройстве уже пользовались Kolo, а язык не сохранён. Так было до 0.4.1: язык брался
// из браузера и не запоминался. Правило по стране сменило бы такому человеку язык без спроса
// (английский телефон в Норвегии → норвежский интерфейс), поэтому ему остаётся язык браузера.
export const startLanguage = ({
  saved,
  returning,
  browserTags,
  timeZone,
}: {
  saved: string | null;
  returning: boolean;
  browserTags: readonly string[];
  timeZone: string | undefined;
}): Language => {
  const known = LANGUAGES.find((l) => l.code === saved);
  if (known) return known.code;
  if (returning) return matchBrowserLanguage(browserTags) ?? DEFAULT_LANGUAGE;
  return pickLanguage(browserTags, timeZone);
};

export const deviceLanguageTags = (): string[] => {
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language];
  return tags.filter(Boolean);
};
