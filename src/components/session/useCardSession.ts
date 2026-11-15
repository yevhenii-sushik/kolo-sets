import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Collection, FlashcardStats, KnowledgeLevel } from "../../types";
import { shuffle as shuffled } from "../../utils/gameUtils";
import { previewIntervals } from "../../utils/srs";
import { playSound, RATING_PITCH } from "../../utils/sounds";
import { useSrsWriter } from "./useSrsWriter";

// Общий ход тренировки по карточкам — для флэшкарт набора и для повторения.
// Раньше у каждой страницы была своя копия, и во флэшкартах каждая оценка перезаписывала набор
// исходной версией карточек: из сессии сохранялась только последняя. Запись — через useSrsWriter.
//
// «Не знаю» возвращает карточку через три карточки (как ошибка в сессии Perigee). Повтор — закрепление:
// в расписание не идёт (одна оценка на слово за тренировку) и в итогах не считается.

const RETRY_GAP = 3;
const MAX_RETRIES = 3; // не зацикливаться на одном слове

export interface SessionItem {
  card: Card;
  collectionId: string;
  retry?: boolean;
}

export interface CardSessionResult {
  cards: number;
  allKnow: boolean;
  durationSec: number;
  collectionIds: string[];
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

export function useCardSession(onFinish: (result: CardSessionResult) => void) {
  const writer = useSrsWriter();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rated, setRated] = useState<Rated[]>([]);
  const [duration, setDuration] = useState(0);
  // Куда улетает оценённая карточка (CardStage): вправо — вспомнил, влево — нет, 0 — отмена и перемешивание
  const [exitTo, setExitTo] = useState<-1 | 0 | 1>(0);

  const startedAt = useRef(Date.now());
  // Одна оценка на показ карточки: свайп и клик могут прийти в одном кадре. Снимается переворотом
  const lock = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  // Актуальная версия карточки: после перемешивания её могут показать второй раз
  const latest = (item: SessionItem) => writer.card(item.collectionId, item.card.id) ?? item.card;

  const reset = (next: SessionItem[]) => {
    setItems(next);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setRated([]);
    setDuration(0);
    setExitTo(0);
    startedAt.current = Date.now();
    lock.current = false;
  };

  const start = useCallback(
    (next: SessionItem[], cols: Collection[]) => {
      writer.load(cols);
      reset(next);
    },
    [writer],
  );

  const shuffle = () => reset(shuffled(items.filter((item) => !item.retry)).map((item) => ({ ...item, card: latest(item) })));

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
    if (!item.retry) writer.record(item.collectionId, item.card.id, level);
    setExitTo(level === KnowledgeLevel.REMEMBER || level === KnowledgeLevel.KNOW ? 1 : -1);
    playSound("card-next", { rate: RATING_PITCH[level] });

    let nextItems = items;
    let inserted: number | undefined;
    if (level === KnowledgeLevel.DONT_KNOW && retriesLeft(item)) {
      inserted = Math.min(index + 1 + RETRY_GAP, items.length);
      nextItems = [...items.slice(0, inserted), { card: item.card, collectionId: item.collectionId, retry: true }, ...items.slice(inserted)];
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
    const firsts = nextRated.filter((r) => !r.retry);
    onFinishRef.current({
      cards: firsts.length,
      allKnow: firsts.every((r) => r.level === KnowledgeLevel.KNOW),
      durationSec,
      collectionIds: [...new Set(items.map((i) => i.collectionId))],
    });
  };

  // Ошибся свайпом или кнопкой — возвращаем прошлую карточку перевёрнутой и её прежние интервалы
  const undo = () => {
    const last = rated[rated.length - 1];
    if (!last || finished) return;
    if (!last.retry) writer.restore(last.collectionId, last.before);
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

  // Итоги — по первому показу каждой карточки, без повторов
  const stats: FlashcardStats = useMemo(() => {
    const firsts = rated.filter((r) => !r.retry);
    const count = (level: KnowledgeLevel) => firsts.filter((r) => r.level === level).length;
    return {
      totalCards: items.filter((item) => !item.retry).length,
      dontKnow: count(KnowledgeLevel.DONT_KNOW),
      forgot: count(KnowledgeLevel.FORGOT),
      remember: count(KnowledgeLevel.REMEMBER),
      know: count(KnowledgeLevel.KNOW),
      duration,
    };
  }, [rated, items, duration]);

  // Подписи на кнопках оценки — по актуальной версии карточки; «Не знаю» — «ещё раз» (0), пока повтор
  // возможен. На повторе подписей нет: его оценка в расписание не идёт
  const currentItem = items[index] as SessionItem | undefined;
  const previews =
    currentItem && !currentItem.retry && flipped && !finished
      ? { ...previewIntervals(latest(currentItem)), [KnowledgeLevel.DONT_KNOW]: retriesLeft(currentItem) ? 0 : 1 }
      : undefined;

  return {
    items,
    index,
    exitTo,
    previews,
    current: items[index] as SessionItem | undefined,
    flipped,
    finished,
    stats,
    canUndo: rated.length > 0 && !finished,
    start,
    shuffle,
    flip,
    rate,
    undo,
  };
}
