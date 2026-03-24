import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EllipsisVertical,
  Pencil,
  Trash2,
  Layers,
  Calendar,
  ChevronRight,
  Zap,
  BookOpen,
  X,
} from "lucide-react";
import { Collection } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
}

export default function CollectionCard({
  collection,
  onDelete,
}: CollectionCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = new Date(date?.toDate ? date.toDate() : date);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  };

  const isEmpty = collection.cards.length === 0;
  const tooFewQuiz = collection.cards.length < 4;

  return (
    <>
      <div className="group relative bg-white dark:bg-[#1A1917] rounded-[2rem] p-6 border border-[#E0DBD3] dark:border-[#2E2C29] transition-all duration-300 hover:border-[#FF5733]/40 shadow-sm hover:shadow-md flex flex-col h-full">
        {/* ── Header: Lang & Menu ── */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E] dark:text-[#8A867F]">
              {collection.language || "NO"}
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#B5B0A8]">
              <Layers size={12} />
              {collection.cards.length}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 text-[#B5B0A8] hover:text-[#1A1714] dark:hover:text-[#F0EDE8] transition-colors"
            >
              <EllipsisVertical size={20} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl shadow-xl z-20 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      navigate(`/collection/${collection.id}/edit`)
                    }
                    className="w-full flex items-center px-4 py-3 text-xs font-bold text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                  >
                    <Pencil size={14} className="mr-2" />{" "}
                    {t.words.collectionCard.edit}
                  </button>
                  <button
                    onClick={() => {
                      onDelete(collection.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <Trash2 size={14} className="mr-2" /> {t.delete}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1">
          <h3 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-1 truncate">
            {collection.name}
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#B5B0A8] mb-6">
            <Calendar size={12} />
            {formatDate(collection.createdAt)}
          </div>
        </div>

        {/* ── Simple SRS Progress ── */}
        {collection.cards.length > 0 && (
          <div className="flex gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < 3 ? "bg-[#FF5733]" : "bg-[#F5F2ED] dark:bg-[#242220]"
                }`}
              />
            ))}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex gap-2">
          <button
            onClick={() => !isEmpty && setShowModeModal(true)}
            disabled={isEmpty}
            className="flex-[3] flex items-center justify-center gap-2 py-3.5 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] text-[11px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20"
          >
            {t.words.collectionCard.study}
            <ChevronRight size={14} />
          </button>

          <button
            onClick={() => navigate(`/collection/${collection.id}/edit`)}
            className="flex-1 flex items-center justify-center py-3.5 border border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* ── Study Mode Modal ── */}
      <AnimatePresence>
        {showModeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModeModal(false)}
              className="absolute inset-0 bg-[#1A1714]/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-6 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-5 sm:mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5733] mb-1">
                    {t.words.collectionCard.modal.chooseMode}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight truncate max-w-[180px] sm:max-w-none">
                    {collection.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModeModal(false)}
                  className="p-2 bg-[#F5F2ED] dark:bg-[#242220] rounded-full text-[#7A756E] hover:rotate-90 transition-transform"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Flashcards Option */}
                <button
                  onClick={() => {
                    setShowModeModal(false);
                    navigate(`/collection/${collection.id}/flashcards`);
                  }}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] border border-transparent hover:border-[#FF5733] transition-all group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-[#1A1917] rounded-xl flex items-center justify-center text-[#FF5733] shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <Zap size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-[#1A1714] dark:text-[#F0EDE8]">
                      {t.words.collectionCard.modal.flashcards}
                    </p>
                    <p className="text-[10px] font-medium text-[#7A756E]">
                      {t.words.collectionCard.modal.flashcardsDesc}
                    </p>
                  </div>
                </button>

                {/* Quiz Option */}
                <button
                  onClick={() => {
                    setShowModeModal(false);
                    navigate(`/collection/${collection.id}/quiz`);
                  }}
                  disabled={tooFewQuiz}
                  className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] border border-transparent hover:border-[#FF5733] transition-all group disabled:opacity-30 disabled:grayscale"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-[#1A1917] rounded-xl flex items-center justify-center text-[#FF5733] shadow-sm group-hover:scale-110 transition-transform shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-sm text-[#1A1714] dark:text-[#F0EDE8]">
                      {t.words.collectionCard.modal.quiz}
                    </p>
                    <p className="text-[10px] font-medium text-[#7A756E]">
                      {tooFewQuiz
                        ? t.words.collectionCard.modal.quizNeedsMore
                        : t.words.collectionCard.modal.quizDesc}
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
