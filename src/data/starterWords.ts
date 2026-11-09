// Первые пять слов для нового набора — сценарий «Добавь 5 слов» в «Первых шагах» на главной.
// Понятия: привет, спасибо, да, нет, вода. Здесь — слова на изучаемом языке (по коду курса,
// src/courses/languages.ts); переводы — на языке интерфейса, в locales/*/home.json → firstSteps.guides.words.starter.
// Языка нет в списке — сценарий предложит ввести слова самому

type Five = readonly [hello: string, thanks: string, yes: string, no: string, water: string];

const WORDS: Record<string, Five> = {
  en: ["hello", "thank you", "yes", "no", "water"],
  es: ["hola", "gracias", "sí", "no", "agua"],
  de: ["hallo", "danke", "ja", "nein", "Wasser"],
  fr: ["bonjour", "merci", "oui", "non", "eau"],
  it: ["ciao", "grazie", "sì", "no", "acqua"],
  nb: ["hei", "takk", "ja", "nei", "vann"],
  nn: ["hei", "takk", "ja", "nei", "vatn"],
  sv: ["hej", "tack", "ja", "nej", "vatten"],
  da: ["hej", "tak", "ja", "nej", "vand"],
  is: ["halló", "takk", "já", "nei", "vatn"],
  fi: ["hei", "kiitos", "kyllä", "ei", "vesi"],
  et: ["tere", "aitäh", "jah", "ei", "vesi"],
  pt: ["olá", "obrigado", "sim", "não", "água"],
  pl: ["cześć", "dziękuję", "tak", "nie", "woda"],
  uk: ["привіт", "дякую", "так", "ні", "вода"],
  ru: ["привет", "спасибо", "да", "нет", "вода"],
  bg: ["здравей", "благодаря", "да", "не", "вода"],
  mk: ["здраво", "благодарам", "да", "не", "вода"],
  sr: ["здраво", "хвала", "да", "не", "вода"],
  hr: ["bok", "hvala", "da", "ne", "voda"],
  sl: ["živjo", "hvala", "da", "ne", "voda"],
  cs: ["ahoj", "děkuji", "ano", "ne", "voda"],
  sk: ["ahoj", "ďakujem", "áno", "nie", "voda"],
  hu: ["szia", "köszönöm", "igen", "nem", "víz"],
  ro: ["salut", "mulțumesc", "da", "nu", "apă"],
  lt: ["labas", "ačiū", "taip", "ne", "vanduo"],
  lv: ["sveiki", "paldies", "jā", "nē", "ūdens"],
  el: ["γεια σου", "ευχαριστώ", "ναι", "όχι", "νερό"],
  sq: ["përshëndetje", "faleminderit", "po", "jo", "ujë"],
  nl: ["hallo", "dank je", "ja", "nee", "water"],
  ca: ["hola", "gràcies", "sí", "no", "aigua"],
  eu: ["kaixo", "eskerrik asko", "bai", "ez", "ura"],
  cy: ["helo", "diolch", "ie", "na", "dŵr"],
  ga: ["dia duit", "go raibh maith agat", "sea", "ní hea", "uisce"],
  la: ["salve", "gratias", "ita", "non", "aqua"],
  eo: ["saluton", "dankon", "jes", "ne", "akvo"],
  tr: ["merhaba", "teşekkürler", "evet", "hayır", "su"],
  kk: ["сәлем", "рақмет", "иә", "жоқ", "су"],
  hy: ["բարև", "շնորհակալություն", "այո", "ոչ", "ջուր"],
  ka: ["გამარჯობა", "მადლობა", "კი", "არა", "წყალი"],
  ar: ["مرحبا", "شكرا", "نعم", "لا", "ماء"],
  he: ["שלום", "תודה", "כן", "לא", "מים"],
  fa: ["سلام", "متشکرم", "بله", "نه", "آب"],
  ur: ["سلام", "شکریہ", "ہاں", "نہیں", "پانی"],
  hi: ["नमस्ते", "धन्यवाद", "हाँ", "नहीं", "पानी"],
  th: ["สวัสดี", "ขอบคุณ", "ใช่", "ไม่ใช่", "น้ำ"],
  vi: ["xin chào", "cảm ơn", "vâng", "không", "nước"],
  id: ["halo", "terima kasih", "ya", "tidak", "air"],
  ms: ["helo", "terima kasih", "ya", "tidak", "air"],
  fil: ["kumusta", "salamat", "oo", "hindi", "tubig"],
  sw: ["habari", "asante", "ndiyo", "hapana", "maji"],
  ja: ["こんにちは", "ありがとう", "はい", "いいえ", "水"],
  ko: ["안녕하세요", "감사합니다", "네", "아니요", "물"],
  zh: ["你好", "谢谢", "是", "不", "水"],
  yue: ["你好", "多謝", "係", "唔係", "水"],
};

// Пары «слово — перевод» для курса; null — для этого языка готовых слов нет
export function starterWords(courseCode: string, translations: readonly string[]): { word: string; translation: string }[] | null {
  const words = WORDS[courseCode];
  if (!words || translations.length !== words.length) return null;
  return words.map((word, i) => ({ word, translation: translations[i] }));
}
