import { ArrowRight, Check, Lightbulb, Sprout, Trophy } from "lucide-react";
import { Card, FlashcardStats } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { Button, cx } from "../ui";
import { roundTier } from "../utils/flashRounds";
import SessionResult from "./session/SessionResult";

interface FlashcardStatsModalProps {
  isOpen: boolean;
  stats: FlashcardStats;
  hard: Card[]; // «Не знаю» и «Забылось» — их можно прогнать ещё раз
  onClose: () => void;
  onAgain: () => void; // следующий круг, весь набор заново или с начала набора
  onPractise: () => void; // прогнать трудные ещё раз
  coach?: boolean; // первая тренировка новичка — объяснить, что будет со словами дальше
  // Большой набор идёт кругами (src/utils/flashRounds.ts): сколько пройдено и сколько в следующем круге
  rounds?: { done: number; total: number; next: number; first: boolean };
  onFromStart?: () => void;
}

const TIERS = {
  clean: { icon: <Trophy size={26} />, tone: "success" },
  good: { icon: <Check size={26} />, tone: "accent" },
  start: { icon: <Sprout size={26} />, tone: "accent" },
} as const;

// Итог круга флэшкарт. Честный: «Отлично!» не пишем, если слова пока не держатся. Трудные слова видно
// списком, и главная кнопка — прогнать их ещё раз, пока свежо (docs/specs/perigee.md, «Флэшкарты»)
export default function FlashcardStatsModal({ isOpen, stats, hard, onClose, onAgain, onPractise, coach = false, rounds, onFromStart }: FlashcardStatsModalProps) {
  const { t } = useI18n();
  const fs = t.words.flashcards.stats;
  const levels = t.words.flashcards.levels;

  const minutes = Math.floor(stats.duration / 60);
  const seconds = stats.duration % 60;
  const duration = minutes > 0 ? `${minutes}${fs.min} ${seconds}${fs.sec}` : `${seconds}${fs.sec}`;
  const pct = (value: number) => (stats.totalCards > 0 ? Math.round((value / stats.totalCards) * 100) : 0);

  const tier = roundTier(stats.totalCards, hard.length);
  // Кругами: «Ещё 20»; весь набор пройден — «С начала набора»; маленький набор — «Весь набор ещё раз»
  const setDone = !!rounds && rounds.next === 0;
  const againLabel = !rounds ? fs.restart : setDone ? fs.fromStart : fs.next.replace("{n}", String(rounds.next));
  const againIcon = rounds && !setDone ? <ArrowRight size={18} /> : undefined;
  const hasHard = hard.length > 0;

  const breakdown = [
    { label: levels.dontKnow, value: stats.dontKnow, bar: "bg-danger", text: "text-danger" },
    { label: levels.forgot, value: stats.forgot, bar: "bg-warning", text: "text-warning" },
    { label: levels.remember, value: stats.remember, bar: "bg-info", text: "text-info" },
    { label: levels.know, value: stats.know, bar: "bg-success", text: "text-success" },
  ];

  return (
    <SessionResult
      open={isOpen}
      icon={TIERS[tier].icon}
      tone={TIERS[tier].tone}
      title={fs.titles[tier]}
      subtitle={setDone && tier === "clean" ? fs.setDone : fs.notes[tier]}
      metrics={[
        { label: fs.cards, value: stats.totalCards },
        { label: fs.time, value: duration },
        ...(rounds ? [{ label: fs.inSet, value: `${rounds.done} / ${rounds.total}` }] : []),
      ]}
      // Есть трудные — главное действие закрепить их; дальше по набору можно и без этого (кнопка ниже)
      againLabel={hasHard ? `${fs.practise} · ${hard.length}` : againLabel}
      againIcon={hasHard ? undefined : againIcon}
      exitLabel={fs.exit}
      onAgain={hasHard ? onPractise : onAgain}
      onExit={onClose}
    >
      <div className="grid gap-3">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-track">
          {breakdown.map((b) => (
            <div key={b.label} className={cx("h-full transition-[width] duration-700", b.bar)} style={{ width: `${pct(b.value)}%` }} />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {breakdown.map((b) => (
            <li key={b.label} className="flex items-center gap-2">
              <span className={cx("h-2 w-2 shrink-0 rounded-full", b.bar)} />
              <span className="flex-1 text-muted">{b.label}</span>
              <span className={cx("font-semibold tabular-nums", b.text)}>{b.value}</span>
            </li>
          ))}
        </ul>

        {hasHard && (
          <div className="mt-1 grid gap-2 rounded-2xl bg-inset p-3 text-left">
            <p className="text-sm font-semibold text-fg">
              {fs.hard} · {hard.length}
            </p>
            <ul className="grid max-h-40 gap-1.5 overflow-y-auto text-sm">
              {hard.map((card) => (
                <li key={card.id} className="flex items-baseline justify-between gap-3">
                  <span dir="auto" className="min-w-0 truncate font-semibold text-fg">{card.word}</span>
                  <span dir="auto" className="min-w-0 truncate text-right text-muted">{card.translation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Дальше по набору, не закрепляя трудные; «С начала набора» — если круг был не первым */}
        {(hasHard || (rounds && !setDone && !rounds.first && onFromStart)) && (
          <div className="flex flex-wrap justify-center gap-2">
            {hasHard && (
              <Button variant="ghost" size="sm" iconRight={againIcon} onClick={onAgain}>
                {againLabel}
              </Button>
            )}
            {rounds && !setDone && !rounds.first && onFromStart && (
              <Button variant="ghost" size="sm" onClick={onFromStart}>
                {fs.fromStart}
              </Button>
            )}
          </div>
        )}

        {coach && (
          <div className="mt-1 flex gap-2.5 rounded-2xl bg-accent-soft p-3 text-left text-sm text-accent-ink">
            <Lightbulb size={16} className="mt-0.5 shrink-0" />
            <p className="leading-snug">{fs.coach}</p>
          </div>
        )}
      </div>
    </SessionResult>
  );
}
