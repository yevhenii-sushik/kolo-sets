// Части речи храним нейтральным кодом, подпись — на языке интерфейса (t.words.pos).
// Раньше в карточки писались норвежские термины, а в готовых наборах — английские сокращения;
// такие значения переводятся в код при показе и при сохранении. Незнакомое значение показываем как есть.

export const POS_CODES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "numeral",
  "phrase",
] as const;

export type PosCode = (typeof POS_CODES)[number];

const LEGACY: Record<string, PosCode> = {
  substantiv: "noun",
  adjektiv: "adjective",
  pronomen: "pronoun",
  preposisjon: "preposition",
  konjunksjon: "conjunction",
  interjeksjon: "interjection",
  tallord: "numeral",
  "n.": "noun",
  "v.": "verb",
  "adj.": "adjective",
  "adv.": "adverb",
  "pron.": "pronoun",
  "prep.": "preposition",
  "conj.": "conjunction",
  "excl.": "interjection",
  "num.": "numeral",
  "phr.": "phrase",
};

const isCode = (v: string): v is PosCode => (POS_CODES as readonly string[]).includes(v);

// Код части речи, если значение узнаваемо; иначе — исходный текст
export function normalizePos(value: string | undefined): string {
  const v = (value ?? "").trim();
  const lower = v.toLowerCase();
  if (isCode(lower)) return lower;
  return LEGACY[lower] ?? v;
}

// Подпись для показа: «существительное», «noun»…
export function posLabel(value: string | undefined, labels: Record<PosCode, string>): string {
  const code = normalizePos(value);
  return isCode(code) ? labels[code] : code;
}
