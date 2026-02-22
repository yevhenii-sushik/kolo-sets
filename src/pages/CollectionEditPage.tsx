import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card } from '../types';
import { getCollection, updateCollection, createCard, parseImportText } from '../utils/storage';
import { useI18n } from '../contexts/I18nContext';
import { ArrowLeft, Plus, Upload, Edit3, BookOpen, Layers } from 'lucide-react';
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
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 animate-pulse font-medium">{t.loading}...</div>
      </div>
    );
  }

  // ... (логика функций handleAddCard, handleImportCards, и т.д. остается прежней)
  const handleAddCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    const newCard = createCard(cardData.word, cardData.translation, cardData.explanation, cardData.example, cardData.partOfSpeech);
    const updatedCollection = { ...collection, cards: [...collection.cards, newCard] };
    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setIsAddModalOpen(false);
  };

  const handleImportCards = async (text: string) => {
    const parsedCards = parseImportText(text);
    const newCards = parsedCards.map(cardData => createCard(cardData.word, cardData.translation, cardData.explanation, cardData.example, cardData.partOfSpeech));
    const updatedCollection = { ...collection, cards: [...collection.cards, ...newCards] };
    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setIsImportModalOpen(false);
  };

  const handleEditCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    if (!editingCard) return;
    const updatedCards = collection.cards.map(card => card.id === editingCard.id ? { ...card, ...cardData } : card);
    const updatedCollection = { ...collection, cards: updatedCards };
    await updateCollection(updatedCollection);
    setCollection(updatedCollection);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (window.confirm('Удалить это слово?')) {
      const updatedCards = collection.cards.filter(card => card.id !== cardId);
      const updatedCollection = { ...collection, cards: updatedCards };
      await updateCollection(updatedCollection);
      setCollection(updatedCollection);
    }
  };

  const handleRenameCollection = async () => {
    const newName = window.prompt('Новое название коллекции:', collection.name);
    if (newName && newName.trim()) {
      const updatedCollection = { ...collection, name: newName.trim() };
      await updateCollection(updatedCollection);
      setCollection(updatedCollection);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      
      {/* Навигация и Экшены */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-all"
        >
          <div className="p-2 rounded-full group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
            <ArrowLeft size={22} />
          </div>
          <span className="font-medium">{t.back}</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="p-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:shadow-lg transition-all active:scale-95"
            title={t.editCollection.import}
          >
            <Upload size={20} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 font-semibold"
          >
            <Plus size={20} />
            <span>{t.editCollection.addCard}</span>
          </button>
        </div>
      </div>

      {/* Шапка коллекции (Glassmorphism card) */}
      <div className="relative overflow-hidden mb-10 p-6 md:p-10 bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-800/80 dark:to-gray-800/40 border border-white/20 dark:border-gray-700/30 rounded-[2.2rem] backdrop-blur-xl shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 group mb-4">
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                {collection.name}
              </h1>
              <button
                onClick={handleRenameCollection}
                className="opacity-0 group-hover:opacity-100 p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all"
              >
                <Edit3 size={24} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-bold">
                <Layers size={16} />
                {collection.cards.length} {t.collectionCard.cards}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-bold">
                <BookOpen size={16} />
                {collection.cards.filter(c => c.srsData.interval > 0).length} Выучено
              </div>
            </div>
          </div>
        </div>
        
        {/* Декоративный элемент на фоне */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Список карточек */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest text-xs">
            Список слов
          </h2>
        </div>

        {collection.cards.length === 0 ? (
          <div className="group cursor-pointer text-center py-20 bg-gray-50/50 dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all"
               onClick={() => setIsAddModalOpen(true)}>
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-500">✍️</div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {t.editCollection.noCards}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{t.editCollection.noCardsDescription}</p>
          </div>
        ) : (
          <div className="grid gap-3">
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
      </div>

      {/* Модалки */}
      <AddCardModal
        isOpen={isAddModalOpen || editingCard !== null}
        onClose={() => { setIsAddModalOpen(false); setEditingCard(null); }}
        onSave={editingCard ? handleEditCard : handleAddCard}
        initialData={editingCard || undefined}
        title={editingCard ? 'Редактировать слово' : 'Новое слово'}
      />

      <ImportCardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
      />
    </div>
  );
}