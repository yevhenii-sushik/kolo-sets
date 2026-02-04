import { useState, useEffect } from 'react';
import { TaskType } from '../types';
import { QuizQuestion } from '../utils/quizGenerator';

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

  useEffect(() => {
    setTextInput('');
  }, [question]);

  const isWriteType = 
    question.type === TaskType.WRITE_WORD_BY_TRANSLATION ||
    question.type === TaskType.WRITE_WORD_BY_EXPLANATION;

  const handleSubmitText = () => {
    if (textInput.trim()) {
      onAnswer(textInput.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && textInput.trim() && !showFeedback) {
      handleSubmitText();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Вопрос */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm mb-4">
            {getTypeLabel(question.type)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {question.question}
          </h3>
        </div>

        {/* Варианты ответа (для вопросов с выбором) */}
        {question.options && !isWriteType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {question.options.map((option, index) => {
              let buttonClass = 'w-full px-6 py-4 text-lg font-medium rounded-lg transition-all border-2 ';
              
              if (showFeedback) {
                if (option === question.correctAnswer) {
                  buttonClass += 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-800 dark:text-green-300';
                } else if (option === userAnswer) {
                  buttonClass += 'bg-red-100 dark:bg-red-900/30 border-red-500 text-red-800 dark:text-red-300';
                } else {
                  buttonClass += 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500';
                }
              } else {
                buttonClass += 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
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
              onKeyPress={handleKeyPress}
              disabled={showFeedback}
              placeholder="Введите ответ..."
              className="w-full px-6 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50"
              autoFocus
            />
            
            {!showFeedback && (
              <button
                onClick={handleSubmitText}
                disabled={!textInput.trim()}
                className="w-full mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Проверить
              </button>
            )}
          </div>
        )}

        {/* Обратная связь */}
        {showFeedback && (
          <div className="mt-6 text-center">
            {isCorrect ? (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg">
                <div className="text-4xl mb-2">✓</div>
                <div className="text-xl font-bold text-green-800 dark:text-green-300">
                  Правильно!
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg">
                <div className="text-4xl mb-2">✗</div>
                <div className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">
                  Неправильно
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  Правильный ответ: <strong>{question.correctAnswer}</strong>
                </div>
                {isWriteType && (
                  <div className="text-gray-600 dark:text-gray-400 mt-2">
                    Ваш ответ: <strong>{userAnswer}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Дополнительная информация:
              </div>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-white">
                  <strong>Слово:</strong> {question.card.word}
                </p>
                <p className="text-gray-900 dark:text-white">
                  <strong>Перевод:</strong> {question.card.translation}
                </p>
                {question.card.explanation && (
                  <p className="text-gray-900 dark:text-white">
                    <strong>Объяснение:</strong> {question.card.explanation}
                  </p>
                )}
                {question.card.example && (
                  <p className="text-gray-900 dark:text-white italic">
                    <strong>Пример</strong> {question.card.example}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onNext}
              className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
