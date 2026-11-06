// Каталог языков, которые можно учить в Kolo (не путать с языками интерфейса — src/locales/languages.ts).
// Названия не храним: их даёт Intl.DisplayNames на языке интерфейса, самоназвание — на самом языке.

export interface CourseVariant {
  voice: string; // BCP-47 для озвучки: 'en-GB', 'pt-BR'…
  flag?: string; // флаг страны варианта; у языков без «своей» страны — нет
}

export interface CourseLanguage {
  code: string; // он же id курса
  variants: CourseVariant[]; // первый — по умолчанию
  rtl?: boolean;
  popular?: boolean;
  // Код для названия, если короче и привычнее: «норвежский» вместо «норвежский букмол»
  nameCode?: string;
}

const v = (voice: string, flag?: string): CourseVariant => ({ voice, flag });

export const COURSE_LANGUAGES: CourseLanguage[] = [
  { code: "en", popular: true, variants: [v("en-GB", "🇬🇧"), v("en-US", "🇺🇸"), v("en-AU", "🇦🇺")] },
  { code: "es", popular: true, variants: [v("es-ES", "🇪🇸"), v("es-MX", "🇲🇽")] },
  { code: "de", popular: true, variants: [v("de-DE", "🇩🇪"), v("de-AT", "🇦🇹"), v("de-CH", "🇨🇭")] },
  { code: "fr", popular: true, variants: [v("fr-FR", "🇫🇷"), v("fr-CA", "🇨🇦")] },
  { code: "it", popular: true, variants: [v("it-IT", "🇮🇹")] },
  { code: "nb", popular: true, nameCode: "no", variants: [v("nb-NO", "🇳🇴")] },
  { code: "sv", popular: true, variants: [v("sv-SE", "🇸🇪")] },
  { code: "pt", popular: true, variants: [v("pt-BR", "🇧🇷"), v("pt-PT", "🇵🇹")] },
  { code: "pl", popular: true, variants: [v("pl-PL", "🇵🇱")] },
  { code: "uk", popular: true, variants: [v("uk-UA", "🇺🇦")] },
  { code: "ja", popular: true, variants: [v("ja-JP", "🇯🇵")] },
  { code: "ko", popular: true, variants: [v("ko-KR", "🇰🇷")] },
  { code: "zh", popular: true, variants: [v("zh-CN", "🇨🇳"), v("zh-TW", "🇹🇼")] },
  { code: "tr", popular: true, variants: [v("tr-TR", "🇹🇷")] },
  { code: "ar", popular: true, rtl: true, variants: [v("ar-SA", "🇸🇦"), v("ar-EG", "🇪🇬")] },

  { code: "bg", variants: [v("bg-BG", "🇧🇬")] },
  { code: "bn", variants: [v("bn-BD", "🇧🇩")] },
  { code: "ca", variants: [v("ca-ES")] },
  { code: "cs", variants: [v("cs-CZ", "🇨🇿")] },
  { code: "cy", variants: [v("cy-GB")] },
  { code: "da", variants: [v("da-DK", "🇩🇰")] },
  { code: "el", variants: [v("el-GR", "🇬🇷")] },
  { code: "eo", variants: [v("eo")] },
  { code: "et", variants: [v("et-EE", "🇪🇪")] },
  { code: "eu", variants: [v("eu-ES")] },
  { code: "fa", rtl: true, variants: [v("fa-IR", "🇮🇷")] },
  { code: "fi", variants: [v("fi-FI", "🇫🇮")] },
  { code: "fil", variants: [v("fil-PH", "🇵🇭")] },
  { code: "ga", variants: [v("ga-IE", "🇮🇪")] },
  { code: "he", rtl: true, variants: [v("he-IL", "🇮🇱")] },
  { code: "hi", variants: [v("hi-IN", "🇮🇳")] },
  { code: "hr", variants: [v("hr-HR", "🇭🇷")] },
  { code: "hu", variants: [v("hu-HU", "🇭🇺")] },
  { code: "hy", variants: [v("hy-AM", "🇦🇲")] },
  { code: "id", variants: [v("id-ID", "🇮🇩")] },
  { code: "is", variants: [v("is-IS", "🇮🇸")] },
  { code: "ka", variants: [v("ka-GE", "🇬🇪")] },
  { code: "kk", variants: [v("kk-KZ", "🇰🇿")] },
  { code: "la", variants: [v("la")] },
  { code: "lt", variants: [v("lt-LT", "🇱🇹")] },
  { code: "lv", variants: [v("lv-LV", "🇱🇻")] },
  { code: "mk", variants: [v("mk-MK", "🇲🇰")] },
  { code: "ms", variants: [v("ms-MY", "🇲🇾")] },
  { code: "nl", variants: [v("nl-NL", "🇳🇱"), v("nl-BE", "🇧🇪")] },
  { code: "nn", variants: [v("nn-NO", "🇳🇴")] },
  { code: "ro", variants: [v("ro-RO", "🇷🇴")] },
  { code: "ru", variants: [v("ru-RU", "🇷🇺")] },
  { code: "se", variants: [v("se-NO")] },
  { code: "sk", variants: [v("sk-SK", "🇸🇰")] },
  { code: "sl", variants: [v("sl-SI", "🇸🇮")] },
  { code: "sq", variants: [v("sq-AL", "🇦🇱")] },
  { code: "sr", variants: [v("sr-RS", "🇷🇸")] },
  { code: "sw", variants: [v("sw-KE")] },
  { code: "th", variants: [v("th-TH", "🇹🇭")] },
  { code: "ur", rtl: true, variants: [v("ur-PK", "🇵🇰")] },
  { code: "vi", variants: [v("vi-VN", "🇻🇳")] },
  { code: "yue", variants: [v("zh-HK", "🇭🇰")] },
];

const BY_CODE = new Map(COURSE_LANGUAGES.map((l) => [l.code, l]));

export const getCourseLanguage = (code: string): CourseLanguage | undefined => BY_CODE.get(code);

// Код курса из языка набора: 'nb-NO' → 'nb', 'no' → 'nb', 'pt-BR' → 'pt', 'zh-HK' → 'yue'
export function courseCodeFromLanguage(language: string | undefined): string {
  if (!language) return "nb"; // старые наборы без языка — норвежские
  const lower = language.toLowerCase();
  if (lower === "zh-hk") return "yue";
  const base = lower.split(/[-_]/)[0];
  if (base === "no") return "nb";
  return BY_CODE.has(base) ? base : base || "nb";
}

const capitalize = (s: string, locale: string) => (s ? s.charAt(0).toLocaleUpperCase(locale) + s.slice(1) : s);

// «Норвежский», «Английский» — на языке интерфейса
export function courseName(code: string, uiLocale: string): string {
  const nameCode = getCourseLanguage(code)?.nameCode ?? code;
  try {
    return capitalize(new Intl.DisplayNames([uiLocale], { type: "language" }).of(nameCode) ?? code, uiLocale);
  } catch {
    return code;
  }
}

// «Norsk», «English», «日本語» — самоназвание
export function courseEndonym(code: string): string {
  const nameCode = getCourseLanguage(code)?.nameCode ?? code;
  try {
    return capitalize(new Intl.DisplayNames([nameCode], { type: "language" }).of(nameCode) ?? code, nameCode);
  } catch {
    return code;
  }
}

// «США», «Великобритания» — для выбора варианта произношения
export function variantRegionName(voice: string, uiLocale: string): string | undefined {
  const region = voice.split("-")[1];
  if (!region || region.length !== 2) return undefined;
  try {
    return new Intl.DisplayNames([uiLocale], { type: "region" }).of(region);
  } catch {
    return undefined;
  }
}

export function courseFlag(code: string, voice?: string): string | undefined {
  const lang = getCourseLanguage(code);
  if (!lang) return undefined;
  return (lang.variants.find((x) => x.voice === voice) ?? lang.variants[0]).flag;
}

export const defaultVoice = (code: string): string => getCourseLanguage(code)?.variants[0].voice ?? code;

export const isRtl = (code: string): boolean => Boolean(getCourseLanguage(code)?.rtl);
