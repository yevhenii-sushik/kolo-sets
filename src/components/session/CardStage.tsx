import { useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Card } from "../../types";
import Flashcard from "../cards/Flashcard";

// Карточка тренировки со свайпом: до переворота свайп переворачивает, после — вправо «знаю», влево «не знаю».
// cardKey меняется с каждой карточкой: новая монтируется сразу лицом вверх. Раньше слово подменялось
// посреди анимации обратного переворота, и мог мелькнуть оборот следующей карточки
export default function CardStage({
  cardKey,
  card,
  language,
  flipped,
  onFlip,
  onSwipe,
  reverse = false,
}: {
  cardKey: string;
  card: Card;
  language?: string;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (direction: "left" | "right") => void;
  reverse?: boolean;
}) {
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 0, 160], [-6, 0, 6]);
  const swipedRef = useRef(false);

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 py-4 sm:px-6">
      <motion.div
        className="w-full max-w-3xl shrink-0 touch-pan-y"
        style={{ x: dragX, rotate: dragRotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        dragMomentum={false}
        onDragStart={() => {
          swipedRef.current = false;
        }}
        onDrag={(_, info) => {
          if (Math.abs(info.offset.x) > 8) swipedRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const didSwipe = swipedRef.current;
          // swipedRef остаётся true чуть дольше — чтобы onClick карточки понял, что это был свайп
          setTimeout(() => {
            swipedRef.current = false;
          }, 80);
          if (!didSwipe || Math.abs(info.offset.x) < 60) return;
          if (!flipped) onFlip();
          else onSwipe(info.offset.x > 0 ? "right" : "left");
        }}
      >
        <motion.div key={cardKey} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}>
          <Flashcard
            card={card}
            language={language}
            isFlipped={flipped}
            reverse={reverse}
            onFlip={() => {
              if (!swipedRef.current) onFlip();
            }}
          />
        </motion.div>
      </motion.div>
    </main>
  );
}
