import { useState, useEffect } from "react";
import { QuizSettings, TaskType } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { Alert, Button, Modal, Text, cx } from "../../ui";

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

// Типы заданий теста; хотя бы один должен остаться включённым
export default function QuizSettingsModal({ isOpen, settings, onClose, onSave }: QuizSettingsModalProps) {
  const { t } = useI18n();
  const qs = t.words.quiz.settings;
  const [local, setLocal] = useState<QuizSettings>(settings);

  useEffect(() => {
    setLocal(settings);
  }, [settings, isOpen]);

  const toggle = (type: TaskType) => {
    const next = local.enabledTaskTypes.includes(type) ? local.enabledTaskTypes.filter((x) => x !== type) : [...local.enabledTaskTypes, type];
    if (next.length > 0) setLocal({ enabledTaskTypes: next });
  };
  const empty = local.enabledTaskTypes.length === 0;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={qs.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {qs.cancel}
          </Button>
          <Button onClick={() => !empty && onSave(local)} disabled={empty}>
            {qs.apply}
          </Button>
        </>
      }
    >
      <Text size="sm" tone="muted" className="-mt-2 mb-4">
        {qs.subtitle}
      </Text>
      <div className="grid gap-2">
        {ALL_TASK_TYPES.map((type) => {
          const on = local.enabledTaskTypes.includes(type);
          return (
            <label
              key={type}
              className={cx(
                "flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-3.5 transition-colors",
                on ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/40",
              )}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(type)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-accent" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{qs.types[type as keyof typeof qs.types]}</span>
                <span className="block text-xs leading-snug text-muted">{qs.typeDescs[type as keyof typeof qs.typeDescs]}</span>
              </span>
            </label>
          );
        })}
      </div>
      {empty && (
        <Alert tone="warning" className="mt-4">
          {qs.minOneType}
        </Alert>
      )}
      <Text size="sm" tone="muted" className="mt-4">
        {qs.tip}
      </Text>
    </Modal>
  );
}
