import { useState } from 'react';

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

export default function ImportCardsModal({
  isOpen,
  onClose,
  onImport
}: ImportCardsModalProps) {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onImport(text);
      setText('');
    }
  };

  const handleClose = () => {
    setText('');
    onClose();
  };

  const exampleText = `hello; привет; a greeting; Hello, how are you?; междометие
world; мир; the earth and all its people; Welcome to our world; существительное
book; книга; written work; I'm reading a book; существительное`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Импорт слов
          </h2>

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              📝 Формат импорта:
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              Каждое слово на новой строке в формате:
            </p>
            <code className="block text-xs bg-white dark:bg-gray-900 p-2 rounded border border-blue-200 dark:border-blue-800 mb-2">
              слово; перевод; объяснение; пример; часть речи
            </code>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Обязательны только первые два поля (слово и перевод)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Вставьте текст для импорта:
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={exampleText}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                autoFocus
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Будет импортировано строк: {text.trim().split('\n').filter(line => line.trim()).length}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                Импортировать
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
