import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { MatchingPair } from '../../utils/quizGenerator';

interface MatchingExerciseProps {
  pairs: MatchingPair[];
  onComplete: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MatchingExercise({ pairs, onComplete }: MatchingExerciseProps) {
  const { t } = useI18n();

  const [shuffledWords] = useState(() => shuffle(pairs));
  const [shuffledTranslations] = useState(() => shuffle(pairs));

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set());
  const [wrongWord, setWrongWord] = useState<string | null>(null);
  const [wrongTranslation, setWrongTranslation] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (matchedWords.size === pairs.length) {
      setIsComplete(true);
      const timer = setTimeout(() => onComplete(), 700);
      return () => clearTimeout(timer);
    }
  }, [matchedWords, pairs.length, onComplete]);

  const handleWordClick = (word: string) => {
    if (matchedWords.has(word) || isComplete) return;
    setSelectedWord(prev => prev === word ? null : word);
    setWrongWord(null);
    setWrongTranslation(null);
  };

  const handleTranslationClick = (translation: string, pairWord: string) => {
    if (matchedWords.has(pairWord) || isComplete) return;
    if (!selectedWord) return;

    const isCorrect = pairs.find(p => p.word === selectedWord)?.translation === translation;

    if (isCorrect) {
      setMatchedWords(prev => new Set([...prev, selectedWord]));
      setSelectedWord(null);
    } else {
      setWrongWord(selectedWord);
      setWrongTranslation(translation);
      setTimeout(() => {
        setSelectedWord(null);
        setWrongWord(null);
        setWrongTranslation(null);
      }, 600);
    }
  };

  const wordClass = (word: string) => {
    const isMatched = matchedWords.has(word);
    const isSelected = selectedWord === word;
    const isWrong = wrongWord === word;

    if (isMatched) return 'border-success bg-success-soft text-success opacity-50 cursor-default';
    if (isWrong) return 'border-danger bg-danger-soft text-danger';
    if (isSelected) return 'border-accent bg-accent-soft text-accent-ink';
    return 'border-line bg-surface text-fg hover:border-accent/50 cursor-pointer';
  };

  const translationClass = (pairWord: string, translation: string) => {
    const isMatched = matchedWords.has(pairWord);
    const isWrong = wrongTranslation === translation;
    const canInteract = !!selectedWord && !isMatched;

    if (isMatched) return 'border-success bg-success-soft text-success opacity-50 cursor-default';
    if (isWrong) return 'border-danger bg-danger-soft text-danger';
    if (!canInteract) return 'border-line bg-surface text-muted cursor-default';
    return 'border-line bg-surface text-fg hover:border-accent/50 cursor-pointer';
  };

  return (
    <div className="relative mx-auto max-w-2xl">
      {/* Заголовок и подсказка: сначала слово, потом перевод */}
      <div className="mb-5 grid gap-1 text-center">
        <h2 className="font-display text-2xl font-extrabold text-fg">{t.words.quiz.matching.title}</h2>
        <p className="text-sm text-muted">
          {selectedWord
            ? t.words.quiz.matching.hint.split(',')[1]?.trim() || t.words.quiz.matching.hint
            : t.words.quiz.matching.hint.split(',')[0]?.trim() || t.words.quiz.matching.hint}
        </p>
      </div>

      {/* Pairs grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Words column */}
        <div className="flex flex-col gap-2">
          {shuffledWords.map(({ word }) => (
            <motion.button
              key={word}
              onClick={() => handleWordClick(word)}
              disabled={matchedWords.has(word) || isComplete}
              animate={wrongWord === word ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`min-h-12 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold leading-tight transition-colors ${wordClass(word)}`}
            >
              {word}
            </motion.button>
          ))}
        </div>

        {/* Translations column */}
        <div className="flex flex-col gap-2">
          {shuffledTranslations.map(({ word: pairWord, translation }) => (
            <motion.button
              key={translation}
              onClick={() => handleTranslationClick(translation, pairWord)}
              disabled={matchedWords.has(pairWord) || isComplete}
              animate={wrongTranslation === translation ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className={`min-h-12 w-full rounded-2xl border-2 px-4 py-3 text-left text-base font-semibold leading-tight transition-colors ${translationClass(pairWord, translation)}`}
            >
              {translation}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-1.5">
          {pairs.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i < matchedWords.size ? 'w-5 bg-success' : 'w-1.5 bg-track'}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted tabular-nums">
          {matchedWords.size} / {pairs.length} {t.words.quiz.matching.progress}
        </span>
      </div>

      {/* Completion overlay */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center rounded-4xl bg-bg/80 backdrop-blur-sm"
        >
          <div className="text-center">
            <CheckCircle2 size={48} className="text-success mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-success">
              {t.words.quiz.matching.complete}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
