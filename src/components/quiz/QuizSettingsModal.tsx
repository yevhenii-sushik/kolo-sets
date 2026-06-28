import { useState, useEffect } from "react";
import { QuizSettings, TaskType } from "../../types";
import { useI18n } from "../../contexts/I18nContext";

interface QuizSettingsModalProps {
  isOpen: boolean;
  settings: QuizSettings;
  onClose: () => void;
  onSave: (settings: QuizSettings) => void;
}

const ALL_TASK_TYPES = [
  TaskType.WORD_BY_TRANSLATION,
  TaskType.TRANSLATION_BY_WORD,
  TaskType.WORD_BY_EXPLANATION,
  TaskType.WRITE_WORD_BY_TRANSLATION,
  TaskType.WRITE_WORD_BY_EXPLANATION,
  TaskType.MATCHING,
];

const TYPE_ICONS: Record<TaskType, string> = {
  [TaskType.WORD_BY_TRANSLATION]: "📝",
  [TaskType.TRANSLATION_BY_WORD]: "🔤",
  [TaskType.WORD_BY_EXPLANATION]: "💡",
  [TaskType.WRITE_WORD_BY_TRANSLATION]: "✍️",
  [TaskType.WRITE_WORD_BY_EXPLANATION]: "✍️",
  [TaskType.MATCHING]: "🎯",
};

export default function QuizSettingsModal({
  isOpen,
  settings,
  onClose,
  onSave,
}: QuizSettingsModalProps) {
  const { t } = useI18n();
  const [localSettings, setLocalSettings] = useState<QuizSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const qs = t.words.quiz.settings;

  const toggleTaskType = (type: TaskType) => {
    const next = localSettings.enabledTaskTypes.includes(type)
      ? localSettings.enabledTaskTypes.filter(t => t !== type)
      : [...localSettings.enabledTaskTypes, type];
    if (next.length > 0) setLocalSettings({ enabledTaskTypes: next });
  };

  return (
    <div className="fixed inset-0 z-150 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-[#1A1714]/40 dark:bg-black/50 backdrop-blur-xl" aria-hidden />

      <div className="relative w-block max-w-2xl w-full max-h-[85dvh] sm:max-h-[88vh] overflow-y-auto shadow-xl">
        <div className="p-5 sm:p-6 md:p-8">
          <h2 className="u-title text-xl sm:text-2xl font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-1">
            {qs.title}
          </h2>
          <p className="text-[12px] sm:text-[13px] font-medium text-[#7A756E] mb-5">
            {qs.subtitle}
          </p>

          <div className="space-y-2 sm:space-y-3 mb-5">
            {ALL_TASK_TYPES.map(type => {
              const isEnabled = localSettings.enabledTaskTypes.includes(type);
              const typeKey = type as keyof typeof qs.types;
              const descKey = type as keyof typeof qs.typeDescs;
              return (
                <label
                  key={type}
                  className={`flex items-start p-3 sm:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isEnabled
                      ? "border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15]"
                      : "border-[#E0DBD3] dark:border-[#2E2C29] bg-[#F5F2ED] dark:bg-[#141312]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleTaskType(type)}
                    className="mt-1 w-4 h-4 accent-[#FF5733] shrink-0"
                  />
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base shrink-0">{TYPE_ICONS[type]}</span>
                      <span className="u-title font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm truncate">
                        {qs.types[typeKey]}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-[12px] text-[#7A756E] leading-snug">
                      {qs.typeDescs[descKey]}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {localSettings.enabledTaskTypes.length === 0 && (
            <div className="mb-5 p-4 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/30 rounded-2xl">
              <p className="text-[13px] font-medium text-[#FF5733]">
                ⚠️ {qs.minOneType}
              </p>
            </div>
          )}

          <div className="mb-5 p-4 g-block rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29]">
            <p className="text-[13px] font-medium text-[#1A1714] dark:text-[#F0EDE8]">
              💡 {qs.tip}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[#1A1714] dark:text-[#F0EDE8] hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-2xl font-bold text-sm transition-colors"
            >
              {qs.cancel}
            </button>
            <button
              onClick={() => localSettings.enabledTaskTypes.length > 0 && onSave(localSettings)}
              disabled={localSettings.enabledTaskTypes.length === 0}
              className="px-5 py-2.5 bg-[#FF5733] hover:bg-[#E54D2A] disabled:bg-[#B5B0A8] text-white rounded-2xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
            >
              {qs.apply}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
