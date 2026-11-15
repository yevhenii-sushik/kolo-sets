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
// ждёт уже с утра, а не с вечера. Единственная точка правды для due-логики (App, HomePage, сессия Perigee,
// CollectionCard).
export const isDueAt = (card: Card, now: Date): boolean => {
  if (isNewCard(card)) return false;
  const next = toDate(card.srsData.nextReview);
  return !!next && dayDiff(now, next) <= 0;
};

// Без второго параметра: функцию передают прямо в filter, а он подставил бы индекс вместо даты
export const isDueCard = (card: Card): boolean => isDueAt(card, new Date());

// Четыре оценки — четыре разных исхода (docs/specs/perigee.md, «Четыре оценки»). В чистом SM-2 «Не знаю»
// и «Забыл» давали один и тот же завтрашний день, «Помню» и «Знаю» — один интервал, а разница пряталась
// в лёгкости. Подписи интервалов на кнопках показывали «1 д · 1 д · 15 д · 15 д», и выбор терял смысл.
// Штрафы мягче, чем в SM-2: одно «Не знаю» роняло лёгкость с 2,5 до 1,7, и слово навсегда росло медленно
const EASE_STEP: Record<KnowledgeLevel, number> = {
  [KnowledgeLevel.DONT_KNOW]: -0.2,
  [KnowledgeLevel.FORGOT]: -0.15,
  [KnowledgeLevel.REMEMBER]: 0,
  [KnowledgeLevel.KNOW]: 0.15,
};
const MIN_EASE = 1.3;
const KNOW_BONUS = 1.3; // «Знаю» — интервал ещё ×1,3

const passed = (level: KnowledgeLevel) => level === KnowledgeLevel.REMEMBER || level === KnowledgeLevel.KNOW;

// Ответ в любом режиме → оценка (docs/specs/perigee.md, «Что пишется в расписание»).
// Узнать среди вариантов — «Помню», вспомнить и написать без ошибки — «Знаю»: такие слова растут быстрее
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

// Расписание по одной оценке, без правила «каждая следующая кнопка дальше» (оно в updateSRSData)
function schedule(card: Card, level: KnowledgeLevel, now: Date): SRSData {
  const srs: SRSData = { ...(card.srsData ?? initialSRS(now)) };
  const know = level === KnowledgeLevel.KNOW;
  const scheduled = toDate(srs.nextReview);
  const last = toDate(srs.lastReviewed);
  const early = !isNewCard(card) && !!scheduled && dayDiff(now, scheduled) > 0;

  if (!passed(level)) {
    // Не знаю — с нуля. Забыл — тоже завтра, но знакомое слово не теряет весь путь: следующий верный
    // ответ даст сразу 6 дней, а не снова 1. Неважно, в срок или раньше
    srs.repetitions = level === KnowledgeLevel.FORGOT ? Math.min(srs.repetitions, 1) : 0;
    srs.interval = 1;
    srs.easinessFactor = Math.max(MIN_EASE, srs.easinessFactor + EASE_STEP[level]);
    srs.nextReview = addDays(now, 1);
  } else if (early) {
    // Вспомнил раньше срока (например, прогнал весь набор). SM-2 считал бы это повтором в срок и умножал
    // интервал: пять дней подряд «Знаю» уводили слово на ~130 дней. Засчитываем только реально прошедшее
    // время: интервал растёт, если от прошлого показа прошло достаточно, иначе расписание не трогаем.
    // Лёгкость раньше срока не меняем
    const elapsed = last ? Math.max(0, dayDiff(last, now)) : 0;
    const grown = Math.round(elapsed * srs.easinessFactor * (know ? KNOW_BONUS : 1));
    if (grown > srs.interval) {
      srs.interval = grown;
      srs.repetitions += 1;
      srs.nextReview = addDays(now, grown);
    }
  } else {
    // В срок: лесенка 1 → 6 → × лёгкость; «Знаю» — 3 → 8 → × лёгкость × 1,3
    srs.interval =
      srs.repetitions === 0
        ? know ? 3 : 1
        : srs.repetitions === 1
          ? know ? 8 : 6
          : Math.round(srs.interval * srs.easinessFactor * (know ? KNOW_BONUS : 1));
    srs.repetitions += 1;
    srs.easinessFactor = Math.max(MIN_EASE, srs.easinessFactor + EASE_STEP[level]);
    srs.nextReview = addDays(now, srs.interval);
  }
  return srs;
}

const daysUntil = (srs: SRSData, now: Date) => dayDiff(now, toDate(srs.nextReview) ?? now);

// Обновить SRS-данные карточки по оценке
export const updateSRSData = (card: Card, level: KnowledgeLevel, now: Date = new Date()): Card => {
  const srs = schedule(card, level, now);

  // Каждая следующая кнопка — хотя бы на день дальше предыдущей: «Забыл» — завтра, «Помню» — не раньше
  // чем через 2 дня, «Знаю» — дальше «Помню». Иначе две кнопки с одной подписью, и непонятно, чем они
  // отличаются (новое слово, слово, которое и так ждёт завтра, повтор раньше срока)
  const floor =
    level === KnowledgeLevel.REMEMBER ? 2 : level === KnowledgeLevel.KNOW ? Math.max(2, daysUntil(schedule(card, KnowledgeLevel.REMEMBER, now), now)) + 1 : 0;
  if (daysUntil(srs, now) < floor) srs.nextReview = addDays(now, floor);

  if (isNewCard(card)) srs.introducedAt = now;
  srs.lastReviewed = now;
  srs.totalReviews = (srs.totalReviews ?? 0) + 1;
  if (passed(level)) srs.correctReviews = (srs.correctReviews ?? 0) + 1;

  return { ...card, srsData: srs };
};

// Через сколько дней слово вернётся при каждой оценке — подписи на кнопках оценки
export const previewIntervals = (card: Card, now: Date = new Date()): Record<KnowledgeLevel, number> => {
  const days = (level: KnowledgeLevel) => Math.max(0, dayDiff(now, toDate(updateSRSData(card, level, now).srsData.nextReview) ?? now));
  return {
    [KnowledgeLevel.DONT_KNOW]: days(KnowledgeLevel.DONT_KNOW),
    [KnowledgeLevel.FORGOT]: days(KnowledgeLevel.FORGOT),
    [KnowledgeLevel.REMEMBER]: days(KnowledgeLevel.REMEMBER),
    [KnowledgeLevel.KNOW]: days(KnowledgeLevel.KNOW),
  };
};

// Сила памяти слова — значок на флэшкарте: 0 новое, 1 учится (интервал меньше недели), 2 крепнет
// (меньше месяца), 3 крепкое. Видно, что каждая честная оценка двигает слово (docs/specs/perigee.md)
export type Strength = 0 | 1 | 2 | 3;

export const memoryStrength = (card: Card): Strength => {
  if (isNewCard(card)) return 0;
  const interval = card.srsData.interval;
  return interval < 7 ? 1 : interval < 30 ? 2 : 3;
};
