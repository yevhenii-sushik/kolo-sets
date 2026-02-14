import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collection } from '../types';
import { getCollections, createCollection, deleteCollection } from '../utils/storage';
import CollectionCard from '../components/CollectionCard';
import CreateCollectionModal from '../components/CreateCollectionModal';

export default function HomePage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Загружаем коллекции при монтировании компонента
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = () => {
    const loaded = getCollections();
    setCollections(loaded);
  };

  const handleCreateCollection = (name: string) => {
    const newCollection = createCollection(name);
    loadCollections();
    setIsCreateModalOpen(false);
    // Переходим к редактированию новой коллекции
    navigate(`/collection/${newCollection.id}/edit`);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this deck?')) {
      deleteCollection(id);
      loadCollections();
    }
  };

  return (
    <div>
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            My decks
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {collections.length === 0 
              ? 'You don\'t have any decks yet. Create your first one!' 
              : `Total decks: ${collections.length}`}
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          + Add deck
        </button>
      </div>

      {/* Список коллекций */}
      {collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Здесь пока пусто
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Создайте свою первую коллекцию слов для изучения
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Создать коллекцию
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map(collection => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onDelete={handleDeleteCollection}
            />
          ))}
        </div>
      )}

      {/* Модальное окно создания коллекции */}
      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCollection}
      />
    </div>
  );
}
