import { Card } from '../types';
import { Edit3, Trash2, Quote, BookOpen } from 'lucide-react';

interface CardListItemProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardListItem({ card, onEdit, onDelete }: CardListItemProps) {
  return (
    <div className="group relative bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-5 md:p-6 border border-white/20 dark:border-gray-700/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
      
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Заголовок и Часть речи */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {card.word}
            </h3>
            {card.partOfSpeech && (
              <span className="px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full border border-purple-200/50 dark:border-purple-700/50">
                {card.partOfSpeech}
              </span>
            )}
          </div>

          {/* Перевод */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
              {card.translation}
            </p>
          </div>
        </div>

        {/* Кнопки управления (появляются при наведении или всегда видны на мобилках) */}
        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={onEdit}
            className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all active:scale-90"
            title="Редактировать"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-90"
            title="Удалить"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      {/* Дополнительная информация */}
      <div className="grid gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
        {card.explanation && (
          <div className="flex gap-3 text-sm">
            <BookOpen size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {card.explanation}
            </p>
          </div>
        )}

        {card.example && (
          <div className="flex gap-3 text-sm bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/30">
            <Quote size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
            <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
              {card.example}
            </p>
          </div>
        )}
      </div>

      {/* Индикатор прогресса (маленькая точка SRS) */}
      <div className="absolute bottom-2 right-7 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-1.5 h-1.5 rounded-full ${
              i < (card.srsData?.interval || 0) 
                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}