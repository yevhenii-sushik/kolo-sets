import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVertical, Pencil, Trash2, Layers, Calendar, Target, ChevronRight, Zap, BookOpen, X } from 'lucide-react';
import { Collection } from '../types';
import { useI18n } from '../contexts/I18nContext';

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
}

export default function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen]     = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Добавь это в начало компонента CollectionCard или исправь существующую функцию
  const formatDate = (date: any) => {
    if (!date) return '';
    try {
      // Обработка объекта Firestore Timestamp
      if (date && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Обработка строки или обычного объекта Date
      const d = new Date(date);
      if (isNaN(d.getTime())) return ''; // Если дата некорректна, возвращаем пустую строку
      return d.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };

  const isEmpty   = collection.cards.length === 0;
  const tooFewQuiz = collection.cards.length < 4;

  return (
    <>
      <div className="group bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm rounded-[2rem] p-5 border border-white/20 dark:border-gray-700/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Word count badge */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {collection.language ?? 'lang'}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <Layers size={11} />
                {collection.cards.length} {t.collectionCard.cards}
              </span>
            </div>

            <h3
              className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate"
              title={collection.name}
            >
              {collection.name}
            </h3>
          </div>

          {/* ⋮ menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
            >
              <EllipsisVertical size={18} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-10 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-10 overflow-hidden">
                <button
                  onClick={() => { navigate(`/collection/${collection.id}/edit`); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Pencil size={15} className="mr-3 text-gray-400" />
                  {t.collectionCard.edit}
                </button>
                <button
                  onClick={() => { onDelete(collection.id); setIsMenuOpen(false); }}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={15} className="mr-3" />
                  {t.delete}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Meta info ── */}
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Calendar size={12} />
            <span>{formatDate(collection.createdAt)}</span>
          </div>
          {collection.lastStudied && (
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Target size={12} />
              <span>{t.collectionCard.lastStudied}: {formatDate(collection.lastStudied)}</span>
            </div>
          )}
        </div>

        {/* ── SRS progress dots ── */}
        {collection.cards.length > 0 && (() => {
          const avgInterval = collection.cards.reduce(
            (sum, c) => sum + (c.srsData?.interval ?? 0), 0
          ) / collection.cards.length;
          const filled = Math.round((avgInterval / 5) * 5);
          return (
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < filled
                      ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.4)]'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          );
        })()}

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => !isEmpty && setShowModeModal(true)}
            disabled={isEmpty}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {t.collectionCard.study}
            <ChevronRight size={15} />
          </button>

          <button
            onClick={() => navigate(`/collection/${collection.id}/edit`)}
            className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 hover:border-purple-400 text-gray-500 dark:text-gray-400 hover:text-purple-600 rounded-xl transition-colors"
            title={t.collectionCard.edit}
          >
            <Pencil size={16} />
          </button>
        </div>
      </div>

      {/* ── Study Mode Picker Modal ── */}
      {showModeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModeModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                  Выбери режим
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {collection.name}
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
              {collection.cards.length} {t.collectionCard.cards}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Flashcards */}
              <button
                onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/flashcards`); }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700/50 hover:border-purple-500 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Zap size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Флэшкарты</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Переворачивай и оценивай</p>
                </div>
              </button>

              {/* Quiz */}
              <button
                onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/quiz`); }}
                disabled={tooFewQuiz}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700/50 hover:border-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group disabled:opacity-40 disabled:pointer-events-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">Quiz</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {tooFewQuiz ? 'Нужно 4+ слова' : 'Проверяй знания'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
