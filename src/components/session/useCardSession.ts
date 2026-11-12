import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, Collection, FlashcardStats, KnowledgeLevel } from "../../types";
import { updateCollection, updateSRSData } from "../../utils/storage";
import { shuffle as shuffled } from "../../utils/gameUtils";
import { playSound, RATING_PITCH } from "../../utils/sounds";
import { useData } from "../../contexts/DataContext";

// Общий ход тренировки по карточкам — для флэшкарт набора и для повторения.
// Раньше у каждой страницы была своя копия, и во флэшкартах каждая оценка перезаписывала набор
// исходной версией карточек: из сессии сохранялась только последняя. Теперь актуальные наборы живут
// здесь, оценки пишутся пачкой (через паузу, при уходе со страницы и в конце), а интерфейс не ждёт сети:
// офлайн запись ляжет в кэш Firestore и уйдёт, когда появится связь.

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

const SAVE_DELAY_MS = 1500;
const LEVEL_KEYS: Record<string, KnowledgeLevel> = {
  Digit1: KnowledgeLevel.DONT_KNOW, Numpad1: KnowledgeLevel.DONT_KNOW,
  Digit2: KnowledgeLevel.FORGOT, Numpad2: KnowledgeLevel.FORGOT,
  Digit3: KnowledgeLevel.REMEMBER, Numpad3: KnowledgeLevel.REMEMBER,
  Digit4: KnowledgeLevel.KNOW, Numpad4: KnowledgeLevel.KNOW,
};

export function useCardSession(onFinish: (result: CardSessionResult) => void) {
  const { setCollections } = useData();
  const [items, setItems] = useState<SessionItem[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rated, setRated] = useState<Rated[]>([]);
  const [duration, setDuration] = useState(0);

  const startedAt = useRef(Date.now());
  const collections = useRef(new Map<string, Collection>());
  const dirty = useRef(new Set<string>());
  const touched = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  // Одна оценка на показ карточки: свайп и клик могут прийти в одном кадре. Снимается переворотом
  const lock = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const flush = useCallback(() => {
    clearTimeout(saveTimer.current);
    for (const id of dirty.current) {
      const col = collections.current.get(id);
      if (col) updateCollection(col).catch((err) => console.error("Не удалось сохранить оценки", err));
    }
    dirty.current.clear();
  }, []);

  // Новые интервалы сразу видны на главной (счётчики «к повторению») — без повторной загрузки наборов
  const publish = useCallback(() => {
    if (touched.current.size === 0) return;
    const changed = new Map([...touched.current].map((id) => [id, collections.current.get(id)!]));
    touched.current.clear();
    setCollections((prev) => prev.map((c) => changed.get(c.id) ?? c));
  }, [setCollections]);

  // Свернули приложение или закрыли вкладку — сохраняем, не дожидаясь паузы. Ушли со страницы — тоже
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
      publish();
    };
  }, [flush, publish]);

  const writeCard = (collectionId: string, card: Card) => {
    const col = collections.current.get(collectionId);
    if (!col) return;
    collections.current.set(collectionId, {
      ...col,
      cards: col.cards.map((c) => (c.id === card.id ? card : c)),
      lastStudied: new Date(),
    });
    dirty.current.add(collectionId);
    touched.current.add(collectionId);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(flush, SAVE_DELAY_MS);
  };

  // Актуальная версия карточки: после перемешивания её могут показать второй раз
  const latest = (item: SessionItem) =>
    collections.current.get(item.collectionId)?.cards.find((c) => c.id === item.card.id) ?? item.card;

  const reset = (next: SessionItem[]) => {
    setItems(next);
    setIndex(0);
    setFlipped(false);
    setFinished(false);
    setRated([]);
    setDuration(0);
    startedAt.current = Date.now();
    lock.current = false;
  };

  const start = useCallback(
    (next: SessionItem[], cols: Collection[]) => {
      flush();
      publish();
      collections.current = new Map(cols.map((c) => [c.id, c]));
      reset(next);
    },
    [flush, publish],
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
    writeCard(item.collectionId, updateSRSData(before, level));
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
    flush();
    publish();
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
    writeCard(last.collectionId, last.before);
    setRated(rated.slice(0, -1));
    setIndex(last.index);
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

  return {
    items,
    index,
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
