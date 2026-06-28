import { useState, useEffect } from "react";
import { Card } from "../../types";
import { speak, isTTSSupported } from "../../utils/tts";
import { useI18n } from "../../contexts/I18nContext";
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
  const { t } = useI18n();
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (!isFlipped) setShowTranslation(false);
  }, [isFlipped, card.id]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(card.word, language);
  };

  const toggleTranslation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTranslation(v => !v);
  };

  const ttsSupported = isTTSSupported();

  return (
    <div
      className={`flip-card w-full min-h-70 h-[min(52vh,400px)] sm:h-[min(58vh,460px)] md:h-[min(62vh,500px)] ${isFlipped ? "flipped" : ""}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner relative w-full h-full cursor-pointer select-none">

        {/* FRONT: word */}
        <div className="flip-card-front absolute w-full h-full">
          <div className="b-block w-full h-full flex flex-col items-center justify-center p-8 shadow-xl relative overflow-hidden">
            <div className="absolute right-[-6%] bottom-[-8%] rotate-12 pointer-events-none opacity-[0.06]">
              <BookOpen size={180} strokeWidth={1} className="text-current" />
            </div>
            <div className="text-center space-y-4 relative z-10">
              <h2 className="u-title text-4xl sm:text-5xl md:text-7xl font-black tracking-tight wrap-break-word leading-tight">
                {card.word}
              </h2>
              {card.partOfSpeech && (
                <span className="inline-block px-4 py-1.5 bg-white/10 dark:bg-black/10 rounded-full text-[10px] font-black uppercase tracking-[0.15em]">
                  {card.partOfSpeech}
                </span>
              )}
            </div>
            {/* Subtle tap hint */}
            <p className="absolute bottom-5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-current opacity-30">
              {t.words.flashcards.hints.clickToFlip}
            </p>
          </div>
        </div>

        {/* BACK: explanation */}
        <div className="flip-card-back absolute w-full h-full">
          <div className="w-block w-full h-full p-6 md:p-10 flex flex-col relative overflow-hidden shadow-xl">

            {/* TTS button */}
            {ttsSupported && (
              <button
                onClick={handleSpeak}
                aria-label={card.word}
                className="absolute top-5 left-5 p-3 rounded-2xl bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] hover:scale-110 transition-all z-10"
              >
                <Volume2 size={22} />
              </button>
            )}

            {/* Show/hide translation */}
            <button
              onClick={toggleTranslation}
              aria-label={showTranslation ? t.words.flashcards.hideTranslation : t.words.flashcards.showTranslation}
              className="absolute top-5 right-5 p-3 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220] text-[#7A756E] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] hover:text-[#FF5733] transition-all z-10"
            >
              {showTranslation ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 max-w-2xl mx-auto w-full pt-8">
              <div className="space-y-2">
                <h3 className="u-title text-3xl md:text-4xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                  {card.word}
                </h3>
                {showTranslation && (
                  <p className="o-title text-2xl md:text-3xl font-bold animate-in fade-in slide-in-from-top-2 duration-200">
                    {card.translation}
                  </p>
                )}
              </div>

              {card.explanation && (
                <div className="space-y-1.5 w-full">
                  <div className="uc-title flex items-center justify-center gap-2">
                    <BookOpen size={13} />
                    {t.words.flashcards.explanation}
                  </div>
                  <p className="text-base md:text-lg text-[#1A1714] dark:text-[#F0EDE8] leading-relaxed font-medium opacity-90">
                    {card.explanation}
                  </p>
                </div>
              )}

              {card.example && (
                <div className="space-y-1.5 w-full pt-3">
                  <div className="sub-title flex items-center justify-center gap-2">
                    <Quote size={13} />
                    {t.words.flashcards.example}
                  </div>
                  <p className="text-sm md:text-base italic text-[#7A756E] leading-snug">
                    "{card.example}"
                  </p>
                </div>
              )}
            </div>

            {card.partOfSpeech && (
              <div className="mt-auto pt-4 text-center">
                <span className="sub-title">{card.partOfSpeech}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
