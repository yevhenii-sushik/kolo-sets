import { useState, useEffect } from "react";
import { BookOpen, Eye, EyeOff, Quote, Volume2 } from "lucide-react";
import { Card } from "../../types";
import { speak, isTTSSupported } from "../../utils/tts";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, IconButton } from "../../ui";
import { posLabel } from "../../data/partsOfSpeech";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  language?: string;
  onFlip: () => void;
}

// Флэшкарта с переворотом (стили .flip-card в index.css): лицо — слово на тёмном, оборот — объяснение и пример
export default function Flashcard({ card, isFlipped, language = "nb-NO", onFlip }: FlashcardProps) {
  const { t } = useI18n();
  const f = t.words.flashcards;
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    if (!isFlipped) setShowTranslation(false);
  }, [isFlipped, card.id]);

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`flip-card h-[min(52vh,400px)] min-h-70 w-full sm:h-[min(58vh,460px)] md:h-[min(60vh,480px)] ${isFlipped ? "flipped" : ""}`} onClick={onFlip}>
      <div className="flip-card-inner relative h-full w-full cursor-pointer select-none">
        {/* Лицо: слово */}
        <div className="flip-card-front absolute h-full w-full">
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-4xl bg-fg p-8 text-on-inverse shadow-xl">
            <h2 dir="auto" className="text-center font-display text-4xl font-extrabold leading-tight wrap-break-word sm:text-5xl md:text-6xl">{card.word}</h2>
            {card.partOfSpeech && (
              <span className="rounded-full bg-on-inverse/10 px-3 py-1 text-sm font-medium text-on-inverse/80">{posLabel(card.partOfSpeech, t.words.pos)}</span>
            )}
          </div>
        </div>

        {/* Оборот: перевод по кнопке, объяснение, пример */}
        <div className="flip-card-back absolute h-full w-full">
          <div className="relative flex h-full w-full flex-col overflow-y-auto rounded-4xl border border-line bg-surface p-6 shadow-xl md:p-10">
            <div className="absolute left-4 top-4 right-4 flex justify-between" onClick={(e) => e.stopPropagation()}>
              {/* Озвучка — голосом браузера, качество зависит от устройства: пока честно помечаем бетой */}
              {isTTSSupported() ? (
                <div className="flex items-center gap-2" title={f.ttsBetaHint}>
                  <IconButton variant="soft" label={f.speak} onClick={stop(() => speak(card.word, language))}>
                    <Volume2 size={20} />
                  </IconButton>
                  <Badge tone="special">{f.ttsBeta}</Badge>
                </div>
              ) : (
                <span />
              )}
              <IconButton
                variant="surface"
                label={showTranslation ? f.hideTranslation : f.showTranslation}
                onClick={stop(() => setShowTranslation((v) => !v))}
              >
                {showTranslation ? <EyeOff size={20} /> : <Eye size={20} />}
              </IconButton>
            </div>

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 pt-10 text-center">
              <div className="grid gap-2">
                <h3 dir="auto" className="font-display text-3xl font-extrabold text-fg md:text-4xl">{card.word}</h3>
                {card.partOfSpeech && <p className="text-sm text-faint">{posLabel(card.partOfSpeech, t.words.pos)}</p>}
                {showTranslation && <p dir="auto" className="text-2xl font-semibold text-accent-ink md:text-3xl">{card.translation}</p>}
              </div>

              {card.explanation && (
                <div className="grid w-full gap-1.5">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
                    <BookOpen size={14} />
                    {f.explanation}
                  </p>
                  <p dir="auto" className="text-base leading-relaxed text-fg md:text-lg">{card.explanation}</p>
                </div>
              )}

              {card.example && (
                <div className="grid w-full gap-1.5">
                  <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted">
                    <Quote size={14} />
                    {f.example}
                  </p>
                  <p dir="auto" className="text-base italic leading-snug text-muted">{card.example}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
