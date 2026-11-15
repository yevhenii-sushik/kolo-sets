import { BookOpen, Quote, Volume2 } from "lucide-react";
import { Card } from "../../types";
import { speakWord, isTTSSupported } from "../../utils/tts";
import { useI18n } from "../../contexts/I18nContext";
import { Badge, IconButton, cx } from "../../ui";
import { Strength } from "../../utils/srs";
import { posLabel } from "../../data/partsOfSpeech";

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  language?: string;
  onFlip: () => void;
  reverse?: boolean; // наоборот: на лице перевод, на обороте слово — вспоминаем слово
  strength?: Strength; // сила памяти слова — значок на лице (флэшкарты набора)
}

const STRENGTH_KEYS = ["new", "learning", "growing", "strong"] as const;

// Флэшкарта с переворотом (стили .flip-card в index.css): лицо — слово, оборот — ответ крупно,
// под ним объяснение и пример. Ответ виден сразу: раньше перевод прятался за значком глаза, и после
// «Показать ответ» человек видел то же слово ещё раз (docs/specs/perigee.md, «Флэшкарты»)
export default function Flashcard({ card, isFlipped, language = "nb-NO", onFlip, reverse = false, strength }: FlashcardProps) {
  const { t } = useI18n();
  const f = t.words.flashcards;
  // Сверху — то, что было на лице (напоминание), ниже крупно — то, что нужно было вспомнить
  const prompt = reverse ? card.translation : card.word;
  const answer = reverse ? card.word : card.translation;

  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <div className={`flip-card h-[min(52vh,400px)] min-h-70 w-full sm:h-[min(58vh,460px)] md:h-[min(60vh,480px)] ${isFlipped ? "flipped" : ""}`} onClick={onFlip}>
      <div className="flip-card-inner relative h-full w-full cursor-pointer select-none">
        <div className="flip-card-front absolute h-full w-full">
          <CardFront card={card} reverse={reverse} strength={strength} />
        </div>

        {/* Оборот: ответ крупно, объяснение, пример */}
        <div className="flip-card-back absolute h-full w-full">
          <div className="relative flex h-full w-full flex-col overflow-y-auto rounded-4xl border border-line bg-surface p-6 shadow-xl md:p-10">
            {/* Озвучка — голосом браузера, качество зависит от устройства: пока честно помечаем бетой */}
            {isTTSSupported() && (
              <div className="absolute left-4 top-4 flex items-center gap-2" title={f.ttsBetaHint} onClick={(e) => e.stopPropagation()}>
                <IconButton variant="soft" label={f.speak} onClick={stop(() => speakWord(card.word, language))}>
                  <Volume2 size={20} />
                </IconButton>
                <Badge tone="special">{f.ttsBeta}</Badge>
              </div>
            )}

            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-6 pt-10 text-center">
              <div className="grid gap-2">
                <p dir="auto" className="text-lg font-semibold text-muted md:text-xl">
                  {prompt}
                  {card.partOfSpeech && <span className="ml-2 text-sm font-medium text-faint">{posLabel(card.partOfSpeech, t.words.pos)}</span>}
                </p>
                <h3 dir="auto" className="font-display text-4xl font-extrabold leading-tight text-accent-ink wrap-break-word md:text-5xl">{answer}</h3>
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

// Лицо карточки — отдельно, потому что его же показывает колода (CardStage): под верхней карточкой лежит
// настоящая следующая, а не пустая «рубашка». Лицо тёплое (accent-soft), оборот нейтральный (surface):
// стороны различаются оттенком, а не яркостью. Инверсное лицо (bg-fg) в тёмной теме было ярко-белым и
// било по глазам при перевороте, а одинаковые стороны не отличались друг от друга
export function CardFront({ card, reverse = false, strength }: { card: Card; reverse?: boolean; strength?: Strength }) {
  const { t } = useI18n();
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-4xl border border-accent/15 bg-accent-soft p-8 text-fg shadow-xl">
      {/* Знак «Орбиты» — кольцо со спутником, приглушённо */}
      <svg viewBox="0 0 200 200" aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 text-accent/20">
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="36" cy="36" r="6" className="fill-accent" />
      </svg>
      {/* Сила памяти: три точки-спутника заполняются по мере того, как слово крепнет */}
      {strength !== undefined && <StrengthChip strength={strength} className="absolute left-5 top-5" />}
      <h2 dir="auto" className="relative text-center font-display text-4xl font-extrabold leading-tight wrap-break-word sm:text-5xl md:text-6xl">
        {reverse ? card.translation : card.word}
      </h2>
      {card.partOfSpeech && <span className="relative rounded-full bg-surface/70 px-3 py-1 text-sm font-medium text-muted">{posLabel(card.partOfSpeech, t.words.pos)}</span>}
    </div>
  );
}

// Сила памяти слова: три точки-спутника заполняются по мере того, как слово крепнет. Общая для лица
// флэшкарты и карточки вопроса в тесте
export function StrengthChip({ strength, className }: { strength: Strength; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full bg-surface/70 px-3 py-1 text-xs font-semibold text-muted", className)}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cx("h-1.5 w-1.5 rounded-full transition-colors duration-500", i <= strength ? "bg-accent" : "bg-faint/30")} />
        ))}
      </span>
      {t.words.flashcards.strength[STRENGTH_KEYS[strength]]}
    </span>
  );
}
