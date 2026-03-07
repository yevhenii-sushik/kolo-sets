export type CEFRLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface KoloSetCard {
  word: string;
  translation: string;
  partOfSpeech?: string;
  explanation?: string;
  example?: string;
}

export interface KoloSet {
  id: string;
  title: string;
  description: string;
  level: CEFRLevel;
  language: string; // target language code, e.g. 'en', 'de', 'fr'
  topic: string;    // e.g. 'Basics', 'Food', 'Travel'
  cardCount: number;
  cards: KoloSetCard[];
}

export interface KoloSetMeta extends Omit<KoloSet, 'cards'> {
  // Used in listings — cards loaded lazily
}
