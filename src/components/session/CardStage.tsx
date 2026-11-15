import { useRef } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, Variants } from "framer-motion";
import { Card } from "../../types";
import { Strength } from "../../utils/srs";
import Flashcard, { CardFront } from "../cards/Flashcard";
import type { ExitTo } from "./useCardSession";

// Карточка тренировки со свайпом: до переворота свайп переворачивает, после — вправо «Помню», влево
// «Не знаю» (SWIPE в ratingLabels.ts). Пока тянешь, на карточке проступает, какая оценка поставится и
// когда слово вернётся (swipe) — раньше свайп был невидимым и молча ставил «Знаю».
// cardKey меняется с каждой карточкой: новая монтируется сразу лицом вверх. Раньше слово подменялось
// посреди анимации обратного переворота, и мог мелькнуть оборот следующей карточки.
// exitTo — куда уходит текущая карточка: вправо «помню/знаю», влево «не знаю/забыл», 0 — гаснет, "deck" —
// обратно в колоду (отмена). enterFrom — откуда приходит новая: из колоды или сбоку (отмена возвращает
// карточку с той стороны, куда она улетела).
//
// Колода (deck): под верхней карточкой видны края следующих, каскадом вниз. Первая под верхней — настоящая
// следующая карточка (next): её слово видно, пока верхняя переворачивается или уезжает под пальцем.
// Оценённая улетает, а следующая поднимается ровно с этого места (enter = DECK[0]) — как будто снимаешь
// верхнюю с колоды. Вторая под ней — только край, чуть темнее: глубина, как у настоящей стопки.
// Чем меньше осталось, тем тоньше колода: последняя карточка лежит одна
const DECK = [
  { y: 12, scale: 0.95, className: "translate-y-3 scale-95" },
  { y: 24, scale: 0.9, className: "translate-y-6 scale-90 brightness-95" },
];

// custom: from — откуда приходит новая (0 из колоды, ±1 сбоку после отмены), exit — куда уходит текущая
type Fly = { from: -1 | 0 | 1; exit: ExitTo };
const FLY: Variants = {
  enter: ({ from }: Fly) =>
    from ? { opacity: 0, x: from * 420, rotate: from * 12, y: 0, scale: 1 } : { opacity: 1, x: 0, rotate: 0, y: DECK[0].y, scale: DECK[0].scale },
  center: { opacity: 1, y: 0, scale: 1, x: 0, rotate: 0, transition: { duration: 0.26, ease: "easeOut" } },
  exit: ({ exit }: Fly) =>
    exit === "deck"
      ? // Отмена: текущая опускается на место первой в колоде, где её лицо уже лежит, и растворяется
        { opacity: 0, x: 0, rotate: 0, y: DECK[0].y, scale: DECK[0].scale, transition: { duration: 0.22, ease: "easeIn" } }
      : { opacity: 0, x: exit * 420, rotate: exit * 12, transition: { duration: exit ? 0.28 : 0.12, ease: "easeIn" } },
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
  next,
  exitTo = 0,
  enterFrom = 0,
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
  deck?: number; // сколько карточек лежит под верхней (покажем максимум две)
  next?: { card: Card; reverse?: boolean; strength?: Strength }; // следующая — её лицо под верхней
  exitTo?: ExitTo;
  enterFrom?: -1 | 0 | 1; // откуда приходит новая карточка: 0 — из колоды, ±1 — сбоку (отмена)
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
        .map((layer, i) =>
          i === 0 && next ? (
            <div key={`${i}:${next.card.id}`} aria-hidden className={`pointer-events-none absolute inset-0 origin-bottom ${layer.className}`}>
              <CardFront card={next.card} reverse={next.reverse} strength={next.strength} />
            </div>
          ) : (
            <div key={i} aria-hidden className={`pointer-events-none absolute inset-0 origin-bottom rounded-4xl border border-accent/15 bg-accent-soft shadow-md ${layer.className}`} />
          ),
        )
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
        {/* custom у AnimatePresence достаётся уходящей карточке, custom у motion.div — приходящей */}
        <AnimatePresence mode="popLayout" initial={false} custom={{ from: 0, exit: exitTo }}>
        <motion.div key={cardKey} custom={{ from: enterFrom, exit: exitTo }} variants={FLY} initial="enter" animate="center" exit="exit" style={{ originY: 1 }}>
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
