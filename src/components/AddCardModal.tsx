import { useState, useEffect } from 'react';
import { Card } from '../types';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, 'id' | 'srsData' | 'createdAt'>) => void;
  initialData?: Card;
  title?: string;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title = 'Добавить слово'
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
    } else {
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
      if (!initialData) {
        resetForm();
      }
    }
  };

  const handleClose = () => {
    if (!initialData) {
      resetForm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Слово */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Слово <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="Например: hello"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
                autoFocus
              />
            </div>

            {/* Перевод */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Перевод <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder="Например: привет"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Часть речи */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Часть речи
              </label>
              <input
                type="text"
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value)}
                placeholder="Например: существительное, глагол..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Объяснение */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Объяснение на изучаемом языке
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Например: a greeting used when meeting someone"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Пример */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Пример использования
              </label>
              <textarea
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Например: Hello, how are you?"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {initialData ? 'Сохранить' : 'Добавить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
