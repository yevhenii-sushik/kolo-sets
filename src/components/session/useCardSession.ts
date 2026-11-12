import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Collection, FlashcardStats, KnowledgeLevel } from "../../types";
import { shuffle as shuffled } from "../../utils/gameUtils";
import { previewIntervals } from "../../utils/srs";
import { playSound, RATING_PITCH } from "../../utils/sounds";
import { useSrsWriter } from "./useSrsWriter";

// Общий ход тренировки по карточкам — для флэшкарт набора и для повторения.
// Раньше у каждой страницы была своя копия, и во флэшкартах каждая оценка перезаписывала набор
// исходной версией карточек: из сессии сохранялась только последняя. Запись — через useSrsWriter.

export interface SessionItem {
  card: Card;
  collectionId: string;
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

  const shuffle = () => reset(shuffled(items).map((item) => ({ ...item, card: latest(item) })));

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
    writer.record(item.collectionId, item.card.id, level);
    setExitTo(level === KnowledgeLevel.REMEMBER || level === KnowledgeLevel.KNOW ? 1 : -1);
    playSound("card-next", { rate: RATING_PITCH[level] });

    const nextRated = [...rated, { index, collectionId: item.collectionId, before, level }];
    setRated(nextRated);
    setFlipped(false);
    if (index < items.length - 1) {
      setIndex(index + 1);
      return;
    }

    // Итоги показываем сразу; прогресс уходит на сервер в фоне, празднование — по его ответу
    const durationSec = Math.floor((Date.now() - startedAt.current) / 1000);
    setDuration(durationSec);
    setFinished(true);
    writer.commit();
    playSound("session-complete");
    onFinishRef.current({
      cards: items.length,
      allKnow: nextRated.every((r) => r.level === KnowledgeLevel.KNOW),
      durationSec,
      collectionIds: [...new Set(items.map((i) => i.collectionId))],
    });
  };

  // Ошибся свайпом или кнопкой — возвращаем прошлую карточку перевёрнутой и её прежние интервалы
  const undo = () => {
    const last = rated[rated.length - 1];
    if (!last || finished) return;
    writer.restore(last.collectionId, last.before);
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

  const stats: FlashcardStats = useMemo(() => {
    const count = (level: KnowledgeLevel) => rated.filter((r) => r.level === level).length;
    return {
      totalCards: items.length,
      dontKnow: count(KnowledgeLevel.DONT_KNOW),
      forgot: count(KnowledgeLevel.FORGOT),
      remember: count(KnowledgeLevel.REMEMBER),
      know: count(KnowledgeLevel.KNOW),
      duration,
    };
  }, [rated, items.length, duration]);

  // Подписи на кнопках оценки — по актуальной версии карточки
  const currentItem = items[index] as SessionItem | undefined;
  const previews = currentItem && flipped && !finished ? previewIntervals(latest(currentItem)) : undefined;

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
