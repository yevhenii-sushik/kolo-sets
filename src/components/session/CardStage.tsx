import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { Card } from "../../types";
import { Strength } from "../../utils/srs";
import Flashcard from "../cards/Flashcard";

// Карточка тренировки со свайпом: до переворота свайп переворачивает, после — вправо «Помню», влево
// «Не знаю» (SWIPE в ratingLabels.ts). Пока тянешь, на карточке проступает, какая оценка поставится и
// когда слово вернётся (swipe) — раньше свайп был невидимым и молча ставил «Знаю».
// cardKey меняется с каждой карточкой: новая монтируется сразу лицом вверх. Раньше слово подменялось
// посреди анимации обратного переворота, и мог мелькнуть оборот следующей карточки.
// exitTo — куда улетает оценённая карточка: вправо «помню/знаю», влево «не знаю/забыл», 0 — просто гаснет
const FLY: Variants = {
  enter: { opacity: 0, scale: 0.97 },
  center: { opacity: 1, scale: 1, x: 0, rotate: 0, transition: { duration: 0.18 } },
  exit: (dir: number) => ({ opacity: 0, x: dir * 420, rotate: dir * 12, transition: { duration: dir ? 0.28 : 0.12, ease: "easeIn" } }),
};

const SWIPE_DISTANCE = 60; // короче — не свайп, а дрогнувший палец

export default function CardStage({
  cardKey,
  card,
  language,
  flipped,
  onFlip,
  onSwipe,
  swipe,
  reverse = false,
  strength,
  exitTo = 0,
}: {
  cardKey: string;
  card: Card;
  language?: string;
  flipped: boolean;
  onFlip: () => void;
  onSwipe: (direction: "left" | "right") => void;
  swipe?: { left: string; right: string }; // подписи оценок для свайпа после переворота
  reverse?: boolean;
  strength?: Strength;
  exitTo?: -1 | 0 | 1;
}) {
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 0, 160], [-6, 0, 6]);
  // Подпись становится чёткой к моменту, когда отпускание уже засчитается свайпом
  const rightOpacity = useTransform(dragX, [12, SWIPE_DISTANCE], [0, 1]);
  const leftOpacity = useTransform(dragX, [-SWIPE_DISTANCE, -12], [1, 0]);
  const swipedRef = useRef(false);

  const stamp = "pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-md";

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
          if (!didSwipe || Math.abs(info.offset.x) < SWIPE_DISTANCE) return;
          if (!flipped) onFlip();
          else onSwipe(info.offset.x > 0 ? "right" : "left");
        }}
      >
        {flipped && swipe && (
          <>
            <motion.span aria-hidden style={{ opacity: rightOpacity }} className={`${stamp} bg-info-soft text-info`}>
              {swipe.right}
            </motion.span>
            <motion.span aria-hidden style={{ opacity: leftOpacity }} className={`${stamp} bg-danger-soft text-danger`}>
              {swipe.left}
            </motion.span>
          </>
        )}
        {/* popLayout: улетающая карточка выходит из потока, следующая сразу встаёт на её место */}
        <AnimatePresence mode="popLayout" initial={false} custom={exitTo}>
        <motion.div key={cardKey} custom={exitTo} variants={FLY} initial="enter" animate="center" exit="exit">
          <Flashcard
            card={card}
            language={language}
            isFlipped={flipped}
            reverse={reverse}
            strength={strength}
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
