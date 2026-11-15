import { Minus, Sparkles, Target, TimerOff, TrendingDown, TrendingUp, Trophy, Volume2 } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, IconButton, cx } from "../../ui";
import SessionResult from "../session/SessionResult";
import { BlitzTier } from "../../blitz/plan";
import { Card } from "../../types";
import { speakWord } from "../../utils/tts";
import { GAME_MIN_ANSWERS } from "../../../server/core/xp";

export interface BlitzOutcome {
  tier: BlitzTier;
  score: number;
  answers: number;
  correct: number;
  bestStreak: number;
  previous?: number; // очки прошлого засчитанного раунда
  best?: number; // рекорд набора до этого раунда
  mistakes: Card[]; // слова с ошибкой, по разу
}

// Итог Блица (docs/specs/perigee.md, «Блиц: понятность и честность», «Блиц, шаг 2»): честная ступень вместо
// кубка за любой счёт, очки в контексте (прошлый раз, рекорд набора) и слова, на которых ошибся, — с озвучкой
export default function BlitzResultModal({
  open,
  outcome,
  voice,
  speakable,
  onAgain,
  onExit,
}: {
  open: boolean;
  outcome: BlitzOutcome | null;
  voice?: string;
  speakable: boolean;
  onAgain: () => void;
  onExit: () => void;
}) {
  const { t } = useI18n();
  const r = t.words.blitz.result;
  const ss = t.words.session;
  if (!outcome) return null;

  const { tier, score, answers, correct, previous, best, mistakes } = outcome;
  const pct = answers > 0 ? Math.round((correct / answers) * 100) : 0;
  const look = {
    record: { icon: <Trophy size={26} />, tone: "success" as const, title: r.record },
    great: { icon: <Sparkles size={26} />, tone: "success" as const, title: r.great },
    good: { icon: <Target size={26} />, tone: "info" as const, title: r.good },
    slow: { icon: <Target size={26} />, tone: "accent" as const, title: r.slow },
    uncounted: { icon: <TimerOff size={26} />, tone: "accent" as const, title: r.uncounted },
  }[tier];
  const subtitle =
    tier === "uncounted"
      ? r.uncountedNote.replace("{n}", String(GAME_MIN_ANSWERS)).replace("{k}", String(answers))
      : tier === "slow"
        ? r.slowNote
        : r.accuracy.replace("{pct}", String(pct));
  const trend = previous === undefined ? 0 : Math.sign(score - previous);
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const counted = tier !== "uncounted";

  return (
    <SessionResult
      open={open}
      icon={look.icon}
      tone={look.tone}
      title={look.title}
      subtitle={subtitle}
      metrics={[
        { label: ss.score, value: score, tone: "accent" },
        { label: ss.correct, value: `${correct}/${answers}`, tone: correct > 0 ? "success" : "default" },
        { label: ss.bestStreak, value: outcome.bestStreak, tone: outcome.bestStreak >= 3 ? "accent" : "default" },
      ]}
      againLabel={ss.again}
      exitLabel={ss.exit}
      onAgain={onAgain}
      onExit={onExit}
      size={mistakes.length > 0 ? "lg" : "sm"}
    >
      <div className="grid gap-3">
        {/* С чем сравнить: прошлый раунд и рекорд набора. Незасчитанный раунд не сравниваем */}
        {counted && (previous !== undefined || best !== undefined) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {tier === "record" && best !== undefined ? (
              <Badge tone="special">
                <Trophy size={12} />
                {r.previousRecord.replace("{n}", String(best))}
              </Badge>
            ) : (
              best !== undefined && <span className="text-muted">{r.best.replace("{n}", String(best))}</span>
            )}
            {previous !== undefined && (
              <span className={cx("flex items-center gap-1.5", trend > 0 ? "text-success" : "text-muted")}>
                <TrendIcon size={16} className="shrink-0" />
                {r.last.replace("{n}", String(previous))}
              </span>
            )}
          </div>
        )}

        {/* Ошибки — слово и перевод, с озвучкой: в спешке верный ответ мелькнул, здесь его можно запомнить */}
        {mistakes.length > 0 && (
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-fg">
              {r.mistakes} · {mistakes.length}
            </p>
            <div className="grid max-h-56 gap-2 overflow-y-auto">
              {mistakes.map((card) => (
                <div key={card.id} className="flex items-center gap-3 rounded-2xl bg-inset px-3.5 py-2.5 text-left">
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="truncate font-medium text-fg">
                      {card.word}
                    </p>
                    <p dir="auto" className="truncate text-sm text-accent-ink">
                      {card.translation}
                    </p>
                  </div>
                  {speakable && (
                    <IconButton variant="soft" size="sm" label={t.words.quiz.speak} onClick={() => speakWord(card.word, voice)} className="shrink-0">
                      <Volume2 size={16} />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SessionResult>
  );
}
