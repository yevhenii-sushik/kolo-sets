import { Target } from "lucide-react";
import { QuizStats } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import SessionResult from "../session/SessionResult";

interface QuizStatsModalProps {
  isOpen: boolean;
  stats: QuizStats;
  onClose: () => void;
  onRestart: () => void;
}

// Итог теста: оценка по доле верных, цифры и разбор ошибок
export default function QuizStatsModal({ isOpen, stats, onClose, onRestart }: QuizStatsModalProps) {
  const { t } = useI18n();
  const qs = t.words.quiz.stats;
  const types = t.words.quiz.settings.types;

  const minutes = Math.floor(stats.duration / 60);
  const seconds = stats.duration % 60;
  const duration = minutes > 0 ? `${minutes} ${qs.min} ${seconds} ${qs.sec}` : `${seconds} ${qs.sec}`;
  const pct = stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;

  const verdict =
    pct === 100
      ? { text: qs.great, tone: "success" as const }
      : pct >= 75
        ? { text: qs.good, tone: "info" as const }
        : pct >= 50
          ? { text: qs.ok, tone: "accent" as const }
          : { text: qs.poor, tone: "danger" as const };

  return (
    <SessionResult
      open={isOpen}
      icon={<Target size={26} />}
      tone={verdict.tone}
      title={verdict.text}
      subtitle={`${qs.accuracy}: ${pct}% · ${duration}`}
      metrics={[
        { label: qs.total, value: stats.totalQuestions },
        { label: qs.correct, value: stats.correctAnswers, tone: "success" },
        { label: qs.wrong, value: stats.wrongAnswers, tone: stats.wrongAnswers > 0 ? "danger" : "default" },
      ]}
      againLabel={qs.restart}
      exitLabel={qs.toCollections}
      onAgain={onRestart}
      onExit={onClose}
      size={stats.mistakes.length > 0 ? "lg" : "sm"}
    >
      {stats.mistakes.length > 0 && (
        <div className="grid gap-2">
          <p className="text-sm font-semibold text-fg">
            {qs.mistakes} · {stats.mistakes.length}
          </p>
          <div className="grid max-h-64 gap-2 overflow-y-auto">
            {stats.mistakes.map((m, i) => (
              <div key={i} className="rounded-2xl bg-inset p-3.5">
                <p className="text-xs text-muted">{types[m.taskType as keyof typeof types] ?? m.taskType}</p>
                <p className="mt-0.5 font-medium text-fg">{m.question}</p>
                <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                  <p>
                    <span className="text-muted">{qs.yourAnswer}</span> <span className="font-medium text-danger">{m.userAnswer || "—"}</span>
                  </p>
                  <p>
                    <span className="text-muted">{qs.correctAnswer}</span> <span className="font-medium text-success">{m.correctAnswer}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </SessionResult>
  );
}
