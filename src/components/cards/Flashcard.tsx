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

export default function Flashcard({ card, isFlipped, language = "nb-NO", onFlip }: FlashcardProps) {
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
    <div className={`flip-card w-full h-[55vh] md:h-[65vh] ${isFlipped ? "flipped" : ""}`} onClick={onFlip}>
      <div className="flip-card-inner relative w-full h-full cursor-pointer">
        
        {/* FRONT: Слово */}
        <div className="flip-card-front absolute w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-700 dark:from-purple-900 dark:to-blue-950 rounded-[2.5rem] shadow-2xl flex items-center justify-center p-8 border-4 border-white/10">
            <div className="text-center space-y-6">
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight break-words">
                {card.word}
              </h2>
              {card.partOfSpeech && (
                <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white/90 text-sm font-bold uppercase tracking-widest">
                  {card.partOfSpeech}
                </span>
              )}
              {/* <div className="pt-4 animate-pulse text-white/40 text-sm font-medium">
                {t.flashcards.flipToSee || "Trykk для å snu"}
              </div> */}
            </div>
          </div>
        </div>

        {/* BACK: Объяснение и Контекст */}
        <div className="flip-card-back absolute w-full h-full">
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border-4 border-purple-500/30 dark:border-purple-500/20 p-6 md:p-10 flex flex-col relative overflow-hidden">
            
            {/* Скрытый перевод в углу */}
            <button
              onClick={toggleTranslation}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:text-purple-600 transition-all z-10"
              title="Vis oversettelse"
            >
              {showTranslation ? <EyeOff size={24} /> : <Eye size={24} />}
            </button>

            {/* Озвучка в левом углу */}
            {ttsSupported && (
              <button
                onClick={handleSpeak}
                className="absolute top-6 left-6 p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:scale-110 transition-all z-10"
              >
                <Volume2 size={24} />
              </button>
            )}

            {/* Контент (Центрирован) */}
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 max-w-2xl mx-auto w-full">
              
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                  {card.word}
                </h3>
                {showTranslation && (
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400 animate-in fade-in slide-in-from-top-2">
                    {card.translation}
                  </p>
                )}
              </div>

              {/* Блок объяснения (Главный фокус) */}
              {card.explanation && (
                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                    <BookOpen size={14} /> Forklaring
                  </div>
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 leading-relaxed font-medium">
                    {card.explanation}
                  </p>
                </div>
              )}

              {/* Блок примера */}
              {card.example && (
                <div className="space-y-2 w-full pt-4">
                   <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                    <Quote size={14} /> Eksempel
                  </div>
                  <p className="text-base md:text-lg italic text-gray-500 dark:text-gray-400 leading-snug">
                    "{card.example}"
                  </p>
                </div>
              )}
            </div>
            
            {/* Часть речи (снизу по центру) */}
            {card.partOfSpeech && (
              <div className="mt-auto pt-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600">
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