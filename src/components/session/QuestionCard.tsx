import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Volume2, Zap } from "lucide-react";
import { Strength } from "../../utils/srs";
import { StrengthChip } from "../cards/Flashcard";
import { cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { cheerIndex } from "../../motivation/nudge";

// Карточка вопроса — общая для теста и Блица, чтобы режимы выглядели одной семьёй (docs/specs/perigee.md,
// «Тест: честный ответ и карточка вопроса»). Тёплые тона лица флэшкарты: сверху сила слова и значок серии,
// дальше что сделать и само слово. На телефоне карточка занимает свободное место, ответы — под большим пальцем
export default function QuestionCard({
  label,
  strength,
  badge,
  note,
  children,
  className,
}: {
  label?: ReactNode; // что сделать: «Выбери перевод»
  strength?: Strength;
  badge?: ReactNode; // справа сверху: серия
  note?: ReactNode; // внизу мелко: набор слова, когда в сессии слова из нескольких наборов
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "relative flex min-h-44 flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-4xl border border-accent/15 bg-accent-soft px-6 pt-14 text-center text-fg sm:min-h-64 sm:flex-none",
        note ? "pb-11" : "pb-8",
        className,
      )}
    >
      {/* Кольцо «Орбиты», как на лице флэшкарты, но без спутника: на короткой карточке он налезал на слово */}
      <svg viewBox="0 0 200 200" aria-hidden className="pointer-events-none absolute -bottom-28 -right-28 h-64 w-64 text-accent/20">
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
        {strength !== undefined ? <StrengthChip strength={strength} /> : <span />}
        {badge}
      </div>
      {label && <p className="relative text-base font-semibold text-accent-ink">{label}</p>}
      {children}
      {note && <p className="absolute inset-x-6 bottom-4 truncate text-xs text-muted">{note}</p>}
    </div>
  );
}

/** Значок серии на карточке: каждое новое верное — короткий «щелчок». На круглых числах (5, 10, 15…)
 *  значок вспыхивает оранжевым, а под ним на пару секунд появляется возглас: «Огонь!», «Не остановить!».
 *  Серия есть только у проверенных ответов (тест, Блиц, Perigee), самооценку ею не награждаем */
export function StreakChip({ value, children }: { value: number; children: ReactNode }) {
  const { t } = useI18n();
  const cheers = t.words.session.cheer;
  const i = cheerIndex(value, cheers.length);
  const cheer = i >= 0 ? cheers[i] : null;
  return (
    <span className="relative inline-flex">
      <motion.span
        key={value}
        initial={{ scale: cheer ? 1.5 : 1.25 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: cheer ? 380 : 500, damping: cheer ? 11 : 18 }}
        className={cx(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
          cheer ? "bg-accent text-on-accent" : "bg-surface/70 text-accent-ink",
        )}
      >
        <Zap size={12} />
        {children}
      </motion.span>
      {cheer && (
        <motion.span
          key={`cheer-${value}`}
          role="status"
          initial={{ opacity: 0, y: -4, scale: 0.8 }}
          animate={{ opacity: [0, 1, 1, 0], y: [-4, 0, 0, 2], scale: [0.8, 1.05, 1, 1] }}
          transition={{ duration: 2.2, times: [0, 0.15, 0.8, 1], ease: "easeOut" }}
          className="pointer-events-none absolute right-0 top-full mt-1.5 whitespace-nowrap rounded-full bg-fg px-2.5 py-0.5 text-xs font-bold text-on-inverse shadow-md"
        >
          {cheer}
        </motion.span>
      )}
    </span>
  );
}

/** Слово на карточке вопроса; описание — мельче */
export function QuestionPrompt({ children, described = false }: { children: ReactNode; described?: boolean }) {
  return (
    <h2
      dir="auto"
      className={cx(
        "relative wrap-break-word",
        described ? "text-xl font-semibold leading-snug sm:text-2xl" : "font-display text-3xl font-extrabold leading-tight sm:text-4xl",
      )}
    >
      {children}
    </h2>
  );
}

/** Вопрос на слух: слово звучит само, повторить — кнопкой */
export function ListenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="relative grid justify-items-center gap-2">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="grid h-20 w-20 place-items-center rounded-full bg-surface text-accent-ink shadow-sm transition-colors hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Volume2 size={36} />
      </button>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

/** Часть речи под словом */
export function QuestionTag({ children }: { children: ReactNode }) {
  return <span className="relative rounded-full bg-surface/70 px-3 py-1 text-sm font-medium text-muted">{children}</span>;
}
