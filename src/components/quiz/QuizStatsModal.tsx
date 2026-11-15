import { ArrowRight, CheckCheck, Target } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, Button } from "../../ui";
import SessionResult from "../session/SessionResult";
import { QuizQuestion } from "../../quiz/plan";
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

interface QuizStatsModalProps {
  isOpen: boolean;
  practice: boolean; // итог работы над ошибками
  total: number; // вопросов (в работе над ошибками — слов)
  correct: number; // верных первых ответов
  duration: number; // секунд
  mistakes: QuizMistake[];
  growth?: QuizGrowth | null;
  nextCount: number; // сколько слов во «Следующих N»; 0 — набор пройден
  onPractise: () => void;
  onNext: () => void;
  onClose: () => void;
}

// Итог теста (docs/specs/perigee.md, «Тест: понятность и честность»). Есть ошибки — главное действие
// «Работа над ошибками»; нет — следующие слова набора. Повторять те же слова сразу не предлагаем:
// по свежей памяти тест проходится идеально, но ничего не проверяет
export default function QuizStatsModal({ isOpen, practice, total, correct, duration, mistakes, growth, nextCount, onPractise, onNext, onClose }: QuizStatsModalProps) {
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

  const verdict =
    pct === 100
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
  const badges = growth ? [
    { n: growth.introduced, text: qs.introduced, tone: "accent" as const },
    { n: growth.grew, text: qs.grew, tone: "success" as const },
    { n: growth.tomorrow, text: qs.tomorrow, tone: "warning" as const },
  ].filter((b) => b.n > 0) : [];

  return (
    <SessionResult
      open={isOpen}
      icon={<Target size={26} />}
      tone={verdict.tone}
      title={verdict.text}
      subtitle={`${qs.accuracy}: ${pct}% · ${time}`}
      metrics={[
        { label: qs.total, value: total },
        { label: qs.correct, value: correct, tone: "success" },
        { label: qs.wrong, value: total - correct, tone: total - correct > 0 ? "danger" : "default" },
      ]}
      againLabel={action?.label}
      againIcon={action?.icon}
      exitLabel={qs.done}
      onAgain={action?.run}
      onExit={onClose}
      size={hasMistakes ? "lg" : "sm"}
    >
      <div className="grid gap-3">
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
