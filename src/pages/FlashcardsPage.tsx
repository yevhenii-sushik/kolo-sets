import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card, KnowledgeLevel, FlashcardStats } from '../types';
import { getCollection, updateCollection, updateSRSData } from '../utils/storage';
import { updateFlashcardStats, checkAndUnlockAchievements } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Flashcard from '../components/Flashcard';
import FlashcardStatsModal from '../components/FlashcardStatsModal';

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState<FlashcardStats>({
    totalCards: 0,
    dontKnow: 0,
    forgot: 0,
    remember: 0,
    know: 0,
    duration: 0
  });
  const [startTime] = useState(Date.now());
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const loadCollection = async () => {
      if (id) {
        const loaded = await getCollection(id);
        if (loaded && loaded.cards.length > 0) {
          setCollection(loaded);
          setCards([...loaded.cards]);
          setStats(prev => ({ ...prev, totalCards: loaded.cards.length }));
        } else {
          navigate('/');
        }
      }
    };
    loadCollection();
  }, [id, navigate]);

  if (!collection || cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (level: KnowledgeLevel) => {
    // Обновляем статистику
    const newStats = { ...stats };
    switch (level) {
      case KnowledgeLevel.DONT_KNOW:
        newStats.dontKnow++;
        break;
      case KnowledgeLevel.FORGOT:
        newStats.forgot++;
        break;
      case KnowledgeLevel.REMEMBER:
        newStats.remember++;
        break;
      case KnowledgeLevel.KNOW:
        newStats.know++;
        break;
    }
    setStats(newStats);

    // Обновляем SRS данные карточки
    const updatedCard = updateSRSData(currentCard, level);
    const updatedCards = collection.cards.map(card =>
      card.id === updatedCard.id ? updatedCard : card
    );

    const updatedCollection = {
      ...collection,
      cards: updatedCards,
      lastStudied: new Date()
    };

    await updateCollection(updatedCollection);
    setCollection(updatedCollection);

    // Переходим к следующей карточке
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Сессия завершена - показываем статистику
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setStats(prev => ({ ...prev, duration }));
      
      // Сохраняем статистику в Firestore
      if (user) {
        try {
          await updateFlashcardStats(user.uid, cards.length, duration);
          const totalCards = collection.cards.length;
          await checkAndUnlockAchievements(user.uid, totalCards);
        } catch (error) {
          console.error('Error updating stats:', error);
        }
      }
      
      setShowStats(true);
    }
  };

  const handleShuffle = () => {
    if (window.confirm('Перемешать карточки? Текущий прогресс не сохранится.')) {
      const shuffled = [...collection.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setCurrentIndex(0);
      setIsFlipped(false);
      setStats({
        totalCards: collection.cards.length,
        dontKnow: 0,
        forgot: 0,
        remember: 0,
        know: 0,
        duration: 0
      });
    }
  };

  const handleRestart = () => {
    setCards([...collection.cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setStats({
      totalCards: collection.cards.length,
      dontKnow: 0,
      forgot: 0,
      remember: 0,
      know: 0,
      duration: 0
    });
    setShowStats(false);
  };

  return (
    <div>
      {/* Заголовок и навигация */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center"
        >
          ← Назад к коллекциям
        </button>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {collection.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Режим: Флешкарточки
            </p>
          </div>

          <button
            onClick={handleShuffle}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="Перемешать карточки"
          >
            🔀 Перемешать
          </button>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Карточка {currentIndex + 1} из {cards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Флешкарточка */}
      <div className="flex justify-center mb-8">
        <Flashcard
          card={currentCard}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </div>

      {/* Кнопки оценки (показываются только когда карточка перевернута) */}
      {isFlipped && (
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
            Насколько хорошо вы знаете это слово?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleRating(KnowledgeLevel.DONT_KNOW)}
              className="px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md"
            >
              <div className="text-2xl mb-1">😕</div>
              <div>Не знаю</div>
            </button>

            <button
              onClick={() => handleRating(KnowledgeLevel.FORGOT)}
              className="px-6 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md"
            >
              <div className="text-2xl mb-1">🤔</div>
              <div>Забыл</div>
            </button>

            <button
              onClick={() => handleRating(KnowledgeLevel.REMEMBER)}
              className="px-6 py-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md"
            >
              <div className="text-2xl mb-1">🙂</div>
              <div>Помню</div>
            </button>

            <button
              onClick={() => handleRating(KnowledgeLevel.KNOW)}
              className="px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all hover:scale-105 shadow-md"
            >
              <div className="text-2xl mb-1">😊</div>
              <div>Знаю</div>
            </button>
          </div>
        </div>
      )}

      {/* Подсказка если карточка не перевернута */}
      {!isFlipped && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          Нажмите на карточку, чтобы увидеть перевод и информацию
        </p>
      )}

      {/* Модальное окно со статистикой */}
      <FlashcardStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate('/')}
        onRestart={handleRestart}
      />
    </div>
  );
}
