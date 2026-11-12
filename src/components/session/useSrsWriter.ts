import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card, Collection, KnowledgeLevel } from "../../types";
import { updateCollection, updateSRSData } from "../../utils/storage";
import { useData } from "../../contexts/DataContext";

// Запись ответов в расписание Perigee — общая для флэшкарт, повторения, теста, игр и сессии Perigee.
// Держит актуальные версии наборов (раньше флэшкарты писали исходную копию и затирали свои же оценки),
// сохраняет пачкой через паузу, при сворачивании и уходе со страницы и не ждёт сети: офлайн запись
// ложится в кэш Firestore и уходит позже. Новые интервалы сразу попадают в DataContext — счётчики
// «к повторению» на главной обновляются без повторной загрузки.

const SAVE_DELAY_MS = 1500;

export interface SrsWriter {
  /** Наборы, с которыми работает тренировка; прежние несохранённые оценки сначала сохраняются */
  load: (cols: Collection[]) => void;
  /** Актуальная версия карточки (после оценок в этой тренировке) */
  card: (collectionId: string, cardId: string) => Card | undefined;
  /** Все наборы в актуальном виде */
  collections: () => Collection[];
  /** Оценить карточку; возвращает её версию до оценки — для отмены */
  record: (collectionId: string, cardId: string, level: KnowledgeLevel) => Card | undefined;
  /** Вернуть карточку к прежней версии (отмена оценки) */
  restore: (collectionId: string, card: Card) => void;
  /** Сохранить сейчас и показать новые интервалы в приложении */
  commit: () => void;
}

export function useSrsWriter(): SrsWriter {
  const { setCollections } = useData();
  const cols = useRef(new Map<string, Collection>());
  const dirty = useRef(new Set<string>());
  const touched = useRef(new Set<string>());
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    for (const id of dirty.current) {
      const col = cols.current.get(id);
      if (col) updateCollection(col).catch((err) => console.error("Не удалось сохранить оценки", err));
    }
    dirty.current.clear();
  }, []);

  const publish = useCallback(() => {
    if (touched.current.size === 0) return;
    const changed = new Map([...touched.current].map((id) => [id, cols.current.get(id)!]));
    touched.current.clear();
    setCollections((prev) => prev.map((c) => changed.get(c.id) ?? c));
  }, [setCollections]);

  const commit = useCallback(() => {
    flush();
    publish();
  }, [flush, publish]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      commit();
    };
  }, [flush, commit]);

  const write = useCallback(
    (collectionId: string, card: Card) => {
      const col = cols.current.get(collectionId);
      if (!col) return;
      cols.current.set(collectionId, {
        ...col,
        cards: col.cards.map((c) => (c.id === card.id ? card : c)),
        lastStudied: new Date(),
      });
      dirty.current.add(collectionId);
      touched.current.add(collectionId);
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [flush],
  );

  const card = useCallback(
    (collectionId: string, cardId: string) => cols.current.get(collectionId)?.cards.find((c) => c.id === cardId),
    [],
  );

  const load = useCallback(
    (next: Collection[]) => {
      commit();
      cols.current = new Map(next.map((c) => [c.id, c]));
    },
    [commit],
  );

  const record = useCallback(
    (collectionId: string, cardId: string, level: KnowledgeLevel) => {
      const before = card(collectionId, cardId);
      if (before) write(collectionId, updateSRSData(before, level));
      return before;
    },
    [card, write],
  );

  const collections = useCallback(() => [...cols.current.values()], []);

  return useMemo(() => ({ load, card, collections, record, restore: write, commit }), [load, card, collections, record, write, commit]);
}
