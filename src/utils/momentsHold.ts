// Праздники (капсула, уровень, орбита, медали) не всплывают посреди тренировки — ждут итогового экрана или выхода
// из тренировки (решение пользователя 2026-11-28, часть шага 14 в docs/specs/06-audit-fixes.md). Иначе первое, что
// видит новичок в пробном режиме, — окно «Капсула получена» поверх первой карточки.
import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";

// Экраны тренировок: сессия Perigee и режимы набора (EmptyLayout в App.tsx)
const STUDY = /^\/(learn|collection\/[^/]+\/(flashcards|quiz|speed))\/?$/;
export const isStudyPath = (pathname: string) => STUDY.test(pathname);

// Сколько итоговых экранов открыто сейчас (SessionResult): на итоге тренировка закончена — праздникам можно
let results = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

// Итоговый экран отмечается, пока открыт
export function useResultOpen(open: boolean) {
  useEffect(() => {
    if (!open) return;
    results++;
    emit();
    return () => {
      results--;
      emit();
    };
  }, [open]);
}

// true — сейчас идёт тренировка, праздники ждут
export function useMomentsHeld(): boolean {
  const { pathname } = useLocation();
  const openResults = useSyncExternalStore(subscribe, () => results);
  return isStudyPath(pathname) && openResults === 0;
}
