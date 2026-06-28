import { useState, useEffect, useRef } from 'react';
import { TaskType } from '../../types';
import { QuizQuestion } from '../../utils/quizGenerator';
import { useI18n } from '../../contexts/I18nContext';
import MatchingExercise from './MatchingExercise';

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
  const { t } = useI18n();
  const [textInput, setTextInput] = useState('');
  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    setTextInput('');
  }, [question]);

  const isWriteType =
    question.type === TaskType.WRITE_WORD_BY_TRANSLATION ||
    question.type === TaskType.WRITE_WORD_BY_EXPLANATION;

  // Matching type renders its own self-contained component
  if (question.type === TaskType.MATCHING) {
    return (
      <MatchingExercise
        pairs={question.pairs!}
        onComplete={() => {
          onAnswer('matched');
          onNext();
        }}
      />
    );
  }

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

  // Enter to advance on feedback
  useEffect(() => {
    if (!showFeedback) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (Date.now() - lastSubmitTimeRef.current < 300) return;
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showFeedback, onNext]);

  const typeLabel = getTypeLabel(question.type, t.words.quiz);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="w-block p-4 sm:p-6 md:p-8">

        {/* Type badge + question */}
        <div className="text-center mb-5 sm:mb-6">
          <span className="inline-block px-4 py-2 bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] rounded-full text-[11px] font-black uppercase tracking-[0.12em] mb-4">
            {typeLabel}
          </span>
          <h3 className="u-title text-xl sm:text-2xl md:text-3xl font-bold text-[#1A1714] dark:text-[#F0EDE8]">
            {question.question}
          </h3>
        </div>

        {/* Choice options */}
        {question.options && !isWriteType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
            {question.options.map((option, index) => {
              let cls = 'w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg font-bold rounded-2xl transition-all border-2 text-left ';
              if (showFeedback) {
                if (option === question.correctAnswer) {
                  cls += 'bg-[#22C55E]/10 dark:bg-[#22C55E]/20 border-[#22C55E] text-[#22C55E]';
                } else if (option === userAnswer) {
                  cls += 'bg-red-500/10 dark:bg-red-500/20 border-red-500 text-red-500';
                } else {
                  cls += 'bg-[#EDEAE4] dark:bg-[#242220] border-[#E0DBD3] dark:border-[#2E2C29] text-[#B5B0A8]';
                }
              } else {
                cls += 'bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] cursor-pointer';
              }
              return (
                <button
                  key={index}
                  onClick={() => !showFeedback && onAnswer(option)}
                  disabled={showFeedback}
                  className={cls}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] shrink-0 w-4">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {showFeedback && option === question.correctAnswer && (
                      <span className="ml-auto text-[#22C55E]">✓</span>
                    )}
                    {showFeedback && option === userAnswer && option !== question.correctAnswer && (
                      <span className="ml-auto text-red-500">✗</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Write input */}
        {isWriteType && (
          <div className="space-y-3">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={showFeedback}
              placeholder={t.words.quiz.placeholder}
              className="w-full px-5 py-4 text-lg border-2 border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl focus:ring-2 focus:ring-[#FF5733] focus:border-[#FF5733] bg-white dark:bg-[#141312] text-[#1A1714] dark:text-[#F0EDE8] outline-none disabled:opacity-50 transition-colors"
              autoFocus
            />
            {!showFeedback && (
              <button
                onClick={handleSubmitText}
                disabled={!textInput.trim()}
                className="w-full py-3 bg-[#FF5733] hover:bg-[#E54D2A] disabled:bg-[#B5B0A8] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-colors disabled:cursor-not-allowed"
              >
                {t.words.quiz.check}
              </button>
            )}
          </div>
        )}

        {/* Feedback */}
        {showFeedback && (
          <div className="mt-5 sm:mt-6 space-y-3">
            {isCorrect ? (
              <div className="p-4 sm:p-5 bg-[#22C55E]/10 dark:bg-[#22C55E]/15 border-2 border-[#22C55E] rounded-2xl text-center">
                <div className="text-3xl mb-1">✓</div>
                <div className="u-title text-lg font-black text-[#22C55E]">
                  {t.words.quiz.correct}
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-red-500/10 dark:bg-red-500/15 border-2 border-red-500 rounded-2xl text-center">
                <div className="text-3xl mb-1">✗</div>
                <div className="u-title text-lg font-black text-red-500 mb-2">
                  {t.words.quiz.incorrect}
                </div>
                <p className="text-sm text-[#1A1714] dark:text-[#F0EDE8]">
                  <span className="font-medium text-[#7A756E]">{t.words.quiz.correctAnswer}</span>{' '}
                  <strong>{question.correctAnswer}</strong>
                </p>
                {isWriteType && (
                  <p className="text-sm text-[#7A756E] mt-1">
                    <span className="font-medium">{t.words.quiz.yourAnswer}</span>{' '}
                    {userAnswer}
                  </p>
                )}
              </div>
            )}

            {/* Extra card info */}
            <div className="g-block rounded-2xl p-4 space-y-2 text-left border border-[#E0DBD3] dark:border-[#2E2C29]">
              <p className="sub-title mb-3">{t.words.quiz.moreInfo}</p>
              <p className="text-sm font-bold text-[#1A1714] dark:text-[#F0EDE8]">
                {question.card.word}
                {question.card.partOfSpeech && (
                  <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-[#B5B0A8]">
                    {question.card.partOfSpeech}
                  </span>
                )}
              </p>
              <p className="text-sm text-[#7A756E]">{question.card.translation}</p>
              {question.card.explanation && (
                <p className="text-sm text-[#7A756E] pt-1 border-t border-[#E0DBD3] dark:border-[#2E2C29]">
                  {question.card.explanation}
                </p>
              )}
              {question.card.example && (
                <p className="text-sm italic text-[#B5B0A8]">"{question.card.example}"</p>
              )}
            </div>

            <button
              onClick={onNext}
              className="w-full py-3 sm:py-4 bg-[#1A1714] dark:bg-[#F0EDE8] hover:bg-[#FF5733] text-white dark:text-[#0F0E0C] dark:hover:text-white dark:hover:bg-[#FF5733] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-[0.98]"
            >
              {t.words.quiz.next}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeLabel(type: TaskType, q: { settings: { types: Record<string, string> } }): string {
  const labels: Record<string, string> = {
    [TaskType.WORD_BY_TRANSLATION]: '📝 ' + (q.settings.types[TaskType.WORD_BY_TRANSLATION] || 'Word by translation'),
    [TaskType.TRANSLATION_BY_WORD]: '🔤 ' + (q.settings.types[TaskType.TRANSLATION_BY_WORD] || 'Translation by word'),
    [TaskType.WORD_BY_EXPLANATION]: '💡 ' + (q.settings.types[TaskType.WORD_BY_EXPLANATION] || 'Word by description'),
    [TaskType.WRITE_WORD_BY_TRANSLATION]: '✍️ ' + (q.settings.types[TaskType.WRITE_WORD_BY_TRANSLATION] || 'Write word'),
    [TaskType.WRITE_WORD_BY_EXPLANATION]: '✍️ ' + (q.settings.types[TaskType.WRITE_WORD_BY_EXPLANATION] || 'Write word'),
  };
  return labels[type] || type;
}
