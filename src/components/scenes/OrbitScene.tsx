import { createContext, useContext, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cx } from "../../ui";

// Сцены «Орбиты» — живые картинки к состояниям приложения (docs/roadmap.md, «Живой Kolo»). Та же метафора,
// что у знака: слова — спутники, память — орбита. Каждая сцена рассказывает, что сейчас со словами:
//   drift  — слова уплывают с орбиты (пора повторить, Perigee их вернёт);
//   launch — новые слова заходят на орбиту;
//   calm   — всё на своих местах, орбиты спокойно вращаются;
//   empty  — пустая орбита и один спутник с «плюсом»: начни отсюда;
//   rest   — луна и спящие спутники: на сегодня хватит.
// Это не знак Kolo (его нельзя вставлять картинкой, см. src/design/README.md): ядро — планета, а не кольцо
// со спутником. Цвета — только токены; при «уменьшить движение» сцена стоит на месте, но смысл читается.
//
// halo — сцена вокруг чужого центра: планеты нет, орбиты обходят то, что лежит посередине (на главной —
// кольцо цели дня). Сцену тогда делают примерно в 2,4 раза больше центра: внутренняя орбита (r = 46)
// проходит сразу за ним.

export type SceneKind = "drift" | "launch" | "calm" | "empty" | "rest";
type Tone = "inverse" | "surface";

const C = 100; // центр сцены, viewBox 0 0 200 200

// Точка на окружности радиуса r под углом deg (0° — справа, по часовой)
const at = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

// inverse — на тёмном блоке главной (bg-fg), surface — на обычном фоне и вложенных карточках
const PALETTE: Record<Tone, { ring: string; body: string; dim: string; star: string; glow: string }> = {
  inverse: { ring: "stroke-on-inverse/15", body: "fill-on-inverse", dim: "fill-on-inverse/35", star: "fill-on-inverse/70", glow: "fill-accent/15" },
  surface: { ring: "stroke-muted/30", body: "fill-fg", dim: "fill-muted/45", star: "fill-muted/60", glow: "fill-accent/15" },
};
type Palette = (typeof PALETTE)[Tone];

const STARS = [
  { x: 28, y: 34, r: 1.8, d: 0 },
  { x: 168, y: 24, r: 1.4, d: 1.1 },
  { x: 182, y: 150, r: 1.8, d: 0.6 },
  { x: 22, y: 128, r: 1.3, d: 1.7 },
  { x: 60, y: 182, r: 1.6, d: 2.2 },
  { x: 140, y: 186, r: 1.2, d: 0.3 },
];

const Halo = createContext(false);
// Под центром обычно подпись (на главной — «Цель дня»): нижняя часть орбит плавно гаснет, чтобы
// спутники не проходили по тексту
const HALO_FADE = {
  maskImage: "linear-gradient(to bottom, black 58%, transparent 72%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 58%, transparent 72%)",
};

export function OrbitScene({ kind, tone = "surface", halo = false, className }: { kind: SceneKind; tone?: Tone; halo?: boolean; className?: string }) {
  const p = PALETTE[tone];
  return (
    <Halo.Provider value={halo}>
      <svg viewBox="0 0 200 200" aria-hidden className={cx("pointer-events-none select-none", className)} style={halo ? HALO_FADE : undefined}>
        <Stars p={p} slow={kind === "rest"} />
        {kind === "drift" && <Drift p={p} />}
        {kind === "launch" && <Launch p={p} />}
        {kind === "calm" && <Calm p={p} />}
        {kind === "empty" && <Empty p={p} />}
        {kind === "rest" && <Rest p={p} />}
      </svg>
    </Halo.Provider>
  );
}

// Вращение группы вокруг центра — CSS (animate-orbit из токенов): его считает видеокарта, и motion-safe
// сам выключает его при «уменьшить движение»
function Spin({ seconds, reverse, children }: { seconds: number; reverse?: boolean; children: React.ReactNode }) {
  return (
    <g
      className={reverse ? "motion-safe:animate-orbit-reverse" : "motion-safe:animate-orbit"}
      style={{ transformOrigin: `${C}px ${C}px`, transformBox: "view-box", animationDuration: `${seconds}s` }}
    >
      {children}
    </g>
  );
}

function Stars({ p, slow }: { p: Palette; slow?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <>
      {STARS.map((s) => (
        <motion.circle
          key={`${s.x}-${s.y}`}
          cx={s.x}
          cy={s.y}
          r={s.r}
          className={p.star}
          animate={reduce ? undefined : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: slow ? 5 : 3, delay: s.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Orbit({ r, p, dashed }: { r: number; p: Palette; dashed?: boolean }) {
  return <circle cx={C} cy={C} r={r} fill="none" strokeWidth={1.5} strokeDasharray={dashed ? "3 6" : undefined} strokeLinecap="round" className={p.ring} />;
}

// Планета в центре: мягкое свечение и ядро. В режиме halo центр занят другим
function Core({ p, r = 15 }: { p: Palette; r?: number }) {
  if (useContext(Halo)) return null;
  return (
    <>
      <circle cx={C} cy={C} r={r + 9} className={p.glow} />
      <circle cx={C} cy={C} r={r} className="fill-accent" />
      <circle cx={C - r * 0.35} cy={C - r * 0.35} r={r * 0.28} className="fill-on-accent/20" />
    </>
  );
}

// Спутники, равномерно расставленные по орбите (в группе вращения)
function Satellites({ r, angles, size, className }: { r: number; angles: number[]; size: number; className: string }) {
  return (
    <>
      {angles.map((deg) => {
        const pt = at(r, deg);
        return <circle key={deg} cx={pt.x} cy={pt.y} r={size} className={className} />;
      })}
    </>
  );
}

// ── Сцены ───────────────────────────────────────────────────────────────────

function Calm({ p }: { p: Palette }) {
  return (
    <>
      <Orbit r={46} p={p} />
      <Orbit r={76} p={p} />
      <Spin seconds={36}>
        <Satellites r={46} angles={[20, 140, 260]} size={5} className={p.body} />
      </Spin>
      <Spin seconds={70} reverse>
        <Satellites r={76} angles={[60, 150, 240, 330]} size={4.5} className="fill-accent" />
      </Spin>
      <Core p={p} />
    </>
  );
}

// Слово уходит с орбиты по пунктиру и возвращается: так выглядит забывание и повторение
const DRIFTERS = [
  { deg: 205, delay: 0 },
  { deg: 120, delay: 1.2 },
  { deg: 300, delay: 2.1 },
];

function Drift({ p }: { p: Palette }) {
  const reduce = useReducedMotion();
  return (
    <>
      <Orbit r={56} p={p} />
      <Spin seconds={48}>
        <Satellites r={56} angles={[0, 70, 160, 250]} size={4.5} className={p.body} />
      </Spin>
      {DRIFTERS.map(({ deg, delay }) => {
        const a = at(56, deg);
        const b = at(90, deg);
        return (
          <g key={deg}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={1.5} strokeDasharray="2 5" strokeLinecap="round" className={p.ring} />
            <motion.circle
              cx={a.x}
              cy={a.y}
              r={5.5}
              className="fill-accent"
              animate={reduce ? { x: (b.x - a.x) * 0.6, y: (b.y - a.y) * 0.6 } : { x: [0, b.x - a.x], y: [0, b.y - a.y], opacity: [1, 0.45] }}
              transition={reduce ? { duration: 0 } : { duration: 3.4, delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </g>
        );
      })}
      <Core p={p} />
    </>
  );
}

// Новые слова летят к орбите из глубины и встают на неё
const INCOMING = [
  { from: { x: 18, y: 186 }, deg: 140, delay: 0 },
  { from: { x: 8, y: 132 }, deg: 175, delay: 1.1 },
  { from: { x: 70, y: 196 }, deg: 112, delay: 2.2 },
];

function Launch({ p }: { p: Palette }) {
  const reduce = useReducedMotion();
  return (
    <>
      <Orbit r={56} p={p} />
      <Spin seconds={40}>
        <Satellites r={56} angles={[-60, 30, 260]} size={4.5} className={p.body} />
      </Spin>
      {INCOMING.map(({ from, deg, delay }) => {
        const end = at(56, deg);
        return (
          <g key={deg}>
            <line x1={from.x} y1={from.y} x2={end.x} y2={end.y} strokeWidth={1.5} strokeDasharray="2 5" strokeLinecap="round" className={p.ring} />
            <motion.circle
              cx={end.x}
              cy={end.y}
              r={5}
              className="fill-accent"
              animate={
                reduce
                  ? { x: 0, y: 0 }
                  : { x: [from.x - end.x, 0, 0], y: [from.y - end.y, 0, 0], opacity: [0, 1, 1], scale: [0.4, 1, 1] }
              }
              transition={reduce ? { duration: 0 } : { duration: 3.2, times: [0, 0.6, 1], delay, repeat: Infinity, ease: "easeOut" }}
            />
          </g>
        );
      })}
      <Core p={p} />
    </>
  );
}

function Empty({ p }: { p: Palette }) {
  const reduce = useReducedMotion();
  const halo = useContext(Halo);
  const top = at(56, -90);
  return (
    <>
      <Spin seconds={90}>
        <Orbit r={56} p={p} dashed />
      </Spin>
      {!halo && <circle cx={C} cy={C} r={15} fill="none" strokeWidth={2} strokeDasharray="4 4" className={p.ring} />}
      <motion.g
        animate={reduce ? undefined : { scale: [1, 1.18, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${top.x}px ${top.y}px`, transformBox: "view-box" }}
      >
        <circle cx={top.x} cy={top.y} r={15} className={p.glow} />
        <circle cx={top.x} cy={top.y} r={9} className="fill-accent" />
        <path d={`M${top.x - 4} ${top.y}h8M${top.x} ${top.y - 4}v8`} strokeWidth={2} strokeLinecap="round" className="stroke-on-accent" />
      </motion.g>
    </>
  );
}

// Луна вместо планеты и спутники, которые еле движутся: слова «отдыхают» до завтра.
// В режиме halo луна поменьше и висит над орбитой справа — центр занят
function Rest({ p }: { p: Palette }) {
  const reduce = useReducedMotion();
  const halo = useContext(Halo);
  const id = `moon-${useId().replace(/:/g, "")}`;
  const m = halo ? at(80, -40) : { x: C, y: C }; // центр луны
  const k = halo ? 0.6 : 1; // её масштаб
  return (
    <>
      <defs>
        <mask id={id}>
          <circle cx={m.x} cy={m.y} r={17 * k} fill="white" />
          <circle cx={m.x + 8 * k} cy={m.y - 7 * k} r={14 * k} fill="black" />
        </mask>
      </defs>
      <Orbit r={56} p={p} />
      <Spin seconds={160}>
        <Satellites r={56} angles={[15, 105, 195, 285]} size={4.5} className={p.dim} />
      </Spin>
      <circle cx={m.x} cy={m.y} r={26 * k} className={p.glow} />
      <circle cx={m.x} cy={m.y} r={17 * k} className="fill-accent" mask={`url(#${id})`} />
      {[0, 1, 2].map((i) => (
        <motion.text
          key={i}
          x={m.x + (22 + i * 9) * k}
          y={m.y - (20 + i * 10) * k}
          fontSize={(10 + i * 3) * k}
          className={cx("font-display font-extrabold", p.dim)}
          animate={reduce ? undefined : { opacity: [0, 1, 0], y: [4, -4, -8] }}
          transition={{ duration: 3.6, delay: i * 0.9, repeat: Infinity, ease: "easeInOut" }}
        >
          z
        </motion.text>
      ))}
    </>
  );
}
