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
// exitTo — куда улетает оценённая карточка: вправо «помню/знаю», влево «не знаю/забыл», 0 — просто гаснет.
//
// Колода (deck): под верхней карточкой видны края следующих, каскадом вниз. Оценённая улетает, а новая
// поднимается с места первой карточки стопки (enter = DECK[0]) — как будто снимаешь верхнюю с колоды.
// Края — пустые «рубашки»: они одинаковые, поэтому стопке не нужно сдвигаться, хватает подъёма новой.
// Чем меньше осталось, тем тоньше колода: последняя карточка лежит одна
// Нижняя карточка чуть темнее (band темнее surface в обеих темах) — глубина, как у настоящей стопки
const DECK = [
  { y: 12, scale: 0.95, className: "translate-y-3 scale-95 bg-surface shadow-md" },
  { y: 24, scale: 0.9, className: "translate-y-6 scale-90 bg-band shadow-sm" },
];

const FLY: Variants = {
  enter: { opacity: 1, y: DECK[0].y, scale: DECK[0].scale },
  center: { opacity: 1, y: 0, scale: 1, x: 0, rotate: 0, transition: { duration: 0.24, ease: "easeOut" } },
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
  deck = 0,
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
  deck?: number; // сколько карточек лежит под верхней (покажем края максимум двух)
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
      {/* Отступ снизу — под края колоды, чтобы они не вылезали за область и не давали прокрутку */}
      <div className="relative mb-6 w-full max-w-3xl shrink-0">
      {/* Края колоды не двигаются вместе со свайпом: тянешь только верхнюю карточку */}
      {DECK.slice(0, Math.min(deck, DECK.length))
        .map((layer, i) => (
          <div key={i} aria-hidden className={`pointer-events-none absolute inset-0 origin-bottom rounded-4xl border border-line ${layer.className}`} />
        ))
        .reverse()}
      <motion.div
        className="relative touch-pan-y"
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
        <motion.div key={cardKey} custom={exitTo} variants={FLY} initial="enter" animate="center" exit="exit" style={{ originY: 1 }}>
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
      </div>
    </main>
  );
}
