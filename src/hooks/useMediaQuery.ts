import { useEffect, useState } from "react";

// Совпадает ли медиазапрос сейчас; следит за изменением (поворот телефона, ширина окна).
// Нужен, когда на разной ширине рисуется разное, а не просто переставляется классами
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}
