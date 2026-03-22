import { useState, useEffect } from 'react';
import { QuizSettings, TaskType } from '../../types';
import { getTaskTypeName } from '../../utils/quizGenerator';

interface QuizSettingsModalProps {
  isOpen: boolean;
  settings: QuizSettings;
  onClose: () => void;
  onSave: (settings: QuizSettings) => void;
}

export default function QuizSettingsModal({
  isOpen,
  settings,
  onClose,
  onSave
}: QuizSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<QuizSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const allTaskTypes = [
    TaskType.WORD_BY_TRANSLATION,
    TaskType.TRANSLATION_BY_WORD,
    TaskType.WORD_BY_EXPLANATION,
    TaskType.WRITE_WORD_BY_TRANSLATION,
    TaskType.WRITE_WORD_BY_EXPLANATION
  ];

  const toggleTaskType = (type: TaskType) => {
    const newEnabledTypes = localSettings.enabledTaskTypes.includes(type)
      ? localSettings.enabledTaskTypes.filter(t => t !== type)
      : [...localSettings.enabledTaskTypes, type];

    // Должен быть включен хотя бы один тип
    if (newEnabledTypes.length > 0) {
      setLocalSettings({ enabledTaskTypes: newEnabledTypes });
    }
  };

  const handleSave = () => {
    if (localSettings.enabledTaskTypes.length > 0) {
      onSave(localSettings);
    }
  };

  const getTaskIcon = (type: TaskType): string => {
    switch (type) {
      case TaskType.WORD_BY_TRANSLATION:
        return '📝';
      case TaskType.TRANSLATION_BY_WORD:
        return '🔤';
      case TaskType.WORD_BY_EXPLANATION:
        return '💡';
      case TaskType.WRITE_WORD_BY_TRANSLATION:
      case TaskType.WRITE_WORD_BY_EXPLANATION:
        return '✍️';
      default:
        return '❓';
    }
  };

  const getTaskDescription = (type: TaskType): string => {
    switch (type) {
      case TaskType.WORD_BY_TRANSLATION:
        return 'Выбор правильного слова из 4 вариантов по переводу';
      case TaskType.TRANSLATION_BY_WORD:
        return 'Выбор правильного перевода из 4 вариантов по слову';
      case TaskType.WORD_BY_EXPLANATION:
        return 'Выбор правильного слова из 4 вариантов по описанию';
      case TaskType.WRITE_WORD_BY_TRANSLATION:
        return 'Написать слово самостоятельно по переводу';
      case TaskType.WRITE_WORD_BY_EXPLANATION:
        return 'Написать слово самостоятельно по описанию';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Настройки Quiz
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Выберите типы заданий, которые будут использоваться в Quiz
          </p>

          <div className="space-y-3 mb-6">
            {allTaskTypes.map(type => {
              const isEnabled = localSettings.enabledTaskTypes.includes(type);
              return (
                <label
                  key={type}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isEnabled
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleTaskType(type)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="ml-4 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getTaskIcon(type)}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {getTaskTypeName(type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getTaskDescription(type)}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {localSettings.enabledTaskTypes.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Выберите хотя бы один тип задания
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Совет:</strong> Комбинируйте разные типы заданий для более эффективного изучения!
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={localSettings.enabledTaskTypes.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              Применить и начать заново
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
