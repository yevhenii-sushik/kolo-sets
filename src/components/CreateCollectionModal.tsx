import { useState } from 'react';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateCollectionModal({ 
  isOpen, 
  onClose, 
  onCreate 
}: CreateCollectionModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101828fa]/20 backdrop-blur-sm dark:bg-[#F9FAFBfa]/10 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-4xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Создать новую коллекцию
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="collection-name" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Название коллекции
            </label>
            <input
              type="text"
              id="collection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Английский - Базовые слова"
              className="w-full mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-colors disabled:cursor-not-allowed"
            >
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
