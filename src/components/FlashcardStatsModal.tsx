import { FlashcardStats } from '../types';
import { 
  Trophy, 
  Timer, 
  RotateCcw, 
  LayoutGrid, 
  Frown, 
  Meh, 
  Smile, 
  Star,
  ChevronRight
} from 'lucide-react';

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
  onRestart
}: FlashcardStatsModalProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}м ${secs}с` : `${secs}с`;
  };

  const getPercentage = (value: number): number => {
    return stats.totalCards > 0 ? Math.round((value / stats.totalCards) * 100) : 0;
  };

  const categories = [
    { label: 'Не знаю', value: stats.dontKnow, color: 'text-red-500', bg: 'bg-red-500/10', icon: <Frown size={20} /> },
    { label: 'Забыл', value: stats.forgot, color: 'text-orange-500', bg: 'bg-orange-500/10', icon: <Meh size={20} /> },
    { label: 'Помню', value: stats.remember, color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: <Smile size={20} /> },
    { label: 'Знаю', value: stats.know, color: 'text-green-500', bg: 'bg-green-500/10', icon: <Star size={20} /> },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Overlay с сильным размытием */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-500" />

      <div className="relative bg-white/90 dark:bg-gray-900/95 border border-white/20 dark:border-gray-800 rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in duration-300">
        
        {/* Декоративный фон за трофеем */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 blur-[80px] -z-10" />

        <div className="p-8 md:p-12">
          {/* Header с трофеем */}
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] shadow-xl shadow-orange-500/20 mb-6 animate-bounce">
              <Trophy size={40} className="text-white" />
            </div>
            <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2 italic">
              Gratulerer!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Сессия завершена. Вы отлично поработали!
            </p>
          </div>

          {/* Быстрая инфо-панель */}
          <div className="flex justify-center gap-8 mb-10">
            <div className="text-center">
              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                <LayoutGrid size={12} /> Карточек
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalCards}</div>
            </div>
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-800 self-end" />
            <div className="text-center">
              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                <Timer size={12} /> Время
              </div>
              <div className="text-2xl font-black text-gray-900 dark:text-white">{formatDuration(stats.duration)}</div>
            </div>
          </div>

          {/* Сетка результатов */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className={`${cat.bg} rounded-[2rem] p-5 border border-white/10 dark:border-gray-800 transition-transform hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cat.color}>{cat.icon}</div>
                  <div className={`text-xl font-black ${cat.color}`}>{cat.value}</div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60 dark:text-white">
                  {cat.label} ({getPercentage(cat.value)}%)
                </div>
              </div>
            ))}
          </div>

          {/* Умный прогресс-бар */}
          <div className="mb-12">
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${getPercentage(stats.dontKnow)}%` }} />
              <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${getPercentage(stats.forgot)}%` }} />
              <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${getPercentage(stats.remember)}%` }} />
              <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${getPercentage(stats.know)}%` }} />
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onRestart}
              className="flex-[2] flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black transition-all active:scale-[0.98] shadow-xl shadow-purple-500/25"
            >
              <RotateCcw size={20} />
              <span>ПОВТОРИТЬ</span>
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-black transition-all active:scale-[0.98]"
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