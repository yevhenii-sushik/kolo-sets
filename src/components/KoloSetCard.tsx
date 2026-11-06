import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  ChevronRight,
  X,
  BookOpen,
  Zap,
  Plus,
  Check,
  Quote,
} from "lucide-react";
import { KoloSet, CEFRLevel } from "../types/kolo-sets";
import {
  createCollection,
  updateCollection,
  createCard,
} from "../utils/storage";
import { useToast } from "../hooks/useToast";

interface KoloSetCardProps {
  set: KoloSet;
}

const LEVEL_COLORS: Record<CEFRLevel, string> = {
  A0: "bg-inset text-muted ",
  A1: "bg-success-soft text-success ",
  A2: "bg-success-soft text-success ",
  B1: "bg-info-soft text-info ",
  B2: "bg-info-soft text-info ",
  C1: "bg-special-soft text-special ",
  C2: "bg-danger-soft text-danger ",
};

// Создаёт коллекцию с карточками через createCollection + updateCollection
// (createCollection не принимает карточки, поэтому сразу обновляем)
const createCollectionWithCards = async (
  name: string,
  language: string,
  set: KoloSet,
) => {
  const collection = await createCollection(name, language);

  const cards = set.cards.map((c) =>
    createCard(
      c.word,
      c.translation,
      c.explanation ?? "",
      c.example ?? "",
      c.partOfSpeech ?? "",
    ),
  );

  const collectionWithCards = { ...collection, cards };
  await updateCollection(collectionWithCards);

  return collectionWithCards;
};

export default function KoloSetCard({ set }: KoloSetCardProps) {
  const navigate = useNavigate();
  const { success } = useToast();

  const [showModeModal, setShowModeModal] = useState(false);
  const [showWordsModal, setShowWordsModal] = useState(false);
  const [added, setAdded] = useState(false);
  const [addingInProgress, setAddingInProgress] = useState(false);

  // ── Добавить в свои коллекции ────────────────────────────────────────────
  const handleAddToMine = async () => {
    if (added || addingInProgress) return;
    setAddingInProgress(true);
    await createCollectionWithCards(set.title, set.language, set);
    setAdded(true);
    setAddingInProgress(false);
    success(`"${set.title}" добавлен в мои коллекции`);
  };

  // ── Запустить режим изучения ─────────────────────────────────────────────
  const handleStartStudy = async (mode: "flashcards" | "quiz") => {
    setShowModeModal(false);
    const collection = await createCollectionWithCards(
      set.title,
      set.language,
      set,
    );
    navigate(`/collection/${collection.id}/${mode}`);
  };

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="group bg-surface/60 backdrop-blur-sm rounded-4xl p-5 border border-white/20 dark:border-faint/30 hover:shadow-xl hover:shadow-special/5 transition-all duration-300 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-widest ${LEVEL_COLORS[set.level]}`}
              >
                {set.level}
              </span>
              <span className="text-xs text-faint">
                {set.topic}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-fg leading-tight">
              {set.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-faint shrink-0">
            <Layers size={14} />
            <span className="text-sm font-medium">{set.cardCount}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted leading-relaxed flex-1">
          {set.description}
        </p>

        {/* Word chips preview */}
        <div className="flex flex-wrap gap-1.5">
          {set.cards.slice(0, 5).map((card) => (
            <span
              key={card.word}
              className="px-2.5 py-1 bg-inset/80 text-muted rounded-lg text-xs font-medium"
            >
              {card.word}
            </span>
          ))}
          {set.cards.length > 5 && (
            <span className="px-2.5 py-1 text-faint text-xs">
              +{set.cards.length - 5}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowModeModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-special hover:bg-special text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Учить
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => setShowWordsModal(true)}
            className="px-3 py-2.5 border border-line hover:border-special text-muted hover:text-special rounded-xl transition-colors"
            title="Все слова"
          >
            <BookOpen size={16} />
          </button>

          <button
            onClick={handleAddToMine}
            disabled={added || addingInProgress}
            title={added ? "Добавлено" : "Добавить в мои коллекции"}
            className={`px-3 py-2.5 rounded-xl border transition-colors ${
              added
                ? "border-success text-success bg-success-soft cursor-default"
                : "border-line hover:border-special text-muted hover:text-special"
            }`}
          >
            {added ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* ── Study Mode Picker ─────────────────────────────────────────────── */}
      {showModeModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-scrim/40 backdrop-blur-xl"
          onClick={() => setShowModeModal(false)}
        >
          <div
            className="bg-surface rounded-2xl sm:rounded-4xl p-4 sm:p-6 w-full max-w-sm shadow-2xl border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-1 sm:mb-2">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-[0.2em] text-accent-ink mb-1">
                  Выбери режим
                </p>
                <h3 className="text-xl font-semibold text-fg">
                  {set.title}
                </h3>
              </div>
              <button
                onClick={() => setShowModeModal(false)}
                className="p-1.5 text-muted hover:bg-subtle rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm font-medium text-muted mb-4 sm:mb-5">
              {set.cardCount} слов · {set.level}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => handleStartStudy("flashcards")}
                className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-accent-soft border-2 border-accent/30 hover:border-accent transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Zap size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-fg text-sm">
                    Флэшкарты
                  </p>
                  <p className="text-xs font-medium text-muted mt-0.5">
                    Переворачивай и оценивай
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleStartStudy("quiz")}
                className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-accent-soft border-2 border-accent/30 hover:border-accent transition-all group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-fg text-sm">
                    Quiz
                  </p>
                  <p className="text-xs font-medium text-muted mt-0.5">
                    Проверяй знания
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── All Words Modal ───────────────────────────────────────────────── */}
      {showWordsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowWordsModal(false)}
        >
          <div
            className="bg-surface rounded-4xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-start p-6 border-b border-line shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-widest ${LEVEL_COLORS[set.level]}`}
                  >
                    {set.level}
                  </span>
                  <span className="text-xs text-faint">{set.topic}</span>
                </div>
                <h3 className="text-xl font-semibold text-fg">
                  {set.title}
                </h3>
                <p className="text-sm text-faint mt-0.5">
                  {set.cardCount} слов
                </p>
              </div>
              <button
                onClick={() => setShowWordsModal(false)}
                className="p-2 text-faint hover:text-muted rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Word list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {set.cards.map((card, i) => (
                <div
                  key={card.word}
                  className="bg-inset/80 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-semibold text-fg">
                        {card.word}
                      </span>
                      {card.partOfSpeech && (
                        <span className="px-2 py-0.5 text-2xs font-semibold uppercase tracking-widest bg-special-soft text-special rounded-full">
                          {card.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-faint shrink-0">
                      #{i + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-special shrink-0" />
                    <span className="text-sm font-medium text-fg">
                      {card.translation}
                    </span>
                  </div>

                  {card.explanation && (
                    <p className="text-xs text-muted mb-1.5 pl-3.5">
                      {card.explanation}
                    </p>
                  )}

                  {card.example && (
                    <div className="flex gap-2 pl-3.5">
                      <Quote
                        size={12}
                        className="text-special mt-0.5 shrink-0"
                      />
                      <p className="text-xs text-muted italic">
                        {card.example}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-line shrink-0 flex gap-2">
              <button
                onClick={() => {
                  setShowWordsModal(false);
                  setShowModeModal(true);
                }}
                className="flex-1 py-3 bg-special hover:bg-special text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Учить этот набор
              </button>
              <button
                onClick={handleAddToMine}
                disabled={added || addingInProgress}
                title={added ? "Уже добавлено" : "Добавить в мои"}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  added
                    ? "border-success text-success bg-success-soft "
                    : "border-line text-muted hover:border-special hover:text-special"
                }`}
              >
                {added ? (
                  <>
                    <Check size={15} /> Добавлено
                  </>
                ) : (
                  <>
                    <Plus size={15} /> В мои
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
