import { useNavigate } from 'react-router-dom';
import { Collection } from '../types';

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
}

export default function CollectionCard({ collection, onDelete }: CollectionCardProps) {
  const navigate = useNavigate();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
      {/* Заголовок коллекции */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {collection.name}
        </h3>
        <button
          onClick={() => onDelete(collection.id)}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
          title="Удалить коллекцию"
        >
          🗑️
        </button>
      </div>

      {/* Информация о коллекции */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <span className="mr-2">📝</span>
          <span className="text-sm">
            Слов: <strong>{collection.cards.length}</strong>
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <span className="mr-2">📅</span>
          <span className="text-sm">
            Создано: {formatDate(collection.createdAt)}
          </span>
        </div>

        {collection.lastStudied && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <span className="mr-2">🎯</span>
            <span className="text-sm">
              Последнее изучение: {formatDate(collection.lastStudied)}
            </span>
          </div>
        )}
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => navigate(`/collection/${collection.id}/flashcards`)}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={collection.cards.length === 0}
          title={collection.cards.length === 0 ? 'Добавьте слова в коллекцию' : 'Изучать флешкарточки'}
        >
          🎴 Флешкарточки
        </button>
        
        <button
          onClick={() => navigate(`/collection/${collection.id}/quiz`)}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={collection.cards.length < 4}
          title={collection.cards.length < 4 ? 'Нужно минимум 4 слова для Quiz' : 'Пройти Quiz'}
        >
          ❓ Quiz
        </button>
      </div>

      <button
        onClick={() => navigate(`/collection/${collection.id}/edit`)}
        className="w-full mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors"
      >
        ✏️ Редактировать
      </button>
    </div>
  );
}
