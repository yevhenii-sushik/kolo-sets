import { useId, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Quote, Sparkles } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { cx } from "../../ui";
import { PLANETS, RINGS, SKIES, seeded } from "../../progression/looks";
import { itemById, type Rarity } from "../../../server/core/items";

// Оттенки редкости — токены интерфейса (подписи, рамки), а не цвета самих предметов
export const RARITY_TONE: Record<Rarity, { text: string; soft: string; border: string }> = {
  common: { text: "text-muted", soft: "bg-inset", border: "border-line" },
  rare: { text: "text-info", soft: "bg-info-soft", border: "border-info" },
  epic: { text: "text-special", soft: "bg-special-soft", border: "border-special" },
  legendary: { text: "text-accent-ink", soft: "bg-accent-soft", border: "border-accent" },
};

export function RarityChip({ rarity, className }: { rarity: Rarity; className?: string }) {
  const { t } = useI18n();
  const tone = RARITY_TONE[rarity];
  return (
    <span className={cx("inline-flex w-fit items-center rounded-full px-2 py-0.5 text-2xs font-semibold", tone.soft, tone.text, className)}>
      {t.rewards.rarity[rarity]}
    </span>
  );
}

// Спутник: планета с бликом, полосами, кратерами, кольцом или свечением
export function SatelliteArt({ id, size = 40, className }: { id: string; size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const look = PLANETS[id];
  if (!look) return null;
  const r = look.ring ? 11 : 14;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <radialGradient id={`p${uid}`} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor={look.light} />
          <stop offset="45%" stopColor={look.base} />
          <stop offset="100%" stopColor={look.shade} />
        </radialGradient>
        <clipPath id={`c${uid}`}>
          <circle cx="20" cy="20" r={r} />
        </clipPath>
        {look.glow && (
          <radialGradient id={`g${uid}`}>
            <stop offset="40%" stopColor={look.glow} stopOpacity="0.55" />
            <stop offset="100%" stopColor={look.glow} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      {look.glow && <circle cx="20" cy="20" r="20" fill={`url(#g${uid})`} />}
      {look.rays && (
        <g stroke={look.light} strokeWidth="1.2" strokeLinecap="round" opacity="0.9">
          <line x1="20" y1="1" x2="20" y2="7" />
          <line x1="20" y1="33" x2="20" y2="39" />
          <line x1="1" y1="20" x2="7" y2="20" />
          <line x1="33" y1="20" x2="39" y2="20" />
        </g>
      )}
      {look.ring && (
        <ellipse cx="20" cy="20" rx="18.5" ry="5.5" fill="none" stroke={look.ring} strokeWidth="2.2" opacity="0.7" transform="rotate(-18 20 20)" />
      )}
      <circle cx="20" cy="20" r={r} fill={`url(#p${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        {look.bands?.map((c, i) => (
          <rect key={i} x="0" y={14 + i * 5.5} width="40" height="2.6" fill={c} opacity="0.75" />
        ))}
        {look.craters && (
          <g fill={look.shade} opacity="0.35">
            <circle cx="15" cy="17" r="2.6" />
            <circle cx="24" cy="24" r="3.2" />
            <circle cx="23" cy="13" r="1.6" />
          </g>
        )}
      </g>
      {look.ring && (
        <path d="M 1.5 20 A 18.5 5.5 0 0 0 38.5 20" fill="none" stroke={look.ring} strokeWidth="2.2" transform="rotate(-18 20 20)" />
      )}
    </svg>
  );
}

// Кольцо: дуга прогресса в цветах раскраски (value = 1 — целиком), пунктир, свечение, вращение
export function RingArt({
  id,
  size = 48,
  stroke = 5,
  value = 1,
  className,
}: {
  id?: string;
  size?: number;
  stroke?: number;
  value?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const look = id ? RINGS[id] : undefined;
  const r = (size - stroke) / 2 - (look?.glow ? 2 : 0);
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  const arc = (
    <circle
      cx={size / 2}
      cy={size / 2}
      r={r}
      fill="none"
      strokeWidth={stroke}
      strokeLinecap={look?.dash ? "butt" : "round"}
      stroke={look ? `url(#r${uid})` : undefined}
      className={look ? undefined : "stroke-special"}
      strokeDasharray={look?.dash ? `${c / 48} ${c / 48}` : `${c}`}
      strokeDashoffset={look?.dash ? 0 : c * (1 - v)}
      filter={look?.glow ? `url(#f${uid})` : undefined}
      style={{ transition: "stroke-dashoffset 0.6s ease" }}
    />
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={cx("-rotate-90", className)} aria-hidden>
      <defs>
        {look && (
          <linearGradient id={`r${uid}`} x1="0" y1="0" x2="1" y2="1">
            {look.stops.map((s, i) => (
              <stop key={i} offset={`${(i / Math.max(1, look.stops.length - 1)) * 100}%`} stopColor={s} />
            ))}
          </linearGradient>
        )}
        {look?.glow && (
          <filter id={`f${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-track" />
      {look?.spin && !reduce ? (
        <motion.g
          style={{ originX: "50%", originY: "50%" }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        >
          {arc}
        </motion.g>
      ) : (
        arc
      )}
      {/* В пунктирном кольце прогресс показывает сплошная тонкая дуга поверх звёзд */}
      {look?.dash && v < 1 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={Math.max(1.5, stroke / 3)}
          strokeLinecap="round"
          stroke={look.stops[1]}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
        />
      )}
    </svg>
  );
}

// Фон профиля: градиент, звёзды, сияние, туманность, метеоры. Заполняет родителя (position: relative)
export function BackgroundArt({ id, className, children }: { id: string; className?: string; children?: ReactNode }) {
  const reduce = useReducedMotion();
  const look = SKIES[id];
  if (!look) return null;
  const rand = seeded(id);
  const stars = Array.from({ length: look.stars ?? 0 }, () => {
    const x = rand() * 100;
    // Млечный Путь: звёзды гуще вдоль диагонали
    const y = look.band && rand() < 0.6 ? Math.min(98, Math.max(2, 100 - x + (rand() - 0.5) * 30)) : rand() * 100;
    return { x, y, r: 0.4 + rand() * 0.9, o: 0.35 + rand() * 0.65 };
  });
  return (
    <div className={cx("absolute inset-0 overflow-hidden", className)} style={{ background: look.gradient }} aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {look.nebula?.map((c, i) => (
          <ellipse key={i} cx={25 + i * 28} cy={40 + (i % 2) * 25} rx="30" ry="22" fill={c} opacity="0.28" style={{ filter: "blur(6px)" }} />
        ))}
        {look.aurora?.map((c, i) => (
          <path
            key={i}
            d={`M -5 ${55 + i * 12} C 25 ${20 + i * 10}, 55 ${75 - i * 8}, 105 ${30 + i * 10}`}
            stroke={c}
            strokeWidth="9"
            fill="none"
            opacity="0.35"
            style={{ filter: "blur(4px)" }}
          />
        ))}
        {look.band && <path d="M -5 105 L 105 -5" stroke="#C7D2FE" strokeWidth="26" opacity="0.08" style={{ filter: "blur(5px)" }} />}
      </svg>
      {/* Звёзды — кружками в процентах, чтобы не растягивались вместе с фоном */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2.4, height: s.r * 2.4, opacity: s.o, background: "#FFFFFF" } as CSSProperties}
        />
      ))}
      {look.meteors &&
        !reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute h-px w-16 rounded-full"
            style={{ background: "linear-gradient(90deg, rgba(255,255,255,0), #FFFFFF)", top: `${10 + i * 22}%`, left: `${20 + i * 25}%`, rotate: 25 }}
            initial={{ x: -80, y: -40, opacity: 0 }}
            animate={{ x: 160, y: 75, opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5 + i * 1.3, delay: i * 1.1, ease: "easeIn" }}
          />
        ))}
      {children}
    </div>
  );
}

// Титул: подпись под именем, оттенок — по редкости
export function TitleBadge({ id, className }: { id: string; className?: string }) {
  const { t } = useI18n();
  const item = itemById(id);
  if (!item) return null;
  const tone = RARITY_TONE[item.rarity];
  return (
    <span className={cx("inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-semibold", tone.soft, tone.text, className)}>
      {item.rarity === "legendary" && <Sparkles size={13} aria-hidden />}
      {t.rewards.items[id as keyof typeof t.rewards.items]}
    </span>
  );
}

// Предмет любого вида — квадратная плитка с рисунком
export function ItemArt({ id, size = 56, className }: { id: string; size?: number; className?: string }) {
  const item = itemById(id);
  if (!item) return null;
  const box = "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl";
  switch (item.kind) {
    case "satellite":
      return (
        <span className={cx(box, "bg-brand-night", className)} style={{ width: size, height: size }}>
          <SatelliteArt id={id} size={size * 0.78} />
        </span>
      );
    case "ring":
      return (
        <span className={cx(box, "bg-inset", className)} style={{ width: size, height: size }}>
          <RingArt id={id} size={size * 0.78} stroke={Math.max(3, size / 11)} />
        </span>
      );
    case "background":
      return (
        <span className={cx(box, className)} style={{ width: size, height: size }}>
          <BackgroundArt id={id} />
        </span>
      );
    case "title":
      return (
        <span className={cx(box, RARITY_TONE[item.rarity].soft, RARITY_TONE[item.rarity].text, className)} style={{ width: size, height: size }}>
          <Quote size={size * 0.4} className="fill-current" />
        </span>
      );
  }
}
