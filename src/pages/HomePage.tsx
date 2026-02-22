import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collection } from '../types';
import { getCollections, createCollection, deleteCollection } from '../utils/storage';
import { useI18n } from '../contexts/I18nContext';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import CollectionCard from '../components/CollectionCard';
import CreateCollectionModal from '../components/CreateCollectionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, toastState, hideToast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Загружаем коллекции при монтировании компонента
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    const loaded = await getCollections();
    setCollections(loaded);
  };

  const handleCreateCollection = async (name: string, language: string) => {
    const newCollection = await createCollection(name, language);
    await loadCollections();
    setIsCreateModalOpen(false);
    success(t.home.createDeck + ' "' + name + '"');
    // Переходим к редактированию новой коллекции
    navigate(`/collection/${newCollection.id}/edit`);
  };

  const handleDeleteCollection = async (id: string) => {
    const collectionToDelete = collections.find(c => c.id === id);
    const confirmed = await confirm({
      title: t.delete + ' ' + t.collectionCard.study.toLowerCase() + '?',
      message: t.collectionCard.confirmDelete,
      type: 'danger',
      confirmText: t.delete,
      cancelText: t.cancel
    });

    if (confirmed) {
      await deleteCollection(id);
      await loadCollections();
      success('"' + collectionToDelete?.name + '" ' + t.delete.toLowerCase());
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Заголовок и кнопка создания */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t.home.myDecks}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {collections.length === 0 
              ? t.home.noDecksDescription
              : `${t.home.totalDecks}: ${collections.length}`}
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-full transition-colors shadow-md hover:shadow-lg"
        >
          + {t.home.addDeck}
        </button>
      </div>

      {/* Список коллекций */}
      {collections.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t.home.noDecks}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t.home.noDecksDescription}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            {t.home.createDeck}
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

      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Toast уведомления */}
      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />
    </div>
  );
}