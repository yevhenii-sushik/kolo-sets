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
  A0: "bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300",
  A1: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  A2: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  B1: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  C2: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
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
      <div className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-5 border border-white/20 dark:border-gray-700/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${LEVEL_COLORS[set.level]}`}
              >
                {set.level}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                {set.topic}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {set.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 shrink-0">
            <Layers size={14} />
            <span className="text-sm font-medium">{set.cardCount}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1">
          {set.description}
        </p>

        {/* Word chips preview */}
        <div className="flex flex-wrap gap-1.5">
          {set.cards.slice(0, 5).map((card) => (
            <span
              key={card.word}
              className="px-2.5 py-1 bg-gray-100/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium"
            >
              {card.word}
            </span>
          ))}
          {set.cards.length > 5 && (
            <span className="px-2.5 py-1 text-gray-400 text-xs">
              +{set.cards.length - 5}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setShowModeModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Учить
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => setShowWordsModal(true)}
            className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 hover:border-purple-400 text-gray-600 dark:text-gray-300 hover:text-purple-600 rounded-xl transition-colors"
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
                ? "border-green-400 text-green-500 bg-green-50 dark:bg-green-900/20 cursor-default"
                : "border-gray-200 dark:border-gray-600 hover:border-purple-400 text-gray-600 dark:text-gray-300 hover:text-purple-600"
            }`}
          >
            {added ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
      </div>

      {/* ── Study Mode Picker ─────────────────────────────────────────────── */}
      {showModeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModeModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                  Выбери режим
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {set.title}
                </h3>
              </div>
              <button
                onClick={() => setShowModeModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {set.cardCount} слов · {set.level}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStartStudy("flashcards")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700/50 hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Zap size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    Флэшкарты
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Переворачивай и оценивай
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleStartStudy("quiz")}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    Quiz
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
            className="bg-white dark:bg-gray-800 rounded-[2rem] w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-700/50 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${LEVEL_COLORS[set.level]}`}
                  >
                    {set.level}
                  </span>
                  <span className="text-xs text-gray-400">{set.topic}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {set.title}
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  {set.cardCount} слов
                </p>
              </div>
              <button
                onClick={() => setShowWordsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Word list */}
            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {set.cards.map((card, i) => (
                <div
                  key={card.word}
                  className="bg-gray-50/80 dark:bg-gray-700/40 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-gray-900 dark:text-white">
                        {card.word}
                      </span>
                      {card.partOfSpeech && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                          {card.partOfSpeech}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      #{i + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      {card.translation}
                    </span>
                  </div>

                  {card.explanation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 pl-3.5">
                      {card.explanation}
                    </p>
                  )}

                  {card.example && (
                    <div className="flex gap-2 pl-3.5">
                      <Quote
                        size={12}
                        className="text-purple-400 mt-0.5 shrink-0"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        {card.example}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 shrink-0 flex gap-2">
              <button
                onClick={() => {
                  setShowWordsModal(false);
                  setShowModeModal(true);
                }}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Учить этот набор
              </button>
              <button
                onClick={handleAddToMine}
                disabled={added || addingInProgress}
                title={added ? "Уже добавлено" : "Добавить в мои"}
                className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  added
                    ? "border-green-400 text-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-400 hover:text-purple-600"
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
