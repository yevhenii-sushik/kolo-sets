import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EllipsisVertical, Pencil, Trash2, Layers, HelpCircle, FileText, Calendar, Target } from 'lucide-react';
import { Collection } from '../types';
import { useI18n } from '../contexts/I18nContext';

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
}

export default function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-4xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700 relative">
      <div className="flex justify-between mb-4 gap-2"> 
        {/* Добавляем truncate и flex-1 */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate flex-1 self-center" title={collection.name}>
          {collection.name}
        </h3>

        {/* Контейнер с кнопкой меню (три точки) */}
        <div className="relative shrink-0" ref={menuRef}>
         <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
          title="Actions">
      <EllipsisVertical size={20} />
    </button>

          {/* Выпадающее меню */}
          {isMenuOpen && (
            <div className="absolute right-0 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl z-10 overflow-hidden">
              <button
                onClick={() => {
                  navigate(`/collection/${collection.id}/edit`);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Pencil size={16} className="mr-3" />
                {t.collectionCard.edit}
              </button>
              
              <button
                onClick={() => {
                  onDelete(collection.id);
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 size={16} className="mr-3" />
                {t.delete}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Информация о коллекции */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <FileText size={16} className="mr-2" />
          <span className="text-sm">{collection.cards.length} {t.collectionCard.cards}</span>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Calendar size={16} className="mr-2" />
          <span className="text-sm">{formatDate(collection.createdAt)}</span>
        </div>

        {collection.lastStudied && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Target size={16} className="mr-2" />
            <span className="text-sm">{t.collectionCard.lastStudied}: {formatDate(collection.lastStudied)}</span>
          </div>
        )}
      </div>

      {/* Основные кнопки действий */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/collection/${collection.id}/flashcards`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-medium transition-colors disabled:opacity-50"
          disabled={collection.cards.length === 0}
        >
          <Layers size={18} /> {t.collectionCard.study}
        </button>
        
        <button
          onClick={() => navigate(`/collection/${collection.id}/quiz`)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl text-sm font-medium transition-colors disabled:opacity-50"
          disabled={collection.cards.length < 4}
        >
          <HelpCircle size={18} /> {t.collectionCard.quiz}
        </button>
      </div>
    </div>
  );
}