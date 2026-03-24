import { useState, useEffect } from "react";
import { Card } from "../../types";
import { speak, isTTSSupported } from "../../utils/tts";
// import { useI18n } from "../contexts/I18nContext";
import { Volume2, Eye, EyeOff, BookOpen, Quote } from "lucide-react";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  language?: string;
  onFlip: () => void;
}

export default function Flashcard({
  card,
  isFlipped,
  language = "nb-NO",
  onFlip,
}: FlashcardProps) {
  // const { t } = useI18n();
  const [showTranslation, setShowTranslation] = useState(false);

  // Сбрасываем показ перевода, когда карточка переворачивается обратно или меняется
  useEffect(() => {
    if (!isFlipped) setShowTranslation(false);
  }, [isFlipped, card.id]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.word, language);
  };

  const toggleTranslation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranslation(!showTranslation);
  };

  const ttsSupported = isTTSSupported();

  return (
    <div
      className={`flip-card w-full min-h-[280px] h-[min(55vh,420px)] sm:h-[min(60vh,480px)] md:h-[min(65vh,520px)] ${isFlipped ? "flipped" : ""}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner relative w-full h-full cursor-pointer">
        {/* FRONT: Слово — b-block стиль */}
        <div className="flip-card-front absolute w-full h-full">
          <div className="b-block w-full h-full flex items-center justify-center p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-[-6%] bottom-[-8%] rotate-12 pointer-events-none opacity-[0.06]">
              <BookOpen size={180} strokeWidth={1} className="text-current" />
            </div>
            <div className="text-center space-y-6 relative z-10">
              <h2 className="u-title text-5xl md:text-7xl font-black tracking-tight break-words">
                {card.word}
              </h2>
              {card.partOfSpeech && (
                <span className="inline-block px-4 py-1.5 bg-white/10 dark:bg-black/10 rounded-full text-[10px] font-bold uppercase tracking-[0.15em]">
                  {card.partOfSpeech}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BACK: Объяснение — w-block стиль */}
        <div className="flip-card-back absolute w-full h-full">
          <div className="w-block w-full h-full p-6 md:p-10 flex flex-col relative overflow-hidden shadow-xl">
            <button
              onClick={toggleTranslation}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220] text-[#7A756E] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] hover:text-[#FF5733] transition-all z-10"
              title="Vis oversettelse"
            >
              {showTranslation ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>

            {ttsSupported && (
              <button
                onClick={handleSpeak}
                className="absolute top-6 left-6 p-3 rounded-2xl bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] hover:scale-110 transition-all z-10"
              >
                <Volume2 size={24} />
              </button>
            )}

            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 max-w-2xl mx-auto w-full">
              <div className="space-y-2">
                <h3 className="u-title text-3xl md:text-4xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                  {card.word}
                </h3>
                {showTranslation && (
                  <p className="o-title text-2xl md:text-3xl font-bold animate-in fade-in slide-in-from-top-2">
                    {card.translation}
                  </p>
                )}
              </div>

              {card.explanation && (
                <div className="space-y-2 w-full">
                  <div className="uc-title flex items-center justify-center gap-2">
                    <BookOpen size={14} /> Forklaring
                  </div>
                  <p className="text-lg md:text-xl text-[#1A1714] dark:text-[#F0EDE8] leading-relaxed font-medium opacity-90">
                    {card.explanation}
                  </p>
                </div>
              )}

              {card.example && (
                <div className="space-y-2 w-full pt-4">
                  <div className="sub-title flex items-center justify-center gap-2">
                    <Quote size={14} /> Eksempel
                  </div>
                  <p className="text-base md:text-lg italic text-[#7A756E] leading-snug">
                    "{card.example}"
                  </p>
                </div>
              )}
            </div>

            {card.partOfSpeech && (
              <div className="mt-auto pt-4">
                <span className="sub-title text-[10px] font-black uppercase tracking-[0.2em]">
                  {card.partOfSpeech}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
