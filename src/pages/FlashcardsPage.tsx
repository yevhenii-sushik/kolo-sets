import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card, KnowledgeLevel, FlashcardStats } from '../types';
import { getCollection, updateCollection, updateSRSData } from '../utils/storage';
import { ArrowLeft, ArrowUpDown} from 'lucide-react';
import Flashcard from '../components/Flashcard';
import FlashcardStatsModal from '../components/FlashcardStatsModal';

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    if (id) {
      const loaded = getCollection(id);
      if (loaded && loaded.cards.length > 0) {
        setCollection(loaded);
        setCards([...loaded.cards]);
        setStats(prev => ({ ...prev, totalCards: loaded.cards.length }));
      } else {
        navigate('/');
      }
    }
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

  const handleRating = (level: KnowledgeLevel) => {
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

    updateCollection(updatedCollection);
    setCollection(updatedCollection);

    // Переходим к следующей карточке
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      // Сессия завершена - показываем статистику
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setStats(prev => ({ ...prev, duration }));
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
    // 1. Главный контейнер на всю высоту экрана без прокрутки
    <div className="h-[85dvh] flex flex-col md:p-6 bg-white dark:bg-gray-900 overflow-hidden">
      
      {/* 2. Верхняя панель: фиксированная высота */}
      <div className="flex justify-between items-center gap-4 mb-8 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft size={25} />
        </button>

        <div className="flex-1 max-w-2xl">
          <div className="flex justify-between text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Card {currentIndex + 1} of {cards.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={handleShuffle}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
        >
          <ArrowUpDown size={25} />
        </button>
      </div>

      {/* 3. Центральная часть с карточкой: забирает всё свободное место */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-4">
        {/* Обертка для сохранения пропорций карточки */}
        <div className="w-full max-w-2xl h-full max-h-[500px]"> 
          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </div>
      </div>

      {/* 4. Нижняя панель с кнопками: фиксированная высота внизу */}
      <div className="shrink-0 pt-2 pb-4">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
          {isFlipped ? "How well do you know this word?" : "Click on the card to see the information"}
        </p>
        
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Универсальная функция для рендера кнопок, чтобы не дублировать код */}
          {[
            { level: KnowledgeLevel.DONT_KNOW, label: 'Не знаю', emoji: '😕', color: 'bg-red-600' },
            { level: KnowledgeLevel.FORGOT, label: 'Забыл', emoji: '🤔', color: 'bg-orange-600' },
            { level: KnowledgeLevel.REMEMBER, label: 'Помню', emoji: '🙂', color: 'bg-yellow-600' },
            { level: KnowledgeLevel.KNOW, label: 'Знаю', emoji: '😊', color: 'bg-green-600' }
          ].map((btn) => (
            <button
              key={btn.level}
              disabled={!isFlipped}
              onClick={() => handleRating(btn.level)}
              className={`
                flex flex-col items-center justify-center py-2 md:py-3 rounded-3xl font-medium transition-all shadow-md
                ${isFlipped ? `${btn.color} hover:scale-105 text-white` : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}
              `}
            >
              <span className="text-xl md:text-2xl mb-1">{btn.emoji}</span>
              <span className="text-xs md:text-sm">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      <FlashcardStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate('/')}
        onRestart={handleRestart}
      />
    </div>
  );
}