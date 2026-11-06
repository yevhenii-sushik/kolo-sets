import { useEffect, useRef } from "react";
import { useData } from "../../contexts/DataContext";
import type { SessionPayload } from "../../api/progress";

// Игры: когда раунд закончился, один раз сообщаем серверу — игра засчитывается как тренировка
// (продлевает серию, попадает в историю дней). Новый раунд сбрасывает отметку.
// Раунд без единого ответа не засчитывается.
export function useRoundReport(ended: boolean, build: () => SessionPayload | null) {
  const { reportSession } = useData();
  const sentRef = useRef(false);
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    if (!ended) {
      sentRef.current = false;
      return;
    }
    if (sentRef.current) return;
    sentRef.current = true;
    const payload = buildRef.current();
    if (payload && payload.cards > 0) reportSession(payload);
  }, [ended, reportSession]);
}
