import { ArrowRight, CheckCheck, Minus, Target, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, Button, cx } from "../../ui";
import SessionResult from "../session/SessionResult";
import { QuizQuestion, SetProgress } from "../../quiz/plan";
import { PERFECT_QUIZ_MIN } from "../../../server/core/xp";

export interface QuizMistake {
  question: QuizQuestion;
  answer: string;
}

// Что сдвинулось в памяти за тест: новые слова пошли в работу, знакомые окрепли, ошибки вернутся завтра
export interface QuizGrowth {
  introduced: number;
  grew: number;
  tomorrow: number;
}

// Счёт в контексте: прошлый тест по набору, рекорд, путь по набору (docs/specs/perigee.md, «Тест, шаг 2»)
export interface QuizContext {
  previous?: number; // точность прошлого теста, %
  record: boolean; // побит рекорд набора
  bestStreak: number;
  set: SetProgress;
  passed: boolean; // набор сдан: каждое слово в последней проверке отвечено верно
}

interface QuizStatsModalProps {
  isOpen: boolean;
  practice: boolean; // итог работы над ошибками
  total: number; // вопросов (в работе над ошибками — слов)
  correct: number; // верных первых ответов
  duration: number; // секунд
  mistakes: QuizMistake[];
  growth?: QuizGrowth | null;
  context?: QuizContext | null;
  nextCount: number; // сколько слов во «Следующих N»; 0 — набор пройден
  onPractise: () => void;
  onNext: () => void;
  onClose: () => void;
}

// Итог теста (docs/specs/perigee.md, «Тест: понятность и честность», «Тест, шаг 2»). Есть ошибки — главное
// действие «Работа над ошибками»; нет — следующие слова набора. Повторять те же слова сразу не предлагаем:
// по свежей памяти тест проходится идеально, но ничего не проверяет
export default function QuizStatsModal({ isOpen, practice, total, correct, duration, mistakes, growth, context, nextCount, onPractise, onNext, onClose }: QuizStatsModalProps) {
  const { t } = useI18n();
  const qs = t.words.quiz.stats;
  const prompts = t.words.quiz.prompts;

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const time = minutes > 0 ? `${minutes} ${qs.min} ${seconds} ${qs.sec}` : `${seconds} ${qs.sec}`;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const nextLabel = qs.next.replace("{n}", String(nextCount));
  const hasMistakes = !practice && mistakes.length > 0;

  if (practice) {
    return (
      <SessionResult
        open={isOpen}
        icon={<CheckCheck size={26} />}
        tone="success"
        title={qs.practiceDone}
        subtitle={qs.practiceNote}
        metrics={[
          { label: qs.words, value: total },
          { label: qs.firstTry, value: correct, tone: "success" },
        ]}
        againLabel={nextCount > 0 ? nextLabel : undefined}
        againIcon={<ArrowRight size={18} />}
        exitLabel={qs.done}
        onAgain={nextCount > 0 ? onNext : undefined}
        onExit={onClose}
      />
    );
  }

  const verdict = context?.passed
    ? { text: qs.setPassed, tone: "success" as const }
    : pct === 100
      ? { text: qs.great, tone: "success" as const }
      : pct >= 75
        ? { text: qs.good, tone: "info" as const }
        : pct >= 50
          ? { text: qs.ok, tone: "accent" as const }
          : { text: qs.poor, tone: "danger" as const };

  const action = hasMistakes
    ? { label: `${qs.practise} · ${mistakes.length}`, icon: undefined, run: onPractise }
    : nextCount > 0
      ? { label: nextLabel, icon: <ArrowRight size={18} />, run: onNext }
      : null;
  const badges = growth
    ? [
        { n: growth.introduced, text: qs.introduced, tone: "accent" as const },
        { n: growth.grew, text: qs.grew, tone: "success" as const },
        { n: growth.tomorrow, text: qs.tomorrow, tone: "warning" as const },
      ].filter((b) => b.n > 0)
    : [];

  const previous = context?.previous;
  const trend = previous === undefined ? 0 : Math.sign(pct - previous);
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const set = context?.set;
  const share = (n: number) => (set && set.total > 0 ? `${(n / set.total) * 100}%` : "0%");

  return (
    <SessionResult
      open={isOpen}
      icon={context?.passed ? <Trophy size={26} /> : <Target size={26} />}
      tone={verdict.tone}
      title={verdict.text}
      subtitle={`${qs.accuracy}: ${pct}% · ${time}`}
      metrics={[
        { label: qs.correct, value: correct, tone: "success" },
        { label: qs.wrong, value: total - correct, tone: total - correct > 0 ? "danger" : "default" },
        { label: qs.bestStreak, value: context?.bestStreak ?? 0, tone: (context?.bestStreak ?? 0) >= 3 ? "accent" : "default" },
      ]}
      againLabel={action?.label}
      againIcon={action?.icon}
      exitLabel={qs.done}
      onAgain={action?.run}
      onExit={onClose}
      size={hasMistakes ? "lg" : "sm"}
    >
      <div className="grid gap-3">
        {context?.passed && <p className="text-center text-sm text-muted">{qs.setPassedNote}</p>}

        {/* С чем сравнить счёт: прошлый тест по этому набору и рекорд */}
        {(previous !== undefined || context?.record) && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {context?.record && (
              <Badge tone="special">
                <Trophy size={12} />
                {qs.record}
              </Badge>
            )}
            {previous !== undefined && (
              <span className={cx("flex items-center gap-1.5", trend > 0 ? "text-success" : "text-muted")}>
                <TrendIcon size={16} className="shrink-0" />
                {qs.previous.replace("{pct}", String(previous))}
              </span>
            )}
          </div>
        )}

        {/* Прогресс памяти, а не только счёт. Нули не показываем: верный ответ раньше срока честно не растит интервал */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {badges.map((b) => (
              <Badge key={b.text} tone={b.tone}>
                {b.text.replace("{n}", String(b.n))}
              </Badge>
            ))}
          </div>
        )}

        {/* Путь по набору: верно в последней проверке / ошибка / ещё не проверено тестом. Цель — сдать набор */}
        {set && set.total > 0 && !context?.passed && (
          <div className="grid gap-1.5 text-left">
            <div className="flex items-baseline justify-between gap-3 text-xs text-muted">
              <span>{qs.inSet}</span>
              <span className="font-semibold tabular-nums text-fg">{qs.setCount.replace("{n}", String(set.right)).replace("{total}", String(set.total))}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-track">
              <div className="h-full bg-success transition-[width] duration-700" style={{ width: share(set.right) }} />
              <div className="h-full bg-danger transition-[width] duration-700" style={{ width: share(set.wrong) }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                {qs.legendRight} {set.right}
              </span>
              {set.wrong > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  {qs.legendWrong} {set.wrong}
                </span>
              )}
              {set.total - set.right - set.wrong > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-track" />
                  {qs.legendNone} {set.total - set.right - set.wrong}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Без ошибок, но коротко: бонус за идеальный тест — от 10 вопросов, скажем честно */}
        {pct === 100 && total < PERFECT_QUIZ_MIN && (
          <p className="text-center text-xs text-faint">{qs.perfectFrom.replace("{n}", String(PERFECT_QUIZ_MIN))}</p>
        )}

        {hasMistakes && (
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-fg">
              {qs.mistakes} · {mistakes.length}
            </p>
            <div className="grid max-h-64 gap-2 overflow-y-auto">
              {mistakes.map((m) => (
                <div key={m.question.card.id} className="rounded-2xl bg-inset p-3.5 text-left">
                  <p className="text-xs text-muted">{prompts[m.question.type as keyof typeof prompts]}</p>
                  <p dir="auto" className="mt-0.5 font-medium text-fg">
                    {m.question.prompt}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-muted">{qs.yourAnswer}</span>{" "}
                      <span dir="auto" className="font-medium text-danger">
                        {m.answer || "—"}
                      </span>
                    </p>
                    <p>
                      <span className="text-muted">{qs.correctAnswer}</span>{" "}
                      <span dir="auto" className="font-medium text-success">
                        {m.question.correctAnswer}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Есть ошибки — главная кнопка их; дальше по набору можно и без этого */}
        {hasMistakes && nextCount > 0 && (
          <Button variant="ghost" size="sm" iconRight={<ArrowRight size={18} />} onClick={onNext} className="justify-self-center">
            {nextLabel}
          </Button>
        )}
      </div>
    </SessionResult>
  );
}
