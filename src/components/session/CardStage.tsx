import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { Card } from "../../types";
import Flashcard from "../cards/Flashcard";

// Карточка тренировки со свайпом: до переворота свайп переворачивает, после — вправо «знаю», влево «не знаю».
// cardKey меняется с каждой карточкой: новая монтируется сразу лицом вверх. Раньше слово подменялось
// посреди анимации обратного переворота, и мог мелькнуть оборот следующей карточки.
// exitTo — куда улетает оценённая карточка: вправо «помню/знаю», влево «не знаю/забыл», 0 — просто гаснет
const FLY: Variants = {
  enter: { opacity: 0, scale: 0.97 },
  center: { opacity: 1, scale: 1, x: 0, rotate: 0, transition: { duration: 0.18 } },
  exit: (dir: number) => ({ opacity: 0, x: dir * 420, rotate: dir * 12, transition: { duration: dir ? 0.28 : 0.12, ease: "easeIn" } }),
};

export default function CardStage({
  cardKey,
  card,
  language,
  flipped,
  onFlip,
  onSwipe,
  reverse = false,
  exitTo = 0,
}: {
  cardKey: string;
  card: Card;
  language?: string;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (direction: "left" | "right") => void;
  reverse?: boolean;
  exitTo?: -1 | 0 | 1;
}) {
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 0, 160], [-6, 0, 6]);
  const swipedRef = useRef(false);

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 py-4 sm:px-6">
      <motion.div
        className="relative w-full max-w-3xl shrink-0 touch-pan-y"
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
        {/* popLayout: улетающая карточка выходит из потока, следующая сразу встаёт на её место */}
        <AnimatePresence mode="popLayout" initial={false} custom={exitTo}>
        <motion.div key={cardKey} custom={exitTo} variants={FLY} initial="enter" animate="center" exit="exit">
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
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
