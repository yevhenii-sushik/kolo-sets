import { Card } from '../types';

interface FlashcardProps {
  card: Card;
  isFlipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className={`flip-card w-full max-w-2xl ${isFlipped ? 'flipped' : ''}`}
      onClick={onFlip}
    >
      <div className="flip-card-inner relative w-full h-104 cursor-pointer">
        {/* Передняя сторона - Слово */}
        <div className="flip-card-front absolute w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 dark:from-blue-600 dark:to-blue-900 rounded-4xl shadow-2xl flex items-center justify-center p-8 border-4 border-white dark:border-gray-700">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-4">
                {card.word}
              </div>
              {card.partOfSpeech && (
                <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm">
                  {card.partOfSpeech}
                </div>
              )}
              <div className="mt-8 text-white/80 text-sm">
                Нажмите, чтобы перевернуть
              </div>
            </div>
          </div>
        </div>

        {/* Задняя сторона - Вся информация */}
        <div className="flip-card-back absolute w-full h-full">
          <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 dark:from-green-600 dark:to-green-900 rounded-4xl shadow-2xl p-8 border-3 border-white dark:border-gray-700 overflow-y-auto">
            <div className="text-white">
              {/* Слово сверху для контекста */}
              <div className='flex justify-center'>
                <div className="text-3xl font-bold mr-2 mb-6 text-center opacity-80">
                  {card.word}
                </div>
                {/* Часть речи внизу */}
                {card.partOfSpeech && (
                  <div className="text-center">
                    <span className="inline-block ml-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {card.partOfSpeech}
                    </span>
                  </div>
                )}
              </div>
              {/* Перевод */}
              <div className="mb-2 bg-white/10 backdrop-blur-sm rounded-3xl p-4">
                <div className="text-sm opacity-80 mb-1">Перевод:</div>
                <div className="text-2xl font-bold">{card.translation}</div>
              </div>

              {/* Объяснение */}
              {card.explanation && (
                <div className="mb-2 bg-white/10 backdrop-blur-sm rounded-3xl p-4">
                  <div className="text-sm opacity-80 mb-1">Объяснение:</div>
                  <div className="text-lg">{card.explanation}</div>
                </div>
              )}

              {/* Пример */}
              {card.example && (
                <div className="mb-2 bg-white/10 backdrop-blur-sm rounded-3xl p-4">
                  <div className="text-sm opacity-80 mb-1">Пример:</div>
                  <div className="text-lg italic">{card.example}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
