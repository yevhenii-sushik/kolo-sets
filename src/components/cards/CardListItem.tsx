import { Card } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { Edit3, Trash2, Quote, BookOpen, Zap } from "lucide-react";

interface CardListItemProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardListItem({
  card,
  onEdit,
  onDelete,
}: CardListItemProps) {
  const { t } = useI18n();
  return (
    <div className="group relative bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-6 md:p-8 border border-[#E0DBD3] dark:border-[#2E2C29] hover:border-[#FF5733] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-[#FF5733]/5">
      {/* ВЕРХНЯЯ ЧАСТЬ: Слово и Кнопки */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h3 className="text-2xl md:text-3xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tighter italic font-serif">
              {card.word}
            </h3>
            {card.partOfSpeech && (
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E] dark:text-[#8A867F] rounded-full border border-[#E0DBD3] dark:border-[#2E2C29]">
                {card.partOfSpeech}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF5733] shadow-[0_0_10px_#FF5733]" />
            <p className="text-lg font-bold text-[#7A756E] dark:text-[#8A867F] leading-tight">
              {card.translation}
            </p>
          </div>
        </div>

        {/* КНОПКИ: В стиле нашего интерфейса */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-3 text-[#7A756E] hover:text-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] rounded-2xl transition-all active:scale-90 border border-transparent hover:border-[#FF5733]/20"
          >
            <Edit3 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-3 text-[#7A756E] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all active:scale-90 border border-transparent hover:border-red-500/20"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* КОНТЕНТ: Описание и Пример */}
      <div className="space-y-4 pt-6 border-t border-[#F5F2ED] dark:border-[#2E2C29]">
        {card.explanation && (
          <div className="flex gap-4 items-start">
            <div className="mt-1 p-2 bg-[#F5F2ED] dark:bg-[#242220] rounded-xl text-[#B5B0A8]">
              <BookOpen size={14} />
            </div>
            <p className="text-sm font-medium text-[#7A756E] dark:text-[#8A867F] leading-relaxed">
              {card.explanation}
            </p>
          </div>
        )}

        {card.example && (
          <div className="relative p-5 bg-[#F5F2ED]/50 dark:bg-[#242220]/50 rounded-[2rem] border border-[#E0DBD3] dark:border-[#2E2C29] overflow-hidden">
            <Quote
              size={40}
              className="absolute -top-2 -right-2 text-[#FF5733]/5 pointer-events-none"
            />
            <div className="flex gap-4 items-start relative z-10">
              <Zap size={14} className="text-[#FF5733] mt-1 shrink-0" />
              <p className="text-sm font-bold text-[#1A1714] dark:text-[#F0EDE8] italic leading-relaxed">
                {card.example}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SRS ИНДИКАТОР */}
      <div className="mt-6 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8]">
          {t.words.collectionCard.masteryLevel}
        </span>
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => {
            const level = card.srsData?.interval || 0;
            const isActive = i < level;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  isActive
                    ? "w-6 bg-[#FF5733] shadow-[0_0_8px_#FF5733]"
                    : "w-1.5 bg-[#E0DBD3] dark:bg-[#2E2C29]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Per-word stats — shown only after first review */}
      {(card.srsData.totalReviews ?? 0) > 0 && (
        <div className="mt-3 pt-3 border-t border-[#F5F2ED] dark:border-[#2E2C29] flex items-center gap-4 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8]">
            {card.srsData.totalReviews} {card.srsData.totalReviews === 1 ? 'review' : 'reviews'}
          </span>
          {card.srsData.correctReviews != null && card.srsData.totalReviews != null && (
            <>
              <span className="w-1 h-1 rounded-full bg-[#D0CBC4] shrink-0" />
              {(() => {
                const acc = Math.round((card.srsData.correctReviews / card.srsData.totalReviews) * 100);
                return (
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    acc >= 70 ? 'text-[#22C55E]' : acc >= 40 ? 'text-amber-500' : 'text-red-400'
                  }`}>
                    {acc}% accuracy
                  </span>
                );
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
