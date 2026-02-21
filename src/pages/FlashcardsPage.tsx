import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Collection, Card, KnowledgeLevel, FlashcardStats } from '../types';
import { getCollection, updateCollection, updateSRSData } from '../utils/storage';
import { updateFlashcardStats } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { playSessionCompleteIfEnabled } from '../utils/sounds';
import { Shuffle, X } from 'lucide-react';
import Flashcard from '../components/Flashcard';
import FlashcardStatsModal from '../components/FlashcardStatsModal';

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [stats, setStats] = useState<FlashcardStats>({
    totalCards: 0, dontKnow: 0, forgot: 0, remember: 0, know: 0, duration: 0
  });

  const loadData = async () => {
    if (id) {
      const loaded = await getCollection(id);
      if (loaded && loaded.cards.length > 0) {
        setCollection(loaded);
        setCards([...loaded.cards]);
        setStats({
          totalCards: loaded.cards.length,
          dontKnow: 0, forgot: 0, remember: 0, know: 0, duration: 0
        });
        setCurrentIndex(0);
        setIsFlipped(false);
        setStartTime(Date.now());
        setShowStats(false);
      } else {
        navigate('/');
      }
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleRating = async (level: KnowledgeLevel) => {
    if (!isFlipped) return;

    // 1. Обновляем статистику и SRS
    const currentCard = cards[currentIndex];
    const updatedCard = updateSRSData(currentCard, level);
    
    if (collection) {
      const updatedCollection = {
        ...collection,
        cards: collection.cards.map(c => c.id === updatedCard.id ? updatedCard : c),
        lastStudied: new Date()
      };
      await updateCollection(updatedCollection);
    }

    setStats(prev => ({
      ...prev,
      dontKnow: level === KnowledgeLevel.DONT_KNOW ? prev.dontKnow + 1 : prev.dontKnow,
      forgot: level === KnowledgeLevel.FORGOT ? prev.forgot + 1 : prev.forgot,
      remember: level === KnowledgeLevel.REMEMBER ? prev.remember + 1 : prev.remember,
      know: level === KnowledgeLevel.KNOW ? prev.know + 1 : prev.know,
    }));

    // 2. ФИКС БАГА: Сначала закрываем карту
    setIsFlipped(false);

    // 3. Ждем окончания анимации переворота (300мс), прежде чем менять слово
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        setStats(prev => ({ ...prev, duration }));
        if (user) updateFlashcardStats(user.uid, cards.length, duration);
        playSessionCompleteIfEnabled();
        setShowStats(true);
      }
    }, 200);
  };

  const handleShuffle = () => {
    if (window.confirm('Перемешать колоду?')) {
      setCards(prev => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  if (!collection || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Back button & Title */}
          
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
              title={t.back}
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                {collection.name}
              </h1>
              {/* <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                {t.flashcards.mode}
              </p> */}
            </div>
          

          {/* Shuffle button */}
          <button
            onClick={handleShuffle}
            className="p-2 md:px-4 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex items-center gap-2 flex-shrink-0"
            title={t.flashcards.shuffle}
          >
            <Shuffle size={18} />
            <span className="hidden md:inline">{t.flashcards.shuffle}</span>
          </button>
        </div>
      </div>

      {/* Progress bar - Fixed */}
      <div className="flex-shrink-0 px-4 md:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          
          <div className="whitespace-nowrap text-center text-xs md:text-sm font-bold text-gray-600 dark:text-gray-400 min-w-[40px]">
            {currentIndex + 1} / {cards.length}
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="whitespace-nowrap text-center text-xs md:text-sm font-black text-purple-600 dark:text-purple-400 min-w-[40px]">
            {Math.round(progress)}%
          </div>

        </div>
      </div>

      {/* Main Card Area */}
      <main className="flex-1 flex items-center justify-center px-6 py-4 relative">
        <div className="w-full max-w-5xl">
          <Flashcard 
            card={currentCard} 
            isFlipped={isFlipped} 
            onFlip={() => setIsFlipped(!isFlipped)} 
          />
        </div>
      </main>

      {/* Buttons - Fixed at bottom */}
      {/* 4. Нижняя панель с кнопками: фиксированная высота внизу */}
      <div className="shrink-0 pb-10 mx-6">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          {isFlipped ? "How well do you know this word?" : "Click on the card to see the information"}
        </p>
        
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Универсальная функция для рендера кнопок, чтобы не дублировать код */}
          {[
            { level: KnowledgeLevel.DONT_KNOW, label: 'Не знаю', emoji: '😕', color: 'bg-red-600' },
            { level: KnowledgeLevel.FORGOT, label: 'Забыл', emoji: '🤔', color: 'bg-orange-600' },
            { level: KnowledgeLevel.REMEMBER, label: 'Помню', emoji: '🙂', color: 'bg-blue-600' },
            { level: KnowledgeLevel.KNOW, label: 'Знаю', emoji: '😊', color: 'bg-green-600' }
          ].map((btn) => (
            <button
              key={btn.level}
              disabled={!isFlipped}
              onClick={() => handleRating(btn.level)}
              className={`flex flex-col items-center justify-center py-4 rounded-[2rem] transition-all shadow-xl active:scale-95 ${
                isFlipped 
                  ? `${btn.color} text-white scale-100 hover:brightness-110` 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-40 scale-95 grayscale cursor-not-allowed'
              }`}
            >
              <span className="text-xl md:text-2xl mb-1">{btn.emoji}</span>
              <span className="text-xs md:text-sm">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Модальное окно со статистикой */}
      <FlashcardStatsModal isOpen={showStats} stats={stats} onClose={() => navigate('/')} onRestart={loadData} />
    </div>
  );
}
