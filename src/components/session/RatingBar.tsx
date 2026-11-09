import { KnowledgeLevel } from "../../types";
import { Button, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

const LEVELS = [
  { level: KnowledgeLevel.DONT_KNOW, key: "dontKnow", tone: "bg-danger-soft text-danger hover:bg-danger/15" },
  { level: KnowledgeLevel.FORGOT, key: "forgot", tone: "bg-warning-soft text-warning hover:bg-warning/15" },
  { level: KnowledgeLevel.REMEMBER, key: "remember", tone: "bg-info-soft text-info hover:bg-info/15" },
  { level: KnowledgeLevel.KNOW, key: "know", tone: "bg-success-soft text-success hover:bg-success/15" },
] as const;

// Низ флэшкарт и повторения: до переворота — «Показать ответ», после — четыре оценки с номерами клавиш.
// coach — первая тренировка новичка: вместо коротких подсказок объясняем, как вспоминать и что значат оценки
export default function RatingBar({
  isFlipped,
  onFlip,
  onRate,
  coach = false,
}: {
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (level: KnowledgeLevel) => void;
  coach?: boolean;
}) {
  const { t } = useI18n();
  const f = t.words.flashcards;

  return (
    <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-8">
      <div className="mx-auto grid max-w-3xl gap-3">
        {(isFlipped || coach) && (
          <p className={cx("mx-auto max-w-xl text-center text-sm", coach ? "text-fg" : "text-muted")}>
            {!coach ? t.words.session.rate : isFlipped ? f.coach.rate : f.coach.recall}
          </p>
        )}
        {isFlipped ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {LEVELS.map(({ level, key, tone }, i) => (
              <button
                key={level}
                type="button"
                onClick={() => onRate(level)}
                className={cx(
                  "flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  tone,
                )}
              >
                <span className="hidden h-5 w-5 place-items-center rounded-md bg-surface/60 text-2xs sm:grid">{i + 1}</span>
                {f.levels[key]}
              </button>
            ))}
          </div>
        ) : (
          <Button size="lg" variant="inverse" fullWidth onClick={onFlip} className="mx-auto max-w-sm">
            {t.words.session.showAnswer}
          </Button>
        )}
        <p className="hidden text-center text-xs text-faint md:block">{f.keyboardHint}</p>
      </div>
    </div>
  );
}
