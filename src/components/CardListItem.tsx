import { Card } from '../types';

interface CardListItemProps {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CardListItem({ card, onEdit, onDelete }: CardListItemProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        {/* Основная информация */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {card.word}
            </h3>
            {card.partOfSpeech && (
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                {card.partOfSpeech}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Перевод:</strong> {card.translation}
            </p>

            {card.explanation && (
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Объяснение:</strong> {card.explanation}
              </p>
            )}

            {card.example && (
              <p className="text-gray-600 dark:text-gray-400 italic">
                <strong>Пример:</strong> {card.example}
              </p>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2 ml-4">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-200 rounded transition-colors"
            title="Редактировать"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-700 dark:text-red-200 rounded transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
