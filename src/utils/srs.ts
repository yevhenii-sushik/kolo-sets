import { Card, KnowledgeLevel, SRSData } from '../types';

// Perigee — упрощённый SM-2. Модуль чистый (без Firebase и браузера): его покрывают тесты srs.test.ts,
// а storage.ts реэкспортирует функции для старых импортов.

const DAY_MS = 24 * 60 * 60 * 1000;

// nextReview приходит как Date, Timestamp из Firestore или строка из старого экспорта
export const toDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const ts = value as { toDate?: () => Date };
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// Разница в календарных днях (по местному времени); round гасит переход на летнее время
export const dayDiff = (from: Date, to: Date) => Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS);

const addDays = (d: Date, days: number) => {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
};

const initialSRS = (now: Date): SRSData => ({ easinessFactor: 2.5, interval: 0, repetitions: 0, nextReview: now });

// Новая карточка: ещё ни разу не тренировалась (после первой же оценки interval ≥ 1)
export const isNewCard = (card: Card): boolean => !card.srsData || card.srsData.interval === 0;

// Карточка ждёт повторения? Срок считаем по дням, а не по часам: слово, оценённое вчера в 20:00,
// ждёт уже с утра, а не с вечера. Единственная точка правды для due-логики (App, HomePage, ReviewPage,
// FlashcardsPage, CollectionCard).
export const isDueAt = (card: Card, now: Date): boolean => {
  if (isNewCard(card)) return false;
  const next = toDate(card.srsData.nextReview);
  return !!next && dayDiff(now, next) <= 0;
};

// Без второго параметра: функцию передают прямо в filter, а он подставил бы индекс вместо даты
export const isDueCard = (card: Card): boolean => isDueAt(card, new Date());

const QUALITY: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.DONT_KNOW]: 0,
  [KnowledgeLevel.FORGOT]: 2,
  [KnowledgeLevel.REMEMBER]: 3,
  [KnowledgeLevel.KNOW]: 5,
};

// Ответ в любом режиме → оценка SM-2 (docs/specs/perigee.md, «Что пишется в расписание»).
// Узнать среди вариантов — «Помню»: слегка снижает лёгкость, и такие слова растут медленнее вспомненных
export type AnswerOutcome =
  | { kind: 'choice'; correct: boolean }
  | { kind: 'type'; result: 'exact' | 'close' | 'wrong' }
  | { kind: 'self'; level: KnowledgeLevel };

export const levelForAnswer = (outcome: AnswerOutcome): KnowledgeLevel => {
  switch (outcome.kind) {
    case 'choice':
      return outcome.correct ? KnowledgeLevel.REMEMBER : KnowledgeLevel.FORGOT;
    case 'type':
      return outcome.result === 'exact' ? KnowledgeLevel.KNOW : outcome.result === 'close' ? KnowledgeLevel.REMEMBER : KnowledgeLevel.FORGOT;
    case 'self':
      return outcome.level;
  }
};

// Сколько слов впервые оценено сегодня — для дневного лимита новых слов
export const introducedOn = (cards: Card[], now: Date): number =>
  cards.filter((c) => {
    const d = toDate(c.srsData?.introducedAt);
    return !!d && dayDiff(d, now) === 0;
  }).length;

// Обновить SRS-данные карточки по оценке
export const updateSRSData = (card: Card, level: KnowledgeLevel, now: Date = new Date()): Card => {
  const srs: SRSData = { ...(card.srsData ?? initialSRS(now)) };
  const quality = QUALITY[level];
  const scheduled = toDate(srs.nextReview);
  const last = toDate(srs.lastReviewed);
  const early = !isNewCard(card) && !!scheduled && dayDiff(now, scheduled) > 0;

  if (quality >= 3 && early) {
    // Вспомнил раньше срока (например, прогнал весь набор). SM-2 считал бы это повтором в срок и умножал
    // интервал: пять дней подряд «Знаю» уводили слово на ~130 дней. Засчитываем только реально прошедшее
    // время: интервал растёт, если от прошлого показа прошло достаточно, иначе расписание не трогаем.
    const elapsed = last ? Math.max(0, dayDiff(last, now)) : 0;
    const grown = Math.round(elapsed * srs.easinessFactor);
    if (grown > srs.interval) {
      srs.interval = grown;
      srs.repetitions += 1;
      srs.nextReview = addDays(now, grown);
    }
  } else {
    if (quality >= 3) {
      if (srs.repetitions === 0) srs.interval = 1;
      else if (srs.repetitions === 1) srs.interval = 6;
      else srs.interval = Math.round(srs.interval * srs.easinessFactor);
      srs.repetitions += 1;
    } else {
      // Забыл — неважно, в срок или раньше: начинаем заново
      srs.repetitions = 0;
      srs.interval = 1;
    }
    srs.easinessFactor = Math.max(1.3, srs.easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    srs.nextReview = addDays(now, srs.interval);
  }

  if (isNewCard(card)) srs.introducedAt = now;
  srs.lastReviewed = now;
  srs.totalReviews = (srs.totalReviews ?? 0) + 1;
  if (quality >= 3) srs.correctReviews = (srs.correctReviews ?? 0) + 1;

  return { ...card, srsData: srs };
};
