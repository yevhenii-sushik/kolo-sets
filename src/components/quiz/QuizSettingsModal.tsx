import { useState, useEffect } from "react";
import { QuizSettings, TaskType } from "../../types";
import { getTaskTypeName } from "../../utils/quizGenerator";

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
  onSave,
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
    TaskType.WRITE_WORD_BY_EXPLANATION,
  ];

  const toggleTaskType = (type: TaskType) => {
    const newEnabledTypes = localSettings.enabledTaskTypes.includes(type)
      ? localSettings.enabledTaskTypes.filter((t) => t !== type)
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
        return "📝";
      case TaskType.TRANSLATION_BY_WORD:
        return "🔤";
      case TaskType.WORD_BY_EXPLANATION:
        return "💡";
      case TaskType.WRITE_WORD_BY_TRANSLATION:
      case TaskType.WRITE_WORD_BY_EXPLANATION:
        return "✍️";
      default:
        return "❓";
    }
  };

  const getTaskDescription = (type: TaskType): string => {
    switch (type) {
      case TaskType.WORD_BY_TRANSLATION:
        return "Выбор правильного слова из 4 вариантов по переводу";
      case TaskType.TRANSLATION_BY_WORD:
        return "Выбор правильного перевода из 4 вариантов по слову";
      case TaskType.WORD_BY_EXPLANATION:
        return "Выбор правильного слова из 4 вариантов по описанию";
      case TaskType.WRITE_WORD_BY_TRANSLATION:
        return "Написать слово самостоятельно по переводу";
      case TaskType.WRITE_WORD_BY_EXPLANATION:
        return "Написать слово самостоятельно по описанию";
      default:
        return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-[#1A1714]/40 dark:bg-black/50 backdrop-blur-xl"
        aria-hidden
      />

      <div className="relative w-block max-w-2xl w-full max-h-[85dvh] sm:max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="p-4 sm:p-6 md:p-8">
          <h2 className="u-title text-xl sm:text-2xl font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-1">
            Настройки Quiz
          </h2>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#7A756E] mb-4 sm:mb-6">
            Выберите типы заданий, которые будут использоваться в Quiz
          </p>

          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            {allTaskTypes.map((type) => {
              const isEnabled = localSettings.enabledTaskTypes.includes(type);
              return (
                <label
                  key={type}
                  className={`flex items-start p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${
                    isEnabled
                      ? "border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15]"
                      : "border-[#E0DBD3] dark:border-[#2E2C29] bg-[#F5F2ED] dark:bg-[#141312]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleTaskType(type)}
                    className="mt-1 w-5 h-5 text-[#FF5733] border-[#E0DBD3] rounded focus:ring-[#FF5733]"
                  />
                  <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-lg sm:text-xl shrink-0">
                        {getTaskIcon(type)}
                      </span>
                      <span className="u-title font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm sm:text-base truncate">
                        {getTaskTypeName(type)}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[13px] text-[#7A756E]">
                      {getTaskDescription(type)}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {localSettings.enabledTaskTypes.length === 0 && (
            <div className="mb-6 p-4 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/30 rounded-2xl">
              <p className="text-[13px] font-medium text-[#FF5733]">
                ⚠️ Выберите хотя бы один тип задания
              </p>
            </div>
          )}

          <div className="g-block rounded-2xl p-5 mb-6 border border-[#E0DBD3] dark:border-[#2E2C29]">
            <p className="text-[13px] font-medium text-[#1A1714] dark:text-[#F0EDE8]">
              💡 <strong>Совет:</strong> Комбинируйте разные типы заданий для
              более эффективного изучения!
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[#1A1714] dark:text-[#F0EDE8] hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-2xl font-bold text-sm transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              disabled={localSettings.enabledTaskTypes.length === 0}
              className="px-5 py-2.5 bg-[#FF5733] hover:bg-[#E54D2A] disabled:bg-[#B5B0A8] text-white rounded-2xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
            >
              Применить и начать заново
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
