import type { Language } from './languages';

// Язык страны, где сейчас находится человек, — по часовому поясу устройства.
// Пояс телефон и компьютер обычно ставят сами по месту, его можно прочитать сразу,
// без запросов и без геолокации: ничего никуда не отправляем, сайт сразу открывается на нужном языке.
// Берём официальный язык страны из тех, что есть на сайте; если их несколько — самый распространённый
// (Швейцария → немецкий, Бельгия и Люксембург → французский). Страны, языка которых нет, здесь не перечислены:
// для них остаётся английский. Английские страны тоже не перечислены — английский и так по умолчанию.
// Браузеры отдают имена поясов по CLDR, где живут старые написания (Europe/Kiev, America/Buenos_Aires),
// поэтому держим и старые, и новые.
const ZONES: Partial<Record<Language, readonly string[]>> = {
  no: ['Europe/Oslo', 'Arctic/Longyearbyen', 'Atlantic/Jan_Mayen'],
  uk: ['Europe/Kyiv', 'Europe/Kiev', 'Europe/Uzhgorod', 'Europe/Zaporozhye', 'Europe/Simferopol'],
  // Россия, а ещё Беларусь, Казахстан и Кыргызстан, где русский — официальный язык
  ru: [
    'Europe/Moscow', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd', 'Europe/Saratov',
    'Europe/Ulyanovsk', 'Europe/Astrakhan', 'Europe/Kirov', 'Asia/Yekaterinburg', 'Asia/Omsk',
    'Asia/Novosibirsk', 'Asia/Barnaul', 'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk',
    'Asia/Irkutsk', 'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga', 'Asia/Vladivostok', 'Asia/Ust-Nera',
    'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk', 'Asia/Kamchatka', 'Asia/Anadyr',
    'Europe/Minsk',
    'Asia/Almaty', 'Asia/Qostanay', 'Asia/Qyzylorda', 'Asia/Aqtobe', 'Asia/Aqtau', 'Asia/Atyrau', 'Asia/Oral',
    'Asia/Bishkek',
  ],
  // Германия, Австрия, Швейцария, Лихтенштейн
  de: ['Europe/Berlin', 'Europe/Busingen', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Vaduz'],
  // Франция с заморскими территориями, Бельгия, Люксембург, Монако, Гаити и страны Африки с французским
  fr: [
    'Europe/Paris', 'Europe/Monaco', 'Europe/Brussels', 'Europe/Luxembourg',
    'America/Guadeloupe', 'America/Martinique', 'America/Cayenne', 'America/Miquelon',
    'America/St_Barthelemy', 'America/Marigot', 'Indian/Reunion', 'Indian/Mayotte', 'Indian/Kerguelen',
    'Pacific/Noumea', 'Pacific/Tahiti', 'Pacific/Marquesas', 'Pacific/Gambier', 'Pacific/Wallis',
    'America/Port-au-Prince',
    'Africa/Dakar', 'Africa/Abidjan', 'Africa/Conakry', 'Africa/Niamey', 'Africa/Lome', 'Africa/Porto-Novo',
    'Africa/Douala', 'Africa/Libreville', 'Africa/Brazzaville', 'Africa/Kinshasa', 'Africa/Lubumbashi',
    'Africa/Bangui', 'Africa/Ndjamena', 'Africa/Kigali', 'Africa/Bujumbura', 'Africa/Djibouti',
    'Indian/Comoro', 'Indian/Antananarivo',
  ],
  // Испания и испаноязычная Америка
  es: [
    'Europe/Madrid', 'Africa/Ceuta', 'Atlantic/Canary', 'Africa/Malabo',
    'America/Mexico_City', 'America/Cancun', 'America/Merida', 'America/Monterrey', 'America/Matamoros',
    'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Ojinaga', 'America/Mazatlan',
    'America/Bahia_Banderas', 'America/Hermosillo', 'America/Tijuana',
    'America/Guatemala', 'America/Tegucigalpa', 'America/El_Salvador', 'America/Managua',
    'America/Costa_Rica', 'America/Panama', 'America/Havana', 'America/Santo_Domingo', 'America/Puerto_Rico',
    'America/Bogota', 'America/Caracas', 'America/Guayaquil', 'Pacific/Galapagos', 'America/Lima',
    'America/La_Paz', 'America/Santiago', 'America/Punta_Arenas', 'Pacific/Easter',
    'America/Montevideo', 'America/Asuncion',
    'America/Buenos_Aires', 'America/Cordoba', 'America/Catamarca', 'America/Jujuy', 'America/Mendoza',
    'America/Argentina/Buenos_Aires', 'America/Argentina/Cordoba', 'America/Argentina/Salta',
    'America/Argentina/Jujuy', 'America/Argentina/Tucuman', 'America/Argentina/Catamarca',
    'America/Argentina/La_Rioja', 'America/Argentina/San_Juan', 'America/Argentina/Mendoza',
    'America/Argentina/San_Luis', 'America/Argentina/Rio_Gallegos', 'America/Argentina/Ushuaia',
  ],
  // Бразилия, а ещё Португалия и португалоязычная Африка: ближе бразильского португальского у нас ничего нет
  'pt-BR': [
    'America/Sao_Paulo', 'America/Bahia', 'America/Fortaleza', 'America/Recife', 'America/Maceio',
    'America/Belem', 'America/Araguaina', 'America/Santarem', 'America/Manaus', 'America/Porto_Velho',
    'America/Boa_Vista', 'America/Cuiaba', 'America/Campo_Grande', 'America/Rio_Branco',
    'America/Eirunepe', 'America/Noronha',
    'Europe/Lisbon', 'Atlantic/Azores', 'Atlantic/Madeira',
    'Africa/Luanda', 'Africa/Maputo', 'Atlantic/Cape_Verde', 'Africa/Bissau', 'Africa/Sao_Tome', 'Asia/Dili',
  ],
};

const BY_ZONE = new Map<string, Language>(
  (Object.entries(ZONES) as [Language, readonly string[]][]).flatMap(([lang, zones]) =>
    zones.map((zone) => [zone, lang] as const),
  ),
);

export const languageForTimeZone = (timeZone: string | undefined): Language | undefined =>
  timeZone ? BY_ZONE.get(timeZone) : undefined;

// Пояс устройства. В старых браузерах Intl может не знать пояс — тогда страну не определяем
export const deviceTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};
