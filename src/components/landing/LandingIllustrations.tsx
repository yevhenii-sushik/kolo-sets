import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BatteryFull,
  Check,
  ClipboardPaste,
  Flame,
  Folder,
  Heart,
  Signal,
  Timer,
  Trophy,
  Volume2,
  Wifi,
} from "lucide-react";
import { AppIcon, Badge, Ring, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

// Иллюстрации лендинга — макеты интерфейса Kolo на токенах дизайн-системы.
// Слова на изучаемых языках (bok, amico, 旅行, uttale…) — часть картинки и не переводятся.

// ── Телефон ─────────────────────────────────────────────────────────────────

// Корпус айфона в реальных пропорциях (71.5 × 147 мм). Корпус всегда тёмный — это устройство, а не интерфейс
function PhoneFrame({ children, screenClassName = "bg-bg" }: { children: ReactNode; screenClassName?: string }) {
  return (
    <div className="relative aspect-[71.5/147] rounded-phone bg-brand-night p-2.5 shadow-2xl ring-1 ring-white/10">
      <div className={cx("h-full rounded-phone-screen overflow-hidden flex flex-col px-4 pt-2.5 pb-2", screenClassName)}>
        <div className="flex items-center justify-between h-7 px-2 mb-4 text-2xs font-semibold text-fg">
          <span className="w-14">9:41</span>
          <span className="h-6 w-20 rounded-full bg-brand-night" />
          <span className="w-14 flex items-center justify-end gap-1">
            <Signal size={11} strokeWidth={3} />
            <Wifi size={11} strokeWidth={3} />
            <BatteryFull size={15} />
          </span>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-fg/25" />
      </div>
    </div>
  );
}

// ── Первый экран: телефон с карточкой и слова на орбитах ────────────────────

const RATING_TONES = [
  "bg-danger-soft text-danger",
  "bg-warning-soft text-warning",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
];
// Какую оценку «нажимаем» на каждой карточке
const HERO_RATINGS = [3, 2, 3];

// Слова-спутники на наклонном кольце вокруг телефона, как у Сатурна. Кольцо — круг, сжатый по вертикали
// (SQUASH) и наклонённый (TILT); каждое слово отменяет сжатие и наклон и остаётся ровным. Кольцо нарисовано
// дважды: верхняя половина проходит за телефоном, нижняя — перед ним. Вращение — CSS (animate-orbit),
// его считает браузер на видеокарте, поэтому движение плавное.
const TILT = -12;
const SQUASH = 0.3;
const RING_WORDS = [
  { word: "Haus", flag: "🇩🇪" },
  { word: "libro", flag: "🇪🇸" },
  { word: "사랑", flag: "🇰🇷" },
  { word: "maison", flag: "🇫🇷" },
  { word: "słowo", flag: "🇵🇱" },
].map((w, i, all) => ({ ...w, angle: (360 / all.length) * i }));
const SATELLITE_ANGLE = 36; // оранжевый спутник — между первыми двумя словами

// Точка на кольце в процентах от его размера
const onRing = (angle: number) => {
  const a = (angle * Math.PI) / 180;
  return { left: `${50 + 50 * Math.cos(a)}%`, top: `${50 + 50 * Math.sin(a)}%` };
};
const UPRIGHT = { transform: `scaleY(${1 / SQUASH}) rotate(${-TILT}deg)` };

// Точка на вращающемся кольце: обратное вращение и UPRIGHT отменяют поворот, сжатие и наклон кольца
function OnRing({ angle, children }: { angle: number; children: ReactNode }) {
  return (
    <div className="absolute" style={onRing(angle)}>
      <div className="absolute motion-safe:animate-orbit-reverse">
        <div className="absolute" style={UPRIGHT}>
          {children}
        </div>
      </div>
    </div>
  );
}

function RingHalf({ front }: { front?: boolean }) {
  return (
    <div
      className={cx("absolute left-1/2 top-[58%] aspect-square w-[135%] sm:w-[175%]", front ? "z-20" : "z-0")}
      style={{
        transform: `translate(-50%, -50%) rotate(${TILT}deg) scaleY(${SQUASH})`,
        clipPath: front ? "inset(50% -30% -30% -30%)" : "inset(-30% -30% 50% -30%)",
      }}
    >
      <div className="absolute inset-0 rounded-full border-2 border-muted/25" />
      <div className="absolute inset-0 motion-safe:animate-orbit">
        {RING_WORDS.map(({ word, flag, angle }) => (
          <OnRing key={word} angle={angle}>
            <span className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-fg shadow-md sm:px-3 sm:py-1.5 sm:text-sm">
              <span className="leading-none">{flag}</span>
              {word}
            </span>
          </OnRing>
        ))}
        <OnRing angle={SATELLITE_ANGLE}>
          <span className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
        </OnRing>
      </div>
    </div>
  );
}

export function HeroPhone() {
  const { t } = useI18n();
  const h = t.landing.hero;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % h.cards.length), 3200);
    return () => clearInterval(id);
  }, [h.cards.length]);

  const card = h.cards[index];
  const step = index + 4;

  return (
    <div role="img" aria-label={t.landing.alt.hero} className="relative mx-auto w-60 sm:w-68">
      <div aria-hidden className="pointer-events-none">
        <RingHalf />
        <RingHalf front />
      </div>

      <div className="relative z-10">
        <PhoneFrame>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xs font-semibold text-muted tabular-nums">{step} / 12</span>
            <div className="flex-1 h-2 bg-track rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                animate={{ width: `${(step / 12) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 40, rotate: 4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: -40, rotate: -4 }}
                transition={{ duration: 0.35 }}
                className="h-full rounded-3xl bg-surface border border-line shadow-lg flex flex-col items-center text-center p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{card.flag}</span>
                  <Badge>{card.pos}</Badge>
                </div>
                <div className="flex-1 grid content-center gap-1.5">
                  <div className="font-display text-3xl font-semibold text-fg">{card.word}</div>
                  <div className="text-lg font-semibold text-accent-ink">{card.translation}</div>
                  <div className="text-xs text-faint leading-snug">{card.example}</div>
                </div>
                <span className="w-9 h-9 rounded-full bg-info-soft text-info grid place-items-center">
                  <Volume2 size={16} />
                </span>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mt-4">
            {h.ratings.map((label, i) => (
              <motion.div
                key={label}
                animate={i === HERO_RATINGS[index] ? { scale: [1, 0.92, 1.04, 1] } : { scale: 1 }}
                transition={{ duration: 0.5, delay: 2 }}
                className={cx("py-2 px-0.5 rounded-xl text-2xs leading-tight font-semibold text-center hyphens-auto", RATING_TONES[i])}
              >
                {label}
              </motion.div>
            ))}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

// ── Превью режимов (декоративные: подписи режимов — рядом, текстом) ─────────

export function FlashcardsPreview() {
  const { t } = useI18n();
  const card = t.landing.hero.cards[1];
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setFlipped((f) => !f), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative w-52 h-64 sm:w-56">
      <div className="absolute inset-0 translate-x-3 rotate-6 rounded-3xl bg-surface border border-line" />
      <div className="absolute inset-0 -rotate-3 rounded-3xl bg-surface border border-line" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={String(flipped)}
          initial={{ rotateY: 90, opacity: 0.6 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: -90, opacity: 0.6 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 rounded-3xl bg-surface border border-line shadow-lg grid content-center justify-items-center gap-2 p-6 text-center"
        >
          {flipped ? (
            <>
              <div className="font-display text-2xl font-semibold text-accent-ink">{card.translation}</div>
              <div className="text-xs text-faint leading-snug">{card.example}</div>
            </>
          ) : (
            <>
              <span className="text-2xl leading-none">{card.flag}</span>
              <div className="font-display text-4xl font-semibold text-fg">{card.word}</div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function ReviewPreview() {
  const { t } = useI18n();
  const cards = t.landing.hero.cards;
  return (
    <div className="flex items-center gap-6 px-5">
      <Ring value={0.4} size={88} stroke={8} label={`${cards.length} ${t.landing.modes.preview.due}`}>
        <span className="font-display text-2xl font-semibold text-fg">{cards.length}</span>
      </Ring>
      <div className="grid gap-2 w-44">
        {cards.map((c, i) => (
          <div key={c.word} className="flex items-center gap-2.5 rounded-2xl bg-surface border border-line px-3 py-2">
            <span className="leading-none">{c.flag}</span>
            <span className="flex-1 truncate text-sm font-semibold text-fg">{c.word}</span>
            <span className={cx("w-2 h-2 rounded-full", i === 0 ? "bg-accent" : "bg-track")} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuizPreview() {
  const { t } = useI18n();
  const cards = t.landing.hero.cards;
  return (
    <div className="grid gap-1.5 w-full max-w-56 px-4">
      <div className="text-center pb-1">
        <div className="text-2xs text-faint">{t.landing.modes.preview.question}</div>
        <div className="font-display text-lg font-semibold text-fg">{cards[1].word}</div>
      </div>
      {cards.map((c, i) => (
        <div
          key={c.word}
          className={cx(
            "flex items-center justify-between rounded-xl border px-3 py-1.5 text-xs font-medium",
            i === 1 ? "border-success bg-success-soft text-success" : "border-line bg-surface text-muted",
          )}
        >
          {c.translation}
          {i === 1 && <Check size={13} strokeWidth={3} />}
        </div>
      ))}
    </div>
  );
}

export function SpeedPreview() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-5">
      <Ring value={42 / 60} size={92} stroke={8} label="0:42">
        <span className="font-display text-lg font-semibold text-fg tabular-nums">0:42</span>
      </Ring>
      <div>
        <div className="font-display text-3xl font-semibold text-fg">12</div>
        <div className="text-xs text-faint">{t.landing.modes.preview.score}</div>
      </div>
    </div>
  );
}

export function SurvivalPreview() {
  const { t } = useI18n();
  const card = t.landing.hero.cards[2];
  return (
    <div className="grid justify-items-center gap-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Heart key={i} size={30} className={i < 2 ? "text-danger fill-danger" : "text-track fill-track"} />
        ))}
      </div>
      <span className="rounded-full bg-surface border border-line px-4 py-1.5 font-display text-base font-semibold text-fg">
        {card.word}
      </span>
    </div>
  );
}

export function MatchPreview() {
  const { t } = useI18n();
  const cards = t.landing.hero.cards;
  // Справа переводы в другом порядке; первая пара уже найдена, второе слово выбрано
  const right = [cards[1], cards[0], cards[2]];
  const tile = "rounded-xl border px-3 py-1.5 text-xs font-semibold text-center truncate";
  return (
    <div className="grid gap-2.5 w-full max-w-sm px-4">
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c, i) => (
          <div key={c.word} className="contents">
            <div
              className={cx(
                tile,
                i === 0 && "border-success bg-success-soft text-success",
                i === 1 && "border-accent bg-accent-soft text-accent-ink",
                i === 2 && "border-line bg-surface text-fg",
              )}
            >
              {c.word}
            </div>
            <div
              className={cx(
                tile,
                right[i] === cards[0] ? "border-success bg-success-soft text-success" : "border-line bg-surface text-muted",
              )}
            >
              {right[i].translation}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-faint tabular-nums">
        <Timer size={13} /> 0:18 · {t.landing.modes.preview.best} 0:31
      </div>
    </div>
  );
}

// ── Методика: кривая забывания на инверсном блоке (bg-fg) ───────────────────

const TOP = 30;
const BOTTOM = 210;
const LEFT = 40;
const RIGHT = 385;
const REVIEWS = [110, 190, 285];

// Экспоненциальный спад от 100% (TOP) до y1 между x0 и x1
const decay = (x0: number, x1: number, y1: number) => {
  const dx = x1 - x0;
  return `C${x0 + dx * 0.2},${TOP + (y1 - TOP) * 0.65} ${x0 + dx * 0.5},${y1 - (y1 - TOP) * 0.05} ${x1},${y1}`;
};

const KOLO_PATH = [
  `M${LEFT},${TOP}`,
  decay(LEFT, REVIEWS[0], 150),
  `L${REVIEWS[0]},${TOP}`,
  decay(REVIEWS[0], REVIEWS[1], 118),
  `L${REVIEWS[1]},${TOP}`,
  decay(REVIEWS[1], REVIEWS[2], 92),
  `L${REVIEWS[2]},${TOP}`,
  decay(REVIEWS[2], RIGHT, 72),
].join(" ");
const WITHOUT_PATH = `M${LEFT},${TOP} C70,150 140,195 ${RIGHT},${BOTTOM - 6}`;

export function ForgettingCurve() {
  const { t } = useI18n();
  const m = t.landing.method;

  return (
    <figure role="img" aria-label={t.landing.alt.curve} className="rounded-3xl border border-on-inverse/10 p-5 sm:p-6">
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4 text-xs font-medium text-on-inverse/75">
        <span className="flex items-center gap-2">
          <span className="w-5 h-1 rounded-full bg-accent" />
          {m.withKolo}
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 border-t-2 border-dashed border-on-inverse/40" />
          {m.without}
        </span>
      </div>

      <svg viewBox="0 0 400 250" className="w-full h-auto" aria-hidden>
        <defs>
          <linearGradient id="koloCurveFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: "var(--color-accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {[TOP, 90, 150, BOTTOM].map((y) => (
          <line
            key={y}
            x1={LEFT}
            x2={RIGHT}
            y1={y}
            y2={y}
            strokeDasharray={y === BOTTOM ? undefined : "3 5"}
            className="stroke-on-inverse/15"
          />
        ))}
        <text
          x={14}
          y={(TOP + BOTTOM) / 2}
          transform={`rotate(-90 14 ${(TOP + BOTTOM) / 2})`}
          textAnchor="middle"
          className="fill-on-inverse/60 text-xs font-medium"
        >
          {m.memory}
        </text>
        <text x={RIGHT} y={245} textAnchor="end" className="fill-on-inverse/60 text-xs font-medium">
          {m.time} →
        </text>

        <motion.path
          d={`${KOLO_PATH} L${RIGHT},${BOTTOM} L${LEFT},${BOTTOM} Z`}
          fill="url(#koloCurveFill)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.8 }}
        />
        <motion.path
          d={WITHOUT_PATH}
          fill="none"
          strokeWidth={2.5}
          strokeDasharray="6 6"
          strokeLinecap="round"
          className="stroke-on-inverse/40"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={KOLO_PATH}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-accent"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />

        {REVIEWS.map((x, i) => (
          <motion.g
            key={x}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.45, type: "spring" }}
            style={{ transformOrigin: `${x}px ${TOP}px` }}
          >
            <circle cx={x} cy={TOP} r={8} strokeWidth={3} className="fill-accent stroke-fg" />
            <text x={x} y={BOTTOM + 18} textAnchor="middle" className="fill-on-inverse/80 text-xs font-semibold">
              {m.intervals[i]}
            </text>
          </motion.g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-on-inverse/60">{m.schematic}</figcaption>
    </figure>
  );
}

// ── Привычка ────────────────────────────────────────────────────────────────

export function StreakPreview() {
  const { t } = useI18n();
  const h = t.landing.habit;
  return (
    <div className="grid gap-4 w-full max-w-64 px-4">
      <div className="flex items-end justify-center gap-2">
        <Flame size={30} className="text-accent fill-accent self-center" />
        <span className="font-display text-4xl font-semibold leading-none text-fg">14</span>
        <span className="text-sm text-faint">{h.days}</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {h.week.map((day, i) => (
          <div key={i} className="grid justify-items-center gap-1">
            <span className="text-2xs text-faint">{day}</span>
            <span
              className={cx(
                "w-7 h-7 rounded-full grid place-items-center",
                i < 5 && "bg-accent text-on-accent",
                i === 5 && "border-2 border-dashed border-accent",
                i === 6 && "bg-track",
              )}
            >
              {i < 5 && <Check size={13} strokeWidth={3} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const HEX = "polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)";
const HONEYCOMB = [["S", "K"], ["R", "E", "I"], ["V", "T"]];

export function DailyPreview() {
  return (
    <div>
      {HONEYCOMB.map((row, r) => (
        <div key={r} className={cx("flex justify-center gap-1", r > 0 && "-mt-2")}>
          {row.map((letter) => (
            <div
              key={letter}
              style={{ clipPath: HEX }}
              className={cx(
                "w-11 h-12 grid place-items-center font-display text-base font-semibold",
                letter === "E" ? "bg-accent text-on-accent" : "bg-surface text-fg",
              )}
            >
              {letter}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AchievementPreview() {
  const { t } = useI18n();
  return (
    <div className="grid justify-items-center gap-3 px-4 text-center">
      <span className="w-16 h-16 rounded-full bg-warning-soft text-warning grid place-items-center ring-4 ring-surface">
        <Trophy size={30} />
      </span>
      <span className="text-sm font-semibold text-fg">{t.landing.habit.achievementName}</span>
    </div>
  );
}

// ── Свои слова ──────────────────────────────────────────────────────────────

const SET_PROGRESS = [
  { tone: "bg-accent", value: 72 },
  { tone: "bg-info", value: 45 },
  { tone: "bg-success", value: 18 },
];

export function SetsPreview() {
  const { t } = useI18n();
  const w = t.landing.words;
  return (
    <div className="relative w-full max-w-sm px-4 pb-16">
      <div className="rounded-3xl bg-surface border border-line p-4 shadow-md">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-9 h-9 rounded-xl bg-accent-soft text-accent-ink grid place-items-center">
            <Folder size={18} />
          </span>
          <span className="flex-1 truncate text-sm font-semibold text-fg">{w.folder}</span>
          <Badge>{w.setList.length}</Badge>
        </div>
        <div className="grid gap-2">
          {w.setList.map((set, i) => (
            <div key={set.name} className="flex items-center gap-3 rounded-2xl bg-inset p-2.5">
              <span className="w-8 h-8 rounded-xl bg-surface grid place-items-center leading-none">{set.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-fg">{set.name}</span>
                  <span className="shrink-0 text-2xs text-faint">{set.count}</span>
                </div>
                <div className="h-1.5 mt-1.5 rounded-full bg-track overflow-hidden">
                  <motion.div
                    className={cx("h-full rounded-full", SET_PROGRESS[i].tone)}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${SET_PROGRESS[i].value}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.9 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-52 rotate-2 rounded-2xl bg-fg text-on-inverse p-3.5 shadow-xl">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-on-inverse/75">
          <ClipboardPaste size={14} />
          {w.import}
        </div>
        <div className="mt-2 grid gap-0.5 font-mono text-xs">
          {w.importLines.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

const WAVE = [10, 22, 34, 18, 40, 28, 14, 36, 24, 44, 20, 30, 12];

export function AudioPreview() {
  const { t } = useI18n();
  return (
    <div className="grid justify-items-center gap-5 px-4 text-center">
      <div>
        <div className="font-display text-4xl font-semibold text-fg">uttale</div>
        <div className="mt-1 text-base font-semibold text-accent-ink">{t.landing.words.audioTranslation}</div>
      </div>
      <div className="flex items-center gap-4">
        <span className="relative shrink-0">
          <motion.span
            className="absolute inset-0 rounded-full bg-info"
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
          <span className="relative w-14 h-14 rounded-full bg-info text-white grid place-items-center">
            <Volume2 size={24} />
          </span>
        </span>
        <div className="flex items-center gap-1 h-11">
          {WAVE.map((height, i) => (
            <motion.span
              key={i}
              className="w-1.5 rounded-full bg-info"
              style={{ height }}
              animate={{ scaleY: [0.35, 1, 0.35] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.07 }}
            />
          ))}
        </div>
      </div>
      <div className="text-sm text-faint">Uttalen er viktig.</div>
    </div>
  );
}

// ── Домашний экран телефона с иконкой Kolo ─────────────────────────────────

// 20 мест на экране; на одном — Kolo
const HOME_SLOTS = 20;
const KOLO_SLOT = 9;

export function HomeScreenPhone() {
  const { t } = useI18n();

  return (
    <div role="img" aria-label={t.landing.alt.homeScreen} className="relative mx-auto w-60 sm:w-64">
      <PhoneFrame screenClassName="bg-band">
        <div className="grid grid-cols-4 gap-x-3 gap-y-5 px-1 mt-2">
          {Array.from({ length: HOME_SLOTS }, (_, i) =>
            i === KOLO_SLOT ? (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, type: "spring", damping: 10 }}
                className="relative flex flex-col items-center"
              >
                <AppIcon className="w-full h-auto drop-shadow-lg" />
                <span className="absolute -bottom-4 text-2xs font-semibold text-fg whitespace-nowrap">Kolo</span>
              </motion.div>
            ) : (
              <div key={i} className="aspect-square rounded-xl bg-track" />
            ),
          )}
        </div>
        <div className="mt-auto flex justify-center gap-1.5 mb-3">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className={cx("w-1.5 h-1.5 rounded-full", dot ? "bg-fg/20" : "bg-fg/60")} />
          ))}
        </div>
        <div className="flex justify-between p-2.5 rounded-3xl bg-surface/70">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-9 h-9 rounded-xl bg-track" />
          ))}
        </div>
      </PhoneFrame>
    </div>
  );
}
