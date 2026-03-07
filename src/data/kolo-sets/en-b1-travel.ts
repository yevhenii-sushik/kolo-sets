import { KoloSet } from '../../types/kolo-sets';

const b1Travel: KoloSet = {
  id: 'en-b1-travel',
  title: 'Travel & Transport',
  description: 'Navigate airports, hotels, and new cities with confidence.',
  level: 'B1',
  language: 'en',
  topic: 'Travel',
  cardCount: 10,
  cards: [
    { word: 'departure', translation: 'отправление', partOfSpeech: 'n.', example: 'The departure is at 6 AM.' },
    { word: 'arrival', translation: 'прибытие', partOfSpeech: 'n.', example: 'What is the arrival time?' },
    { word: 'boarding pass', translation: 'посадочный талон', partOfSpeech: 'n.', example: 'Please show your boarding pass.' },
    { word: 'luggage', translation: 'багаж', partOfSpeech: 'n.', example: 'My luggage was lost.' },
    { word: 'reservation', translation: 'бронирование', partOfSpeech: 'n.', example: 'I have a reservation under Smith.' },
    { word: 'currency exchange', translation: 'обмен валюты', partOfSpeech: 'n.', example: 'Where is the currency exchange?' },
    { word: 'local', translation: 'местный / местный житель', partOfSpeech: 'adj./n.', example: 'Ask a local for directions.' },
    { word: 'delayed', translation: 'задержанный', partOfSpeech: 'adj.', example: 'The train is delayed by an hour.' },
    { word: 'itinerary', translation: 'маршрут / план поездки', partOfSpeech: 'n.', example: 'We planned the whole itinerary.' },
    { word: 'customs', translation: 'таможня', partOfSpeech: 'n.', example: 'You must declare items at customs.' },
  ],
};

export default b1Travel;
