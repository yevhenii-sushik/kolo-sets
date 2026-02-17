import { useState } from 'react';
import { POPULAR_LANGUAGES } from '../utils/tts';
import { useI18n } from '../contexts/I18nContext';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, language: string) => void;
}

export default function CreateCollectionModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: CreateCollectionModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('nb-NO');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), language);
      setName('');
      setLanguage('nb-NO');
    }
  };

  const handleClose = () => {
    setName('');
    setLanguage('nb-NO');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t.createCollection.title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="collection-name" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t.createCollection.nameLabel}
            </label>
            <input
              type="text"
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.createCollection.namePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          <div>
            <label 
              htmlFor="collection-language" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t.createCollection.languageLabel}
            </label>
            <select
              id="collection-language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {POPULAR_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-xl transition-colors disabled:cursor-not-allowed"
            >
              {t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
