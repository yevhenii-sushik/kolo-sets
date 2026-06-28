import { QuizStats } from "../../types";
import { getTaskTypeName } from "../../utils/quizGenerator";
import { useI18n } from "../../contexts/I18nContext";

interface QuizStatsModalProps {
  isOpen: boolean;
  stats: QuizStats;
  onClose: () => void;
  onRestart: () => void;
}

export default function QuizStatsModal({
  isOpen,
  stats,
  onClose,
  onRestart,
}: QuizStatsModalProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  const qs = t.words.quiz.stats;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins} ${qs.min} ${secs} ${qs.sec}` : `${secs} ${qs.sec}`;
  };

  const getPercentage = (): number => {
    return stats.totalQuestions > 0
      ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
      : 0;
  };

  const percentage = getPercentage();
  let resultEmoji = "🎉";
  let resultText = qs.great;
  let resultColor = "text-[#22C55E]";

  if (percentage < 50) {
    resultEmoji = "😔";
    resultText = qs.poor;
    resultColor = "text-red-600";
  } else if (percentage < 75) {
    resultEmoji = "🙂";
    resultText = qs.ok;
    resultColor = "text-[#FF5733]";
  } else if (percentage < 100) {
    resultEmoji = "😊";
    resultText = qs.good;
    resultColor = "text-blue-600";
  }

  return (
    <div className="fixed inset-0 z-150 flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="absolute inset-0 bg-[#1A1714]/40 dark:bg-black/50 backdrop-blur-xl"
        aria-hidden
      />

      <div className="relative w-block max-w-4xl w-full max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 my-0 sm:my-4 shadow-xl">
        <div className="text-center mb-4 sm:mb-6">
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{resultEmoji}</div>
          <h2 className={`u-title text-xl sm:text-2xl md:text-3xl font-bold mb-1 ${resultColor}`}>
            {resultText}
          </h2>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#7A756E]">
            {qs.summaryAnswered} {stats.totalQuestions} {qs.summaryIn}{" "}
            {formatDuration(stats.duration)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="g-block rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-[#E0DBD3] dark:border-[#2E2C29]">
            <div className="u-title text-xl sm:text-2xl md:text-3xl font-bold text-[#3B82F6] mb-1">
              {stats.totalQuestions}
            </div>
            <div className="sub-title text-[9px] sm:text-[10px]">{qs.total}</div>
          </div>
          <div className="g-block rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-[#E0DBD3] dark:border-[#2E2C29]">
            <div className="u-title text-xl sm:text-2xl md:text-3xl font-bold text-[#22C55E] mb-1">
              {stats.correctAnswers}
            </div>
            <div className="sub-title text-[9px] sm:text-[10px]">{qs.correct}</div>
          </div>
          <div className="g-block rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center border border-[#E0DBD3] dark:border-[#2E2C29]">
            <div className="u-title text-xl sm:text-2xl md:text-3xl font-bold text-red-600 mb-1">
              {stats.wrongAnswers}
            </div>
            <div className="sub-title text-[9px] sm:text-[10px]">{qs.wrong}</div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex justify-between sub-title mb-2">
            <span>{qs.accuracy}</span>
            <span className="uc-title">{percentage}%</span>
          </div>
          <div className="w-full bg-[#EDEAE4] dark:bg-[#242220] rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                percentage >= 75
                  ? "bg-[#22C55E]"
                  : percentage >= 50
                    ? "bg-[#FF5733]"
                    : "bg-red-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {stats.mistakes.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <h3 className="uc-title mb-2 sm:mb-3">
              {qs.mistakes} ({stats.mistakes.length}):
            </h3>
            <div className="space-y-2 max-h-40 sm:max-h-52 overflow-y-auto min-h-[35dvh] sm:min-h-[30vh]">
              {stats.mistakes.map((mistake, index) => (
                <div
                  key={index}
                  className="bg-red-500/10 dark:bg-red-500/20 rounded-2xl p-4 border border-red-500/30"
                >
                  <div className="sub-title mb-1">
                    {getTaskTypeName(mistake.taskType)}
                  </div>
                  <div className="font-medium text-[#1A1714] dark:text-[#F0EDE8] mb-2">
                    {mistake.question}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[13px]">
                    <div>
                      <span className="text-red-600">{qs.yourAnswer}</span>{" "}
                      <span className="font-medium">
                        {mistake.userAnswer || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#22C55E]">{qs.correctAnswer}</span>{" "}
                      <span className="font-medium">{mistake.correctAnswer}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onRestart}
            className="flex-1 px-4 py-3 sm:py-4 bg-[#FF5733] hover:bg-[#E54D2A] text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-colors"
          >
            🔄 {qs.restart}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 sm:py-4 bg-[#EDEAE4] dark:bg-[#242220] hover:bg-[#E0DBD3] dark:hover:bg-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-colors border border-[#E0DBD3] dark:border-[#2E2C29]"
          >
            {qs.toCollections}
          </button>
        </div>
      </div>
    </div>
  );
}
