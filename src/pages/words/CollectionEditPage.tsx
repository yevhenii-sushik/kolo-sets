import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Collection } from '../../types'; // Добавили Collection
import { getCollection, updateCollection, createCard, parseImportText } from '../../utils/storage';
import { useI18n } from '../../contexts/I18nContext';
import { ArrowLeft, Plus, Upload, Edit3, BookOpen, Layers } from 'lucide-react';
import AddCardModal from '../../components/AddCardModal';
import ImportCardsModal from '../../components/ImportCardsModal';
import CardListItem from '../../components/CardListItem';

export default function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  // Состояние коллекции. Изначально null, загружается в useEffect
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  useEffect(() => {
    const loadCollection = async () => {
      if (id) {
        const loaded = await getCollection(id);
        if (loaded) {
          setCollection(loaded as Collection);
        } else {
          navigate('/');
        }
        setLoading(false);
      }
    };
    loadCollection();
  }, [id, navigate]);

  // Вычисляем количество выученных слов безопасно
  const learnedCount = useMemo(() => {
    return collection?.cards.filter((c: Card) => c.srsData.interval > 0).length || 0;
  }, [collection]);

  const handleAddCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    if (!collection) return;
    const newCard = createCard(cardData.word, cardData.translation, cardData.explanation, cardData.example, cardData.partOfSpeech);
    const updated = { ...collection, cards: [...collection.cards, newCard] };
    setCollection(updated);
    await updateCollection(updated);
    setIsAddModalOpen(false);
  };

  const handleImportCards = async (text: string) => {
    if (!collection) return;
    const parsedCards = parseImportText(text);
    const newCards = parsedCards.map(cardData => createCard(cardData.word, cardData.translation, cardData.explanation, cardData.example, cardData.partOfSpeech));
    const updated = { ...collection, cards: [...collection.cards, ...newCards] };
    setCollection(updated);
    await updateCollection(updated);
    setIsImportModalOpen(false);
  };

  const handleEditCard = async (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => {
    if (!editingCard || !collection) return;
    const updatedCards = collection.cards.map((card: Card) => card.id === editingCard.id ? { ...card, ...cardData } : card);
    const updated = { ...collection, cards: updatedCards };
    setCollection(updated);
    await updateCollection(updated);
    setEditingCard(null);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!collection) return;
    if (window.confirm('Удалить это слово?')) {
      const updatedCards = collection.cards.filter((card: Card) => card.id !== cardId);
      const updated = { ...collection, cards: updatedCards };
      setCollection(updated);
      await updateCollection(updated);
    }
  };

  const handleRenameCollection = async () => {
    if (!collection) return;
    const newName = window.prompt('Новое название коллекции:', collection.name);
    if (newName && newName.trim()) {
      const updated = { ...collection, name: newName.trim() };
      setCollection(updated);
      await updateCollection(updated);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20 animate-in fade-in duration-500">
      
      {/* Навигация */}
      <div className="flex items-center justify-between py-6">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-all"
        >
          <div className="p-2 rounded-full group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 transition-colors">
            <ArrowLeft size={22} />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">{t.back}</span>
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="p-3 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl hover:shadow-lg transition-all"
          >
            <Upload size={20} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 font-bold text-sm"
          >
            <Plus size={20} />
            <span>{t.editCollection.addCard}</span>
          </button>
        </div>
      </div>

      {/* Шапка (Glassmorphism) */}
      <div className="relative overflow-hidden mb-10 p-8 md:p-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[3rem] shadow-sm">
        <div className="relative z-10">
          <div className="flex items-center gap-4 group mb-6">
            <h1 className={`text-3xl md:text-5xl font-black italic tracking-tight transition-all duration-500 ${loading ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
              {collection?.name || 'Загрузка...'}
            </h1>
            {!loading && (
              <button
                onClick={handleRenameCollection}
                className="opacity-0 group-hover:opacity-100 p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all"
              >
                <Edit3 size={24} />
              </button>
            )}
          </div>
          
          <div className={`flex flex-wrap gap-4 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Layers size={14} />
              {collection?.cards.length || 0} {t.collectionCard.cards}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              <BookOpen size={14} />
              {learnedCount} Выучено
            </div>
          </div>
        </div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Список слов */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] px-4 mb-4">
          Список слов
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : !collection || collection.cards.length === 0 ? (
          <div className="group cursor-pointer text-center py-20 bg-gray-50/30 dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-purple-400 transition-all"
               onClick={() => setIsAddModalOpen(true)}>
            <div className="text-6xl mb-6">✍️</div>
            <h3 className="text-xl font-black italic text-gray-700 dark:text-gray-300 mb-2">
              {t.editCollection.noCards}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Нажми сюда, чтобы добавить первое слово
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {collection.cards.map((card: Card) => (
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

      {/* Модалки (Рендерим всегда, чтобы анимации открытия были плавными) */}
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