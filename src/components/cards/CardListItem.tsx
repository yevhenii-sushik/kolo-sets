import { useState } from "react";
import { Card } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { PARTS_OF_SPEECH } from "../../data/partsOfSpeech";
import { Edit3, Trash2, Quote, BookOpen, Zap, Check, X } from "lucide-react";

interface CardListItemProps {
  card: Card;
  onSave: (cardData: Omit<Card, "id" | "srsData" | "createdAt">) => void;
  onDelete: () => void;
}

export default function CardListItem({
  card,
  onSave,
  onDelete,
}: CardListItemProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const [word, setWord] = useState(card.word);
  const [translation, setTranslation] = useState(card.translation);
  const [explanation, setExplanation] = useState(card.explanation);
  const [example, setExample] = useState(card.example);
  const [partOfSpeech, setPartOfSpeech] = useState(card.partOfSpeech);

  const startEditing = () => {
    setWord(card.word);
    setTranslation(card.translation);
    setExplanation(card.explanation);
    setExample(card.example);
    setPartOfSpeech(card.partOfSpeech);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!word.trim() || !translation.trim()) return;
    onSave({
      word: word.trim(),
      translation: translation.trim(),
      explanation: explanation.trim(),
      example: example.trim(),
      partOfSpeech: partOfSpeech.trim(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => setIsEditing(false);

  const fields = t.words.editCollection.fields;

  if (isEditing) {
    return (
      <div
        onKeyDown={(e) => e.key === "Escape" && handleCancel()}
        className="bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-6 md:p-8 border-2 border-[#FF5733] shadow-lg shadow-orange-500/10"
      >
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
              {fields.word} *
            </label>
            <input
              autoFocus
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-black text-lg italic font-serif"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
              {fields.translation} *
            </label>
            <input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
            {fields.partOfSpeech}
          </label>
          <select
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium appearance-none"
          >
            <option value="">{fields.partOfSpeechNone}</option>
            {PARTS_OF_SPEECH.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 mb-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
            {fields.explanation}
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium resize-none leading-relaxed"
          />
        </div>

        <div className="space-y-1.5 mb-5">
          <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
            {fields.example}
          </label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium italic resize-none leading-relaxed"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] dark:text-[#8A867F] font-black text-[11px] uppercase tracking-widest hover:border-[#FF5733]/40 transition-all"
          >
            <X size={14} /> {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!word.trim() || !translation.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FF5733] text-white font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            <Check size={14} /> {t.save}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={startEditing}
      className="group relative bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-6 md:p-8 border border-[#E0DBD3] dark:border-[#2E2C29] hover:border-[#FF5733] transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-[#FF5733]/5 cursor-pointer active:scale-[0.995]"
    >
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

        {/* КНОПКИ: всегда видны — на тач-экранах hover не работает */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
            className="p-2.5 text-[#B5B0A8] hover:text-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] rounded-xl transition-all active:scale-90"
          >
            <Edit3 size={17} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2.5 text-[#B5B0A8] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all active:scale-90"
          >
            <Trash2 size={17} />
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
          <div className="relative p-5 bg-[#F5F2ED]/50 dark:bg-[#242220]/50 rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] overflow-hidden">
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
