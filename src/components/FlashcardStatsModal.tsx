import { FlashcardStats } from "../types";
import {
  Trophy,
  Timer,
  RotateCcw,
  LayoutGrid,
  Frown,
  Meh,
  Smile,
  Star,
  ChevronRight,
} from "lucide-react";

interface FlashcardStatsModalProps {
  isOpen: boolean;
  stats: FlashcardStats;
  onClose: () => void;
  onRestart: () => void;
}

export default function FlashcardStatsModal({
  isOpen,
  stats,
  onClose,
  onRestart,
}: FlashcardStatsModalProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
  };

  const getPercentage = (value: number): number => {
    return stats.totalCards > 0
      ? Math.round((value / stats.totalCards) * 100)
      : 0;
  };

  const categories = [
    {
      label: "Не знаю",
      value: stats.dontKnow,
      color: "text-red-600",
      bg: "bg-red-500/10 dark:bg-red-500/20",
      icon: <Frown size={20} />,
    },
    {
      label: "Забыл",
      value: stats.forgot,
      color: "text-[#FF5733]",
      bg: "bg-[#FFF0ED] dark:bg-[#2A1A15]",
      icon: <Meh size={20} />,
    },
    {
      label: "Помню",
      value: stats.remember,
      color: "text-blue-600",
      bg: "bg-blue-500/10 dark:bg-blue-500/20",
      icon: <Smile size={20} />,
    },
    {
      label: "Знаю",
      value: stats.know,
      color: "text-[#22C55E]",
      bg: "bg-[#22C55E]/10 dark:bg-[#22C55E]/20",
      icon: <Star size={20} />,
    },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-3 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#1A1714]/40 dark:bg-black/50 backdrop-blur-xl animate-in fade-in duration-500"
        aria-hidden
      />

      <div className="relative w-block max-w-xl w-full max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 shadow-xl">
        <div className="p-5 sm:p-6 md:p-8">
          {/* Header с трофеем */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="inline-flex p-3 sm:p-4 bg-[#FF5733] rounded-2xl shadow-lg mb-3 sm:mb-4">
              <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-white" />
            </div>
            <h2 className="u-title text-2xl sm:text-3xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-1">
              Gratulerer!
            </h2>
            <p className="text-[12px] sm:text-[13px] font-medium text-[#7A756E]">
              Сессия завершена. Вы отлично поработали!
            </p>
          </div>

          {/* Быстрая инфо-панель */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-5 sm:mb-6">
            <div className="text-center">
              <div className="sub-title flex items-center justify-center gap-2 mb-1">
                <LayoutGrid size={12} /> Карточек
              </div>
              <div className="u-title text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                {stats.totalCards}
              </div>
            </div>
            <div className="w-px h-10 bg-[#E0DBD3] dark:bg-[#2E2C29] self-end" />
            <div className="text-center">
              <div className="sub-title flex items-center justify-center gap-2 mb-1">
                <Timer size={12} /> Время
              </div>
              <div className="u-title text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                {formatDuration(stats.duration)}
              </div>
            </div>
          </div>

          {/* Сетка результатов — g-block стиль */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className={`${cat.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#E0DBD3] dark:border-[#2E2C29] transition-transform hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cat.color}>{cat.icon}</div>
                  <div
                    className={`text-lg sm:text-xl font-black u-title ${cat.color}`}
                  >
                    {cat.value}
                  </div>
                </div>
                <div className="sub-title text-[10px] font-black">
                  {cat.label} ({getPercentage(cat.value)}%)
                </div>
              </div>
            ))}
          </div>

          {/* Прогресс-бар */}
          <div className="mb-5 sm:mb-6">
            <div className="w-full h-3 bg-[#EDEAE4] dark:bg-[#242220] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${getPercentage(stats.dontKnow)}%` }}
              />
              <div
                className="h-full bg-[#FF5733] transition-all duration-1000"
                style={{ width: `${getPercentage(stats.forgot)}%` }}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${getPercentage(stats.remember)}%` }}
              />
              <div
                className="h-full bg-[#22C55E] transition-all duration-1000"
                style={{ width: `${getPercentage(stats.know)}%` }}
              />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={onRestart}
              className="flex-[2] flex items-center justify-center gap-2 px-5 py-3 sm:py-4 bg-[#FF5733] hover:bg-[#E54D2A] text-white rounded-xl sm:rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
            >
              <RotateCcw size={18} />
              <span>ПОВТОРИТЬ</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 sm:py-4 bg-[#EDEAE4] dark:bg-[#242220] hover:bg-[#E0DBD3] dark:hover:bg-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-xl sm:rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] border border-[#E0DBD3] dark:border-[#2E2C29]"
            >
              <span>ВЫЙТИ</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
