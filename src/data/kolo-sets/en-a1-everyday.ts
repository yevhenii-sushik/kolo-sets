import { KoloSet } from '../../types/kolo-sets';

const a1Everyday: KoloSet = {
  id: 'en-a1-everyday',
  title: 'Everyday Life',
  description: 'Essential vocabulary for daily routines, home, and simple conversations.',
  level: 'A1',
  language: 'en',
  topic: 'Daily Life',
  cardCount: 10,
  cards: [
    { word: 'morning', translation: 'утро', partOfSpeech: 'n.', example: 'Good morning!' },
    { word: 'eat', translation: 'есть / кушать', partOfSpeech: 'v.', example: 'I eat breakfast at 8 AM.' },
    { word: 'drink', translation: 'пить', partOfSpeech: 'v.', example: 'She drinks coffee every day.' },
    { word: 'work', translation: 'работа / работать', partOfSpeech: 'n./v.', example: 'He works in an office.' },
    { word: 'sleep', translation: 'сон / спать', partOfSpeech: 'n./v.', example: 'I sleep eight hours a night.' },
    { word: 'house', translation: 'дом', partOfSpeech: 'n.', example: 'This is my house.' },
    { word: 'family', translation: 'семья', partOfSpeech: 'n.', example: 'My family is very important to me.' },
    { word: 'friend', translation: 'друг / подруга', partOfSpeech: 'n.', example: 'She is my best friend.' },
    { word: 'buy', translation: 'покупать', partOfSpeech: 'v.', example: 'I want to buy a new phone.' },
    { word: 'time', translation: 'время', partOfSpeech: 'n.', example: 'What time is it?' },
  ],
};

export default a1Everyday;
