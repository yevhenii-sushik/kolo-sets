import { useState, useEffect } from 'react';
import { Card } from '../types';
import { X, Type, Languages, BookOpen, Quote, Tag, Sparkles, ChevronDown } from 'lucide-react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => void;
  initialData?: Card;
  title?: string;
}

// Список стандартных частей речи (на норвежском)
const PARTS_OF_SPEECH = [
  { value: 'substantiv', label: 'Substantiv (сущ.)' },
  { value: 'verb', label: 'Verb (глагол)' },
  { value: 'adjektiv', label: 'Adjektiv (прил.)' },
  { value: 'adverb', label: 'Adverb (наречие)' },
  { value: 'pronomen', label: 'Pronomen (местоим.)' },
  { value: 'preposisjon', label: 'Preposisjon (предлог)' },
  { value: 'konjunksjon', label: 'Konjunksjon (союз)' },
  { value: 'interjeksjon', label: 'Interjeksjon (межд.)' },
];

export default function AddCardModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = 'Новое слово'
}: AddCardModalProps) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [explanation, setExplanation] = useState('');
  const [example, setExample] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');

  useEffect(() => {
    if (initialData) {
      setWord(initialData.word);
      setTranslation(initialData.translation);
      setExplanation(initialData.explanation);
      setExample(initialData.example);
      setPartOfSpeech(initialData.partOfSpeech);
    } else if (isOpen) {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setWord('');
    setTranslation('');
    setExplanation('');
    setExample('');
    setPartOfSpeech('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() && translation.trim()) {
      onSave({
        word: word.trim(),
        translation: translation.trim(),
        explanation: explanation.trim(),
        example: example.trim(),
        partOfSpeech: partOfSpeech.trim()
      });
      if (!initialData) resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Мягкий фон с блюром */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative bg-white/95 dark:bg-gray-900/95 border border-white/20 dark:border-gray-800 rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
        
        {/* Шапка */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {initialData ? 'Редактирование' : title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          {/* Секция 1: Основа */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                <Type size={14} /> Слово *
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Skrive"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white font-medium"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                <Languages size={14} /> Перевод *
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Писать"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white font-medium"
                required
              />
            </div>
          </div>

          {/* Секция 2: Глубина (Контекст) */}
          <div className="pt-4 space-y-6 border-t border-gray-50 dark:border-gray-800">
            
            {/* Часть речи из списка */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                <Tag size={14} /> Часть речи
              </label>
              <div className="relative group">
                <select
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white appearance-none cursor-pointer font-medium"
                >
                  <option value="">Не выбрано</option>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-purple-500 transition-colors">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                <BookOpen size={14} /> Объяснение (на норвежском)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="å uttrykke seg med skriftlige tegn..."
                rows={2}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                <Quote size={14} /> Пример предложения
              </label>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Jeg skriver en bok"
                rows={2}
                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all dark:text-white italic resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Футер */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] font-black tracking-wide uppercase text-sm"
            >
              {initialData ? 'Сохранить изменения' : 'Создать карточку'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}