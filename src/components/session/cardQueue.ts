// Очередь карточек тренировки — чистые функции для useCardSession (тесты: cardQueue.test.ts)

export interface QueueItem {
  retry?: boolean; // повтор после «Не знаю»: закрепление, в расписание и итоги не идёт
}

// «Перемешать» мешает только то, что ещё впереди. Пройденные карточки остаются на местах (на них
// ссылается отмена), повторы — тоже: их место выбрано так, чтобы между ошибкой и повтором прошло
// несколько карточек. Круг заново не начинается, оценки не теряются
export function shuffleRest<T extends QueueItem>(items: T[], index: number, shuffle: (xs: T[]) => T[]): T[] {
  const head = items.slice(0, index);
  const tail = items.slice(index);
  const free = shuffle(tail.filter((item) => !item.retry));
  let k = 0;
  return [...head, ...tail.map((item) => (item.retry ? item : free[k++]))];
}

// Счётчик по словам, а не по показам: повтор после ошибки не прибавляет карточек в «6 / 20».
// carried — слова круга, оценённые до перерыва (круг продолжили с места)
export function wordProgress(items: QueueItem[], index: number, carried = 0) {
  const total = carried + items.filter((item) => !item.retry).length;
  const position = carried + items.slice(0, index + 1).filter((item) => !item.retry).length;
  // Полоса — по показам с учётом повторов: вставка повтора её не откатывает, (c+i)/(c+n) < (c+i+1)/(c+n+1)
  const progress = carried + items.length > 0 ? (carried + index) / (carried + items.length) : 0;
  return { position, total, progress };
}
