import { useState, useEffect, useRef } from 'react';
import { TaskType } from '../../types';
import { QuizQuestion } from '../../utils/quizGenerator';

interface QuizQuestionProps {
  question: QuizQuestion;
  userAnswer: string;
  showFeedback: boolean;
  isCorrect: boolean;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}

export default function QuizQuestionComponent({
  question,
  userAnswer,
  showFeedback,
  isCorrect,
  onAnswer,
  onNext
}: QuizQuestionProps) {
  const [textInput, setTextInput] = useState('');
  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    setTextInput('');
  }, [question]);

  const isWriteType =
    question.type === TaskType.WRITE_WORD_BY_TRANSLATION ||
    question.type === TaskType.WRITE_WORD_BY_EXPLANATION;

  const handleSubmitText = () => {
    if (textInput.trim()) {
      lastSubmitTimeRef.current = Date.now();
      onAnswer(textInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && textInput.trim() && !showFeedback) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmitText();
    }
  };

  // Enter для "Следующий вопрос" при показе feedback (игнорируем Enter сразу после проверки)
  useEffect(() => {
    if (!showFeedback) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (Date.now() - lastSubmitTimeRef.current < 300) return; // игнорируем Enter, который только что отправил ответ
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFeedback, onNext]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Вопрос — w-block стиль */}
      <div className="w-block p-4 sm:p-6 md:p-8">
        <div className="text-center mb-4 sm:mb-6">
          <span className="inline-block px-4 py-2 bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] rounded-full text-[11px] font-bold uppercase tracking-[0.12em] mb-4">
            {getTypeLabel(question.type)}
          </span>
          <h3 className="u-title text-lg sm:text-xl md:text-2xl font-bold text-[#1A1714] dark:text-[#F0EDE8]">
            {question.question}
          </h3>
        </div>

        {/* Варианты ответа (для вопросов с выбором) */}
        {question.options && !isWriteType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {question.options.map((option, index) => {
              let buttonClass = 'w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-xl sm:rounded-2xl transition-all border-2 ';

              if (showFeedback) {
                if (option === question.correctAnswer) {
                  buttonClass += 'bg-[#22C55E]/10 dark:bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]';
                } else if (option === userAnswer) {
                  buttonClass += 'bg-red-500/10 dark:bg-red-500/20 border-red-600 text-red-600';
                } else {
                  buttonClass += 'bg-[#EDEAE4] dark:bg-[#242220] border-[#E0DBD3] dark:border-[#2E2C29] text-[#B5B0A8]';
                }
              } else {
                buttonClass += 'bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15]';
              }

              return (
                <button
                  key={index}
                  onClick={() => !showFeedback && onAnswer(option)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  {option}
                  {showFeedback && option === question.correctAnswer && ' ✓'}
                  {showFeedback && option === userAnswer && option !== question.correctAnswer && ' ✗'}
                </button>
              );
            })}
          </div>
        )}

        {/* Поле ввода (для вопросов с вводом текста) */}
        {isWriteType && (
          <div>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showFeedback}
              placeholder="Введите ответ..."
              className="w-full px-6 py-4 text-lg border-2 border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl focus:ring-2 focus:ring-[#FF5733] focus:border-transparent bg-[#F5F2ED] dark:bg-[#141312] text-[#1A1714] dark:text-[#F0EDE8] disabled:opacity-50"
              autoFocus
            />

            {!showFeedback && (
              <button
                onClick={handleSubmitText}
                disabled={!textInput.trim()}
                className="w-full mt-4 px-6 py-3 bg-[#FF5733] hover:bg-[#E54D2A] disabled:bg-[#B5B0A8] text-white rounded-2xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
              >
                Проверить
              </button>
            )}
          </div>
        )}

        {/* Обратная связь */}
        {showFeedback && (
          <div className="mt-4 sm:mt-6 text-center">
            {isCorrect ? (
              <div className="p-4 sm:p-5 bg-[#22C55E]/10 dark:bg-[#22C55E]/20 border-2 border-[#22C55E] rounded-xl sm:rounded-2xl">
                <div className="text-4xl mb-2">✓</div>
                <div className="u-title text-xl font-bold text-[#22C55E]">
                  Правильно!
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-red-500/10 dark:bg-red-500/20 border-2 border-red-600 rounded-xl sm:rounded-2xl">
                <div className="text-4xl mb-2">✗</div>
                <div className="u-title text-xl font-bold text-red-600 mb-2">
                  Неправильно
                </div>
                <div className="text-[#1A1714] dark:text-[#F0EDE8]">
                  Правильный ответ: <strong>{question.correctAnswer}</strong>
                </div>
                {isWriteType && (
                  <div className="text-[#7A756E] mt-2">
                    Ваш ответ: <strong>{userAnswer}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Дополнительная информация — g-block стиль */}
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 g-block rounded-xl sm:rounded-2xl text-left">
              <div className="sub-title mb-3">Дополнительная информация:</div>
              <div className="space-y-2">
                <p className="text-[#1A1714] dark:text-[#F0EDE8]">
                  <strong>Слово:</strong> {question.card.word}
                </p>
                <p className="text-[#1A1714] dark:text-[#F0EDE8]">
                  <strong>Перевод:</strong> {question.card.translation}
                </p>
                {question.card.explanation && (
                  <p className="text-[#1A1714] dark:text-[#F0EDE8]">
                    <strong>Объяснение:</strong> {question.card.explanation}
                  </p>
                )}
                {question.card.example && (
                  <p className="text-[#1A1714] dark:text-[#F0EDE8] italic">
                    <strong>Пример</strong> {question.card.example}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onNext}
              className="mt-4 sm:mt-6 w-full px-4 py-3 sm:py-4 bg-[#FF5733] hover:bg-[#E54D2A] text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-colors"
            >
              Следующий вопрос →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type: TaskType): string {
  switch (type) {
    case TaskType.WORD_BY_TRANSLATION:
      return '📝 Выбор слова по переводу';
    case TaskType.TRANSLATION_BY_WORD:
      return '🔤 Выбор перевода по слову';
    case TaskType.WORD_BY_EXPLANATION:
      return '💡 Выбор слова по описанию';
    case TaskType.WRITE_WORD_BY_TRANSLATION:
      return '✍️ Написать слово по переводу';
    case TaskType.WRITE_WORD_BY_EXPLANATION:
      return '✍️ Написать слово по описанию';
    default:
      return 'Вопрос';
  }
}
