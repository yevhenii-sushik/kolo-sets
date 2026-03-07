import { KoloSet } from '../../types/kolo-sets';

const a0Home: KoloSet = {
  id: 'en-a0-home',
  title: 'Home & Essentials',
  description: 'First words every beginner needs — greetings, numbers, colors.',
  level: 'A0',
  language: 'en',
  topic: 'Basics',
  cardCount: 20,
  cards: [
    { word: 'hello', translation: 'привет', partOfSpeech: 'excl.', example: 'Hello! How are you?' },
    { word: 'goodbye', translation: 'пока / до свидания', partOfSpeech: 'excl.', example: 'Goodbye, see you tomorrow!' },
    { word: 'yes', translation: 'да', partOfSpeech: 'adv.', example: 'Yes, I understand.' },
    { word: 'no', translation: 'нет', partOfSpeech: 'adv.', example: 'No, thank you.' },
    { word: 'please', translation: 'пожалуйста', partOfSpeech: 'adv.', example: 'One coffee, please.' },
    { word: 'thank you', translation: 'спасибо', partOfSpeech: 'phrase', example: 'Thank you for your help.' },
    { word: 'sorry', translation: 'извини / прости', partOfSpeech: 'excl.', example: 'Sorry, I am late.' },
    { word: 'water', translation: 'вода', partOfSpeech: 'n.', example: 'Can I have some water?' },
    { word: 'help', translation: 'помощь / помогать', partOfSpeech: 'n./v.', example: 'Help! I need assistance.' },
    { word: 'good', translation: 'хороший / хорошо', partOfSpeech: 'adj.', example: 'That\'s a good idea.' },
  ],
};

export default a0Home;
