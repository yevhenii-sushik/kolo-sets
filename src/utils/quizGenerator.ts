import { Card, TaskType, QuizSettings } from '../types';

export interface MatchingPair {
  word: string;
  translation: string;
}

export interface QuizQuestion {
  type: TaskType;
  question: string;
  options?: string[];
  correctAnswer: string;
  card: Card;
  pairs?: MatchingPair[]; // only for MATCHING type
}

const MATCHING_BATCH_SIZE = 6;
const MATCHING_MIN_SIZE = 4;

export const generateQuizQuestions = (
  cards: Card[],
  settings: QuizSettings
): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const enabledTypes = settings.enabledTaskTypes;
  const nonMatchingTypes = enabledTypes.filter(t => t !== TaskType.MATCHING);
  const includeMatching = enabledTypes.includes(TaskType.MATCHING);

  // Per-card questions for non-matching types
  if (nonMatchingTypes.length > 0) {
    cards.forEach(card => {
      const randomType = nonMatchingTypes[Math.floor(Math.random() * nonMatchingTypes.length)];
      const question = generateQuestion(card, randomType, cards);
      if (question) questions.push(question);
    });
  }

  // Matching rounds: batch cards into groups of MATCHING_BATCH_SIZE
  if (includeMatching && cards.length >= MATCHING_MIN_SIZE) {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    for (let i = 0; i < shuffled.length; i += MATCHING_BATCH_SIZE) {
      const group = shuffled.slice(i, Math.min(i + MATCHING_BATCH_SIZE, shuffled.length));
      if (group.length >= MATCHING_MIN_SIZE) {
        questions.push({
          type: TaskType.MATCHING,
          question: '',
          correctAnswer: 'matched',
          card: group[0],
          pairs: group.map(c => ({ word: c.word, translation: c.translation })),
        });
      }
    }
  }

  return questions.sort(() => Math.random() - 0.5);
};

const generateQuestion = (
  card: Card,
  type: TaskType,
  allCards: Card[]
): QuizQuestion | null => {
  switch (type) {
    case TaskType.WORD_BY_TRANSLATION:
      return generateWordByTranslation(card, allCards);
    case TaskType.TRANSLATION_BY_WORD:
      return generateTranslationByWord(card, allCards);
    case TaskType.WORD_BY_EXPLANATION:
      return generateWordByExplanation(card, allCards);
    case TaskType.WRITE_WORD_BY_TRANSLATION:
      return generateWriteWordByTranslation(card);
    case TaskType.WRITE_WORD_BY_EXPLANATION:
      return generateWriteWordByExplanation(card);
    default:
      return null;
  }
};

const generateWordByTranslation = (card: Card, allCards: Card[]): QuizQuestion => {
  const options = generateOptions(card.word, allCards.map(c => c.word));
  return {
    type: TaskType.WORD_BY_TRANSLATION,
    question: card.translation,
    options,
    correctAnswer: card.word,
    card
  };
};

const generateTranslationByWord = (card: Card, allCards: Card[]): QuizQuestion => {
  const options = generateOptions(card.translation, allCards.map(c => c.translation));
  return {
    type: TaskType.TRANSLATION_BY_WORD,
    question: card.word,
    options,
    correctAnswer: card.translation,
    card
  };
};

const generateWordByExplanation = (card: Card, allCards: Card[]): QuizQuestion | null => {
  if (!card.explanation) return null;
  const options = generateOptions(card.word, allCards.map(c => c.word));
  return {
    type: TaskType.WORD_BY_EXPLANATION,
    question: card.explanation,
    options,
    correctAnswer: card.word,
    card
  };
};

const generateWriteWordByTranslation = (card: Card): QuizQuestion => ({
  type: TaskType.WRITE_WORD_BY_TRANSLATION,
  question: card.translation,
  correctAnswer: card.word,
  card
});

const generateWriteWordByExplanation = (card: Card): QuizQuestion | null => {
  if (!card.explanation) return null;
  return {
    type: TaskType.WRITE_WORD_BY_EXPLANATION,
    question: card.explanation,
    correctAnswer: card.word,
    card
  };
};

const generateOptions = (correctAnswer: string, allAnswers: string[]): string[] => {
  const options = [correctAnswer];
  const pool = allAnswers.filter(a => a.toLowerCase() !== correctAnswer.toLowerCase());

  while (options.length < 4 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const answer = pool[idx];
    if (!options.includes(answer)) options.push(answer);
    pool.splice(idx, 1);
  }

  while (options.length < 4) {
    options.push(`[${options.length}]`);
  }

  return options.sort(() => Math.random() - 0.5);
};

export const getTaskTypeName = (type: TaskType | string): string => {
  switch (type) {
    case TaskType.WORD_BY_TRANSLATION: return 'Word by translation';
    case TaskType.TRANSLATION_BY_WORD: return 'Translation by word';
    case TaskType.WORD_BY_EXPLANATION: return 'Word by description';
    case TaskType.WRITE_WORD_BY_TRANSLATION: return 'Write word by translation';
    case TaskType.WRITE_WORD_BY_EXPLANATION: return 'Write word by description';
    case TaskType.MATCHING: return 'Match the pairs';
    default: return String(type);
  }
};
