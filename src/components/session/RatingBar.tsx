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
// coach — первая тренировка новичка: вместо коротких подсказок объясняем, как вспоминать и что значат оценки.
// Обе раскладки лежат в одной ячейке сетки, неактивная — невидима, но занимает место: высота низа
// не меняется при перевороте, и карточка не подскакивает
export default function RatingBar({
  isFlipped,
  onFlip,
  onRate,
  coach = false,
  previews,
}: {
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (level: KnowledgeLevel) => void;
  coach?: boolean;
  previews?: Record<KnowledgeLevel, number>; // через сколько дней слово вернётся; 0 — ещё раз в этой тренировке
}) {
  const { t } = useI18n();
  const f = t.words.flashcards;
  // «ещё раз», «1 д», «3 мес», «2 г» — коротко, чтобы влезло под оценку
  const interval = (days: number) =>
    days <= 0
      ? f.interval.again
      : days < 30
        ? f.interval.days.replace("{n}", String(days))
        : days < 365
          ? f.interval.months.replace("{n}", String(Math.round(days / 30.4)))
          : f.interval.years.replace("{n}", String(Math.round(days / 365)));
  const hint = (flipped: boolean) => (coach ? (flipped ? f.coach.rate : f.coach.recall) : flipped ? t.words.session.rate : "");
  const layer = (active: boolean) => cx("col-start-1 row-start-1", !active && "invisible");

  return (
    <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-8">
      <div className="mx-auto grid max-w-3xl gap-3">
        <div className="mx-auto grid max-w-xl text-center text-sm">
          {[false, true].map((flipped) => (
            <p key={String(flipped)} className={cx(layer(flipped === isFlipped), coach ? "text-fg" : "text-muted")}>
              {hint(flipped) || "\u00a0"}
            </p>
          ))}
        </div>
        <div className="grid">
          <div className={cx(layer(isFlipped), "grid grid-cols-2 gap-2 sm:grid-cols-4")}>
            {LEVELS.map(({ level, key, tone }, i) => (
              <button
                key={level}
                type="button"
                tabIndex={isFlipped ? 0 : -1}
                onClick={() => onRate(level)}
                className={cx(
                  "flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  tone,
                )}
              >
                <span className="hidden h-5 w-5 place-items-center rounded-md bg-surface/60 text-2xs sm:grid">{i + 1}</span>
                <span className="grid leading-tight">
                  <span>{f.levels[key]}</span>
                  {previews && <span className="text-2xs font-medium opacity-75">{interval(previews[level])}</span>}
                </span>
              </button>
            ))}
          </div>
          <div className={cx(layer(!isFlipped), "flex items-center justify-center")}>
            <Button size="lg" variant="inverse" fullWidth tabIndex={isFlipped ? -1 : 0} onClick={onFlip} className="max-w-sm">
              {t.words.session.showAnswer}
            </Button>
          </div>
        </div>
        <p className="hidden text-center text-xs text-faint md:block">{f.keyboardHint}</p>
      </div>
    </div>
  );
}
