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

    if (isMatched) return 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E] opacity-40 cursor-default';
    if (isWrong) return 'border-red-500 bg-red-500/10 text-red-500';
    if (isSelected) return 'border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733]';
    return 'border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] cursor-pointer';
  };

  const translationClass = (pairWord: string, translation: string) => {
    const isMatched = matchedWords.has(pairWord);
    const isWrong = wrongTranslation === translation;
    const canInteract = !!selectedWord && !isMatched;

    if (isMatched) return 'border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E] opacity-40 cursor-default';
    if (isWrong) return 'border-red-500 bg-red-500/10 text-red-500';
    if (!canInteract) return 'border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] text-[#B5B0A8] cursor-default';
    return 'border-[#E0DBD3] dark:border-[#2E2C29] bg-white dark:bg-[#1A1917] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] cursor-pointer';
  };

  return (
    <div className="relative w-block p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] rounded-full text-[11px] font-black uppercase tracking-[0.12em]">
          🎯 {t.words.quiz.matching.title}
        </span>
        <p className="text-xs font-medium text-[#B5B0A8] mt-2">
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
              className={`min-h-11 w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border-2 text-sm sm:text-base font-bold text-left leading-tight transition-colors ${wordClass(word)}`}
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
              className={`min-h-11 w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl border-2 text-sm sm:text-base font-bold text-left leading-tight transition-colors ${translationClass(pairWord, translation)}`}
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
              className={`h-1.5 rounded-full transition-all duration-300 ${i < matchedWords.size ? 'w-5 bg-[#22C55E]' : 'w-1.5 bg-[#E0DBD3] dark:bg-[#2E2C29]'}`}
            />
          ))}
        </div>
        <span className="sub-title">
          {matchedWords.size} / {pairs.length} {t.words.quiz.matching.progress}
        </span>
      </div>

      {/* Completion overlay */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#1A1917]/80 backdrop-blur-sm rounded-[2.5rem]"
        >
          <div className="text-center">
            <CheckCircle2 size={48} className="text-[#22C55E] mx-auto mb-3" />
            <p className="u-title text-xl font-black text-[#22C55E]">
              {t.words.quiz.matching.complete}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
