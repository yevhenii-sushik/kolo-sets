import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Collection, FlashcardStats, KnowledgeLevel } from "../../types";
import { memoryStrength, previewIntervals } from "../../utils/srs";
import { playSound, RATING_PITCH } from "../../utils/sounds";
import { useSrsWriter } from "./useSrsWriter";
import { reorderFree, wordProgress } from "./cardQueue";

// Ход тренировки по карточкам (флэшкарты набора). Раньше у каждой страницы была своя копия, и во
// флэшкартах каждая оценка перезаписывала набор исходной версией карточек: из сессии сохранялась
// только последняя. Запись — через useSrsWriter.
//
// «Не знаю» возвращает карточку через три карточки (как ошибка в сессии Perigee). Повтор — закрепление:
// в расписание не идёт (одна оценка на слово за тренировку) и в итогах не считается.
// «Повторить трудные» после круга — тоже закрепление (practice): расписание эти слова уже оценило.

const RETRY_GAP = 3;
const MAX_RETRIES = 3; // не зацикливаться на одном слове

export interface SessionItem {
  card: Card;
  collectionId: string;
  retry?: boolean;
  reverse?: boolean; // показать переводом вверх — вспоминать слово (настройка направления)
}

// Оценка, поставленная до перерыва: круг продолжили с места — в итогах она есть, показа нет
export interface CarriedRating {
  card: Card;
  collectionId: string;
  level: KnowledgeLevel;
}

export interface FirstRating {
  collectionId: string;
  cardId: string;
  level: KnowledgeLevel;
}

export interface CardSessionResult {
  cards: number; // разных слов за этот заход (оценённые до перерыва уже не считаем)
  durationSec: number;
  collectionIds: string[];
  practice: boolean;
  passed: number; // «Помню» и «Знаю» за весь круг, вместе с оценками до перерыва
  total: number; // слов в круге
}

interface Rated {
  index: number;
  collectionId: string;
  before: Card; // карточка до оценки — для отмены
  level: KnowledgeLevel;
  retry: boolean;
  inserted?: number; // куда поставили повтор — отмена его уберёт
}

const LEVEL_KEYS: Record<string, KnowledgeLevel> = {
  Digit1: KnowledgeLevel.DONT_KNOW, Numpad1: KnowledgeLevel.DONT_KNOW,
  Digit2: KnowledgeLevel.FORGOT, Numpad2: KnowledgeLevel.FORGOT,
  Digit3: KnowledgeLevel.REMEMBER, Numpad3: KnowledgeLevel.REMEMBER,
  Digit4: KnowledgeLevel.KNOW, Numpad4: KnowledgeLevel.KNOW,
};

export const isHardLevel = (level: KnowledgeLevel) => level === KnowledgeLevel.DONT_KNOW || level === KnowledgeLevel.FORGOT;

export function useCardSession(onFinish: (result: CardSessionResult) => void) {
  const writer = useSrsWriter();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rated, setRated] = useState<Rated[]>([]);
  const [carried, setCarried] = useState<CarriedRating[]>([]);
  const [practice, setPractice] = useState(false);
  const [duration, setDuration] = useState(0);
  // Куда улетает оценённая карточка (CardStage): вправо — вспомнил, влево — нет, 0 — отмена и перемешивание
  const [exitTo, setExitTo] = useState<-1 | 0 | 1>(0);

  const startedAt = useRef(Date.now());
  // Одна оценка на показ карточки: свайп и клик могут прийти в одном кадре. Снимается переворотом
  const lock = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // Актуальная версия карточки: после оценки в этой тренировке её могут показать ещё раз
  const latest = (item: SessionItem) => writer.card(item.collectionId, item.card.id) ?? item.card;

  const reset = (next: SessionItem[], opts: { carried?: CarriedRating[]; practice?: boolean } = {}) => {
    setItems(next);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setRated([]);
    setCarried(opts.carried ?? []);
    setPractice(!!opts.practice);
    setDuration(0);
    setExitTo(0);
    startedAt.current = Date.now();
    lock.current = false;
  };

  const start = useCallback(
    (next: SessionItem[], cols: Collection[], opts: { carried?: CarriedRating[] } = {}) => {
      writer.load(cols);
      reset(next, opts);
    },
    [writer],
  );

  // Прогнать трудные ещё раз, пока свежо. Наборы не перезагружаем: в writer уже свежие версии карточек
  const practise = (next: SessionItem[]) =>
    reset(next.map((item) => ({ ...item, card: latest(item), retry: false })), { practice: true });

  // Поменять то, что ещё впереди: направление (map) и порядок новых карточек (reorder). Пройденные
  // остаются на местах — на них ссылается отмена. Текущая карточка сменилась — открывается лицом
  const updateRest = (opts: { map?: (item: SessionItem) => SessionItem; reorder?: (xs: SessionItem[]) => SessionItem[] }) => {
    let rest = items.slice(index);
    if (opts.reorder) rest = reorderFree(rest, opts.reorder);
    if (opts.map) rest = rest.map(opts.map);
    const next = [...items.slice(0, index), ...rest];
    setItems(next);
    if (next[index] !== items[index]) {
      setFlipped(false);
      setExitTo(0);
      lock.current = false;
    }
  };

  const retriesLeft = (item: SessionItem) =>
    MAX_RETRIES - items.filter((x) => x.retry && x.collectionId === item.collectionId && x.card.id === item.card.id).length > 0;

  const flip = (next = !flipped) => {
    if (next === flipped || finished || items.length === 0) return;
    playSound("card-flip");
    if (next) lock.current = false;
    setFlipped(next);
  };

  const rate = (level: KnowledgeLevel) => {
    if (!flipped || finished || lock.current) return;
    lock.current = true;
    const item = items[index];
    const before = latest(item);
    if (!item.retry && !practice) writer.record(item.collectionId, item.card.id, level);
    setExitTo(level === KnowledgeLevel.REMEMBER || level === KnowledgeLevel.KNOW ? 1 : -1);
    playSound("card-next", { rate: RATING_PITCH[level] });

    let nextItems = items;
    let inserted: number | undefined;
    if (level === KnowledgeLevel.DONT_KNOW && retriesLeft(item)) {
      inserted = Math.min(index + 1 + RETRY_GAP, items.length);
      nextItems = [...items.slice(0, inserted), { ...item, retry: true }, ...items.slice(inserted)];
      setItems(nextItems);
    }

    const nextRated = [...rated, { index, collectionId: item.collectionId, before, level, retry: !!item.retry, inserted }];
    setRated(nextRated);
    setFlipped(false);
    if (index < nextItems.length - 1) {
      setIndex(index + 1);
      return;
    }

    // Итоги показываем сразу; прогресс уходит на сервер в фоне, празднование — по его ответу
    const durationSec = Math.floor((Date.now() - startedAt.current) / 1000);
    setDuration(durationSec);
    setFinished(true);
    writer.commit();
    playSound("session-complete");
    const firstLevels = [...carried.map((c) => c.level), ...nextRated.filter((r) => !r.retry).map((r) => r.level)];
    onFinishRef.current({
      cards: nextRated.filter((r) => !r.retry).length,
      durationSec,
      collectionIds: [...new Set(items.map((i) => i.collectionId))],
      practice,
      passed: firstLevels.filter((l) => !isHardLevel(l)).length,
      total: firstLevels.length,
    });
  };

  // Ошибся свайпом или кнопкой — возвращаем прошлую карточку перевёрнутой и её прежние интервалы
  const undo = () => {
    const last = rated[rated.length - 1];
    if (!last || finished) return;
    if (!last.retry && !practice) writer.restore(last.collectionId, last.before);
    if (last.inserted !== undefined) setItems(items.filter((_, i) => i !== last.inserted));
    setRated(rated.slice(0, -1));
    setIndex(last.index);
    setExitTo(0);
    setFlipped(true);
    lock.current = false;
    playSound("card-flip");
  };

  // Клавиатура: пробел — перевернуть, 1–4 — оценить, Backspace или ⌘/Ctrl+Z — отменить.
  // Обработчик один, свежие функции берёт из ref — без устаревших замыканий
  const keys = useRef({ flip, rate, undo, active: false });
  keys.current = { flip, rate, undo, active: items.length > 0 && !finished };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current;
      if (!k.active || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Backspace" || ((e.metaKey || e.ctrlKey) && e.code === "KeyZ")) {
        e.preventDefault();
        k.undo();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        e.preventDefault();
        k.flip();
      } else if (LEVEL_KEYS[e.code]) {
        k.rate(LEVEL_KEYS[e.code]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Первые оценки этого захода — по ним страница помнит, где остановились посреди круга
  const firsts: FirstRating[] = useMemo(
    () => rated.filter((r) => !r.retry).map((r) => ({ collectionId: r.collectionId, cardId: r.before.id, level: r.level })),
    [rated],
  );

  // Итоги — по первому показу каждой карточки, без повторов, вместе с оценками до перерыва
  const stats: FlashcardStats = useMemo(() => {
    const levels = [...carried.map((c) => c.level), ...firsts.map((r) => r.level)];
    const count = (level: KnowledgeLevel) => levels.filter((l) => l === level).length;
    return {
      totalCards: carried.length + items.filter((item) => !item.retry).length,
      dontKnow: count(KnowledgeLevel.DONT_KNOW),
      forgot: count(KnowledgeLevel.FORGOT),
      remember: count(KnowledgeLevel.REMEMBER),
      know: count(KnowledgeLevel.KNOW),
      duration,
    };
  }, [carried, firsts, items, duration]);

  // Трудные слова («Не знаю», «Забылось») — список в итогах и «Повторить трудные»
  const hard: SessionItem[] = useMemo(
    () => [
      ...carried.filter((c) => isHardLevel(c.level)).map(({ card, collectionId }) => ({ card, collectionId })),
      ...rated.filter((r) => !r.retry && isHardLevel(r.level)).map((r) => ({ card: r.before, collectionId: r.collectionId })),
    ],
    [carried, rated],
  );

  // Что сдвинулось в памяти за этот заход: новые слова пошли в работу, знакомые окрепли (memoryStrength).
  // Writer меняет карточку сразу при оценке, поэтому после rate() здесь уже свежая версия
  const growth = useMemo(() => {
    let introduced = 0;
    let grew = 0;
    if (practice) return { introduced, grew };
    for (const r of rated) {
      if (r.retry) continue;
      const before = memoryStrength(r.before);
      const after = memoryStrength(latest({ card: r.before, collectionId: r.collectionId }));
      if (before === 0 && after > 0) introduced += 1;
      else if (before > 0 && after > before) grew += 1;
    }
    return { introduced, grew };
  }, [rated, practice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Подписи на кнопках оценки — по актуальной версии карточки; «Не знаю» — «ещё раз» (0), пока повтор
  // возможен. На повторе и при закреплении подписей нет: оценка в расписание не идёт
  const currentItem = items[index] as SessionItem | undefined;
  const previews =
    currentItem && !currentItem.retry && !practice && flipped && !finished
      ? { ...previewIntervals(latest(currentItem)), [KnowledgeLevel.DONT_KNOW]: retriesLeft(currentItem) ? 0 : 1 }
      : undefined;

  const progress = wordProgress(items, index, carried.length);

  return {
    items,
    index,
    exitTo,
    previews,
    current: currentItem,
    // Актуальная версия текущей карточки: на повторе у неё уже новая сила памяти
    currentCard: currentItem ? latest(currentItem) : undefined,
    // Следующая карточка — её лицо лежит в колоде под текущей
    nextItem: items[index + 1] as SessionItem | undefined,
    nextCard: items[index + 1] ? latest(items[index + 1]) : undefined,
    flipped,
    finished,
    practice,
    stats,
    hard,
    growth,
    firsts,
    position: progress.position,
    total: progress.total,
    progress: progress.progress,
    canUndo: rated.length > 0 && !finished,
    start,
    practise,
    updateRest,
    flip,
    rate,
    undo,
  };
}
