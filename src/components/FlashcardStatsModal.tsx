import { ArrowRight, Lightbulb, Trophy } from "lucide-react";
import { FlashcardStats } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { Button, cx } from "../ui";
import SessionResult from "./session/SessionResult";

interface FlashcardStatsModalProps {
  isOpen: boolean;
  stats: FlashcardStats;
  onClose: () => void;
  onRestart: () => void;
  coach?: boolean; // первая тренировка новичка — объяснить, что будет со словами дальше
  // Большой набор идёт кругами (src/utils/flashRounds.ts): сколько пройдено и сколько в следующем круге
  rounds?: { done: number; total: number; next: number };
  onFromStart?: () => void;
}

// Итог флэшкарт и повторения: сколько карточек, сколько времени и как распределились оценки
export default function FlashcardStatsModal({ isOpen, stats, onClose, onRestart, coach = false, rounds, onFromStart }: FlashcardStatsModalProps) {
  const { t } = useI18n();
  const fs = t.words.flashcards.stats;
  const levels = t.words.flashcards.levels;

  const minutes = Math.floor(stats.duration / 60);
  const seconds = stats.duration % 60;
  const duration = minutes > 0 ? `${minutes}${fs.min} ${seconds}${fs.sec}` : `${seconds}${fs.sec}`;
  const pct = (value: number) => (stats.totalCards > 0 ? Math.round((value / stats.totalCards) * 100) : 0);

  // Кругами: «Пройдено 40 из 300» и «Ещё 20»; весь набор пройден — «С начала набора»
  const setDone = !!rounds && rounds.next === 0;
  const subtitle = !rounds ? fs.subtitle : setDone ? fs.setDone : fs.progress.replace("{done}", String(rounds.done)).replace("{total}", String(rounds.total));
  const againLabel = !rounds ? fs.restart : setDone ? fs.fromStart : fs.next.replace("{n}", String(rounds.next));

  const breakdown = [
    { label: levels.dontKnow, value: stats.dontKnow, bar: "bg-danger", text: "text-danger" },
    { label: levels.forgot, value: stats.forgot, bar: "bg-warning", text: "text-warning" },
    { label: levels.remember, value: stats.remember, bar: "bg-info", text: "text-info" },
    { label: levels.know, value: stats.know, bar: "bg-success", text: "text-success" },
  ];

  return (
    <SessionResult
      open={isOpen}
      icon={<Trophy size={26} />}
      title={fs.title}
      subtitle={subtitle}
      metrics={[
        { label: fs.cards, value: stats.totalCards },
        { label: fs.time, value: duration },
      ]}
      againLabel={againLabel}
      againIcon={rounds && !setDone ? <ArrowRight size={18} /> : undefined}
      exitLabel={fs.exit}
      onAgain={onRestart}
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
        {/* Круг был не первым — можно вернуться к началу набора */}
        {rounds && !setDone && rounds.done > stats.totalCards && onFromStart && (
          <Button variant="ghost" size="sm" onClick={onFromStart} className="justify-self-center">
            {fs.fromStart}
          </Button>
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
