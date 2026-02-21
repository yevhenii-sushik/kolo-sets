import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card } from '../types';
import { getCollection, updateCollection, createCard, parseImportText } from '../utils/storage';
import { useI18n } from '../contexts/I18nContext';
import { ArrowLeft, Plus, Upload} from 'lucide-react';
import AddCardModal from '../components/AddCardModal';
import ImportCardsModal from '../components/ImportCardsModal';
import CardListItem from '../components/CardListItem';

export default function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
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
          navigate('/');
        }
      }
    };
    loadCollection();
  }, [id, navigate]);

  if (!collection) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">{t.loading}</div>
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
    <div className="max-w-6xl mx-auto md:py-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t.back}</span>
        </button>

        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {collection.name}
              </h1>
              <button
                onClick={handleRenameCollection}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t.edit}
              >
                ✏️
              </button>
            </div>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              {collection.cards.length} {t.collectionCard.cards}
            </p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm md:text-base font-medium"
            >
              <Upload size={18} />
              <span className="hidden sm:inline">{t.editCollection.import}</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm md:text-base font-medium shadow-md"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">{t.editCollection.addCard}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards list */}
      {collection.cards.length === 0 ? (
        <div className="text-center py-12 md:py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-5xl md:text-6xl mb-4">📝</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t.editCollection.noCards}
          </h3>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-6 px-4">
            {t.editCollection.noCardsDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-4">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
            >
              <Plus size={20} />
              {t.editCollection.addCard}
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
            >
              <Upload size={20} />
              {t.editCollection.import}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
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
