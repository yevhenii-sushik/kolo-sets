import { Card, TaskType, QuizSettings } from '../types';

export interface QuizQuestion {
  type: TaskType;
  question: string;
  options?: string[]; // Для вопросов с выбором
  correctAnswer: string;
  card: Card;
}

// Генерация вопросов для Quiz
export const generateQuizQuestions = (
  cards: Card[],
  settings: QuizSettings
): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];
  const enabledTypes = settings.enabledTaskTypes;

  // Для каждой карточки генерируем случайный тип вопроса из включенных
  cards.forEach(card => {
    const randomType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
    const question = generateQuestion(card, randomType, cards);
    if (question) {
      questions.push(question);
    }
  });

  // Перемешиваем вопросы
  return questions.sort(() => Math.random() - 0.5);
};

// Генерация одного вопроса
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

// 1. Выбрать правильное слово к переводу
const generateWordByTranslation = (card: Card, allCards: Card[]): QuizQuestion => {
  const options = generateOptions(card.word, allCards.map(c => c.word));
  
  return {
    type: TaskType.WORD_BY_TRANSLATION,
    question: `Какое слово означает "${card.translation}"?`,
    options,
    correctAnswer: card.word,
    card
  };
};

// 2. Выбрать правильный перевод по слову
const generateTranslationByWord = (card: Card, allCards: Card[]): QuizQuestion => {
  const options = generateOptions(card.translation, allCards.map(c => c.translation));
  
  return {
    type: TaskType.TRANSLATION_BY_WORD,
    question: `Как переводится слово "${card.word}"?`,
    options,
    correctAnswer: card.translation,
    card
  };
};

// 3. Выбрать правильное слово по описанию
const generateWordByExplanation = (card: Card, allCards: Card[]): QuizQuestion | null => {
  if (!card.explanation) return null;
  
  const options = generateOptions(card.word, allCards.map(c => c.word));
  
  return {
    type: TaskType.WORD_BY_EXPLANATION,
    question: `Какое слово подходит к описанию: "${card.explanation}"?`,
    options,
    correctAnswer: card.word,
    card
  };
};

// 4. Написать слово по переводу
const generateWriteWordByTranslation = (card: Card): QuizQuestion => {
  return {
    type: TaskType.WRITE_WORD_BY_TRANSLATION,
    question: `Напишите слово, которое означает "${card.translation}"`,
    correctAnswer: card.word,
    card
  };
};

// 5. Написать слово по описанию
const generateWriteWordByExplanation = (card: Card): QuizQuestion | null => {
  if (!card.explanation) return null;
  
  return {
    type: TaskType.WRITE_WORD_BY_EXPLANATION,
    question: `Напишите слово по описанию: "${card.explanation}"`,
    correctAnswer: card.word,
    card
  };
};

// Генерация 4 вариантов ответа (1 правильный + 3 неправильных)
const generateOptions = (correctAnswer: string, allAnswers: string[]): string[] => {
  const options = [correctAnswer];
  const otherAnswers = allAnswers.filter(a => a.toLowerCase() !== correctAnswer.toLowerCase());
  
  // Добавляем 3 случайных неправильных ответа
  while (options.length < 4 && otherAnswers.length > 0) {
    const randomIndex = Math.floor(Math.random() * otherAnswers.length);
    const answer = otherAnswers[randomIndex];
    
    if (!options.includes(answer)) {
      options.push(answer);
    }
    
    otherAnswers.splice(randomIndex, 1);
  }
  
  // Если недостаточно карточек для 4 вариантов, добавляем заглушки
  while (options.length < 4) {
    options.push(`[вариант ${options.length}]`);
  }
  
  // Перемешиваем варианты
  return options.sort(() => Math.random() - 0.5);
};

// Получить название типа задания на русском
export const getTaskTypeName = (type: TaskType): string => {
  switch (type) {
    case TaskType.WORD_BY_TRANSLATION:
      return 'Слово по переводу (выбор)';
    case TaskType.TRANSLATION_BY_WORD:
      return 'Перевод по слову (выбор)';
    case TaskType.WORD_BY_EXPLANATION:
      return 'Слово по описанию (выбор)';
    case TaskType.WRITE_WORD_BY_TRANSLATION:
      return 'Написать слово по переводу';
    case TaskType.WRITE_WORD_BY_EXPLANATION:
      return 'Написать слово по описанию';
    default:
      return 'Неизвестный тип';
  }
};
