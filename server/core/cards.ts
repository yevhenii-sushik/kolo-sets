// Сколько слов и наборов человек уже начал учить — для медалей за слова и наборы.
// Медаль даёт опыт и капсулы, а готовый набор Kolo добавляется одним нажатием, поэтому считаем
// только слова, которые хоть раз были в тренировке (docs/specs/05-ready-sets.md, «Медали»).
// Данные — как лежат в Firestore: даты могут быть Timestamp, null или отсутствовать.

interface SrsLike {
  totalReviews?: number;
  lastReviewed?: unknown;
  repetitions?: number;
  interval?: number;
}

export interface CardLike {
  srsData?: SrsLike | null;
}

// Слово начато, если его хоть раз оценили. isNewCard из srs.ts не годится: после «Не знаю» интервал
// остаётся 0. У старых карточек может не быть totalReviews — тогда смотрим на дату и интервал
export function isStartedCard(card: CardLike | null | undefined): boolean {
  const s = card?.srsData;
  if (!s) return false;
  return (s.totalReviews ?? 0) > 0 || s.lastReviewed != null || (s.repetitions ?? 0) > 0 || (s.interval ?? 0) > 0;
}

export interface CardCounts {
  allCards: number; // все карточки — для проверки правдоподобия тренировки
  startedCards: number; // начатые слова — медали за слова
  startedSets: number; // наборы, где начато хоть одно слово, — медали за 3 и 5 наборов
}

export function countCards(sets: readonly ({ cards?: unknown } | null | undefined)[]): CardCounts {
  const counts: CardCounts = { allCards: 0, startedCards: 0, startedSets: 0 };
  for (const set of sets) {
    const cards: CardLike[] = Array.isArray(set?.cards) ? set.cards : [];
    const started = cards.filter(isStartedCard).length;
    counts.allCards += cards.length;
    counts.startedCards += started;
    if (started > 0) counts.startedSets += 1;
  }
  return counts;
}
