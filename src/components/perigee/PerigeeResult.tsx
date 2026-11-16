import { ArrowRight, Volume2, Zap } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { speakWord } from "../../utils/tts";
import { Badge, IconButton, PerigeeMark } from "../../ui";
import SessionResult from "../session/SessionResult";
import { SetPlanBar } from "../cards/SetPlanView";
import { SessionSummary } from "../../perigee/plan";
import { SetPlan } from "../../perigee/setPlan";

export interface PerigeeOutcome {
  summary: SessionSummary;
  tomorrow: number; // слов будет ждать завтра (по всему охвату сессии)
  next: "again" | "extra" | "sets";
  grew: number; // знакомые слова, которые окрепли (сила памяти выросла)
  back: number; // знакомые слова с ошибкой — вернутся завтра
  bestStreak: number;
  tough: { key: string; word: string; translation: string; voice?: string }[];
  plan?: SetPlan; // план набора после сессии — у сессии по одному набору
}

// Итог сессии Perigee (docs/specs/perigee.md, «Perigee, шаг 2»): честная ступень по проверенным ответам,
// что сдвинулось в памяти (как у флэшкарт и теста), трудные слова с озвучкой и где теперь набор
export default function PerigeeResult({
  outcome,
  againLabel,
  onAgain,
  onExit,
}: {
  outcome: PerigeeOutcome | null;
  againLabel: string;
  onAgain: () => void;
  onExit: () => void;
}) {
  const { t, language } = useI18n();
  const p = t.words.perigee;
  const qs = t.words.quiz.stats;
  const locale = getLanguageInfo(language).htmlLang;
  const s = outcome?.summary;
  // Точность — только по проверенным ответам: самооценка во флэшкарте сюда не входит
  const accuracy = s && s.checked > 0 ? Math.round((s.correctFirst / s.checked) * 100) : 0;
  const tier = !s || s.checked === 0 ? "done" : s.correctFirst === s.checked && s.tough.length === 0 ? "clean" : accuracy >= 80 ? "good" : "done";
  const title = tier === "clean" ? p.result.clean : tier === "good" ? p.result.good : p.result.title;
  const tone = tier === "clean" ? "success" : tier === "good" ? "info" : "accent";
  const badges = outcome
    ? [
        { n: s?.learned ?? 0, text: qs.introduced, tone: "accent" as const },
        { n: outcome.grew, text: qs.grew, tone: "success" as const },
        { n: outcome.back, text: qs.tomorrow, tone: "warning" as const },
      ].filter((b) => b.n > 0)
    : [];

  return (
    <SessionResult
      open={!!outcome}
      icon={<PerigeeMark size={26} tone="mono" />}
      tone={tone}
      title={title}
      subtitle={outcome && (outcome.tomorrow > 0 ? plural(locale, outcome.tomorrow, p.result.tomorrow) : p.result.tomorrowNone)}
      metrics={[
        { label: p.result.reviewed, value: s?.reviewed ?? 0 },
        { label: p.result.learned, value: s?.learned ?? 0, tone: "accent" },
        { label: p.result.accuracy, value: s && s.checked > 0 ? `${accuracy}%` : "—", tone: "success" },
      ]}
      againLabel={againLabel}
      againIcon={outcome?.next === "sets" ? <ArrowRight size={18} /> : undefined}
      exitLabel={t.words.session.exit}
      onAgain={onAgain}
      onExit={onExit}
      size={outcome && outcome.tough.length > 0 ? "lg" : "sm"}
    >
      {outcome && (
        <div className="grid gap-3">
          {/* Что сдвинулось в памяти. Нули не показываем */}
          {(badges.length > 0 || outcome.bestStreak >= 3) && (
            <div className="flex flex-wrap justify-center gap-2">
              {badges.map((b) => (
                <Badge key={b.text} tone={b.tone}>
                  {b.text.replace("{n}", String(b.n))}
                </Badge>
              ))}
              {outcome.bestStreak >= 3 && (
                <Badge tone="special">
                  <Zap size={12} />
                  {qs.bestStreak}: {outcome.bestStreak}
                </Badge>
              )}
            </div>
          )}

          {tier === "done" && s && s.checked > 0 && <p className="text-center text-sm text-muted">{p.result.doneNote}</p>}

          {/* Сессия по набору: где он теперь */}
          {outcome.plan && outcome.plan.total > 0 && (
            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
                <span>{t.words.setPlan.title}</span>
                <span className="tabular-nums">
                  {t.words.setPlan.strong} {outcome.plan.strong} · {t.words.setPlan.fresh} {outcome.plan.fresh}
                </span>
              </div>
              <SetPlanBar plan={outcome.plan} />
            </div>
          )}

          {/* Трудные слова — те, где была ошибка: увидеть ещё раз и услышать */}
          {outcome.tough.length > 0 && (
            <div className="grid gap-2">
              <p className="text-sm font-semibold text-fg">
                {p.result.tough} · {outcome.tough.length}
              </p>
              <div className="grid max-h-56 gap-2 overflow-y-auto">
                {outcome.tough.map((w) => (
                  <div key={w.key} className="flex items-center gap-3 rounded-2xl bg-inset px-3.5 py-2.5 text-left">
                    <div className="min-w-0 flex-1">
                      <p dir="auto" className="truncate font-medium text-fg">
                        {w.word}
                      </p>
                      <p dir="auto" className="truncate text-sm text-accent-ink">
                        {w.translation}
                      </p>
                    </div>
                    {w.voice && (
                      <IconButton variant="soft" size="sm" label={t.words.quiz.speak} onClick={() => speakWord(w.word, w.voice)} className="shrink-0">
                        <Volume2 size={16} />
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Честно о точности: слова, оценённые самим собой во флэшкарте, в неё не входят */}
          {s && s.selfRated > 0 && <p className="text-center text-xs text-faint">{p.result.selfNote}</p>}
        </div>
      )}
    </SessionResult>
  );
}
