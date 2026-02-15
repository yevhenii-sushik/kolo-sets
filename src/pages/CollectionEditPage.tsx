import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card } from '../types';
import { getCollection, updateCollection, createCard, parseImportText } from '../utils/storage';
import AddCardModal from '../components/AddCardModal';
import ImportCardsModal from '../components/ImportCardsModal';
import CardListItem from '../components/CardListItem';

export default function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  useEffect(() => {
    const loadCollection = async () => {
      if (id) {
        const loaded = await getCollection(id);
        if (loaded) {
          setCollection(loaded);
        } else {
          // Коллекция не найдена - возвращаемся на главную
          navigate('/');
        }
      }
    };
    loadCollection();
  }, [id, navigate]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const handleAddCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    const newCard = createCard(
      cardData.word,
      cardData.translation,
      cardData.explanation,
      cardData.example,
      cardData.partOfSpeech
    );

    const updatedCollection = {
      ...collection,
      cards: [...collection.cards, newCard]
    };

    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setIsAddModalOpen(false);
  };

  const handleImportCards = async (text: string) => {
    const parsedCards = parseImportText(text);
    const newCards = parsedCards.map(cardData =>
      createCard(
        cardData.word,
        cardData.translation,
        cardData.explanation,
        cardData.example,
        cardData.partOfSpeech
      )
    );

    const updatedCollection = {
      ...collection,
      cards: [...collection.cards, ...newCards]
    };

    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setIsImportModalOpen(false);
  };

  const handleEditCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    if (!editingCard) return;

    const updatedCards = collection.cards.map(card =>
      card.id === editingCard.id
        ? { ...card, ...cardData }
        : card
    );

    const updatedCollection = {
      ...collection,
      cards: updatedCards
    };

    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Удалить это слово?')) {
      const updatedCards = collection.cards.filter(card => card.id !== cardId);
      const updatedCollection = {
        ...collection,
        cards: updatedCards
      };

      await updateCollection(updatedCollection);
      setCollection(updatedCollection);
    }
  };

  const handleRenameCollection = async () => {
    const newName = window.prompt('Новое название коллекции:', collection.name);
    if (newName && newName.trim()) {
      const updatedCollection = {
        ...collection,
        name: newName.trim()
      };
      await updateCollection(updatedCollection);
      setCollection(updatedCollection);
    }
  };

  return (
    <div>
      {/* Заголовок и кнопки */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
        >
          ← Назад к коллекциям
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {collection.name}
              </h2>
              <button
                onClick={handleRenameCollection}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Переименовать коллекцию"
              >
                ✏️
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Всего слов: {collection.cards.length}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              📥 Импорт
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Добавить слово
            </button>
          </div>
        </div>
      </div>

      {/* Список слов */}
      {collection.cards.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            В коллекции пока нет слов
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Добавьте слова вручную или импортируйте из текста
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              + Добавить слово
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              📥 Импортировать
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {collection.cards.map((card) => (
            <CardListItem
              key={card.id}
              card={card}
              onEdit={() => setEditingCard(card)}
              onDelete={() => handleDeleteCard(card.id)}
            />
          ))}
        </div>
      )}

      {/* Модальные окна */}
      <AddCardModal
        isOpen={isAddModalOpen || editingCard !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCard(null);
        }}
        onSave={editingCard ? handleEditCard : handleAddCard}
        initialData={editingCard || undefined}
        title={editingCard ? 'Редактировать слово' : 'Добавить слово'}
      />

      <ImportCardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
      />
    </div>
  );
}
