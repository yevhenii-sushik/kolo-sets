import { Lightbulb, Trophy } from "lucide-react";
import { FlashcardStats } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { cx } from "../ui";
import SessionResult from "./session/SessionResult";

interface FlashcardStatsModalProps {
  isOpen: boolean;
  stats: FlashcardStats;
  onClose: () => void;
  onRestart: () => void;
  coach?: boolean; // первая тренировка новичка — объяснить, что будет со словами дальше
}

// Итог флэшкарт и повторения: сколько карточек, сколько времени и как распределились оценки
export default function FlashcardStatsModal({ isOpen, stats, onClose, onRestart, coach = false }: FlashcardStatsModalProps) {
  const { t } = useI18n();
  const fs = t.words.flashcards.stats;
  const levels = t.words.flashcards.levels;

  const minutes = Math.floor(stats.duration / 60);
  const seconds = stats.duration % 60;
  const duration = minutes > 0 ? `${minutes}${fs.min} ${seconds}${fs.sec}` : `${seconds}${fs.sec}`;
  const pct = (value: number) => (stats.totalCards > 0 ? Math.round((value / stats.totalCards) * 100) : 0);

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
      subtitle={fs.subtitle}
      metrics={[
        { label: fs.cards, value: stats.totalCards },
        { label: fs.time, value: duration },
      ]}
      againLabel={fs.restart}
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
