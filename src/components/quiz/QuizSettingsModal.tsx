import { Check } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Alert, Modal, cx } from "../../ui";
import { Segmented } from "../other/SettingsList";
import { QUIZ_ANSWERS, QUIZ_LENGTHS, QuizAnswers, QuizLength, QuizSettings } from "../../quiz/plan";

interface QuizSettingsModalProps {
  isOpen: boolean;
  settings: QuizSettings;
  locked: boolean; // тест уже идёт — изменения начнутся со следующего
  onClose: () => void;
  onChange: (settings: QuizSettings) => void;
}

// Настройки теста (docs/specs/perigee.md, «Тест: понятность и честность»): сколько вопросов и как отвечать.
// Раньше было пять галочек типов заданий, а «Применить» молча стирал уже отвеченное. Теперь настройки
// запоминаются на устройстве; пока не дан первый ответ, тест пересобирается сразу, потом — со следующего
export default function QuizSettingsModal({ isOpen, settings, locked, onClose, onChange }: QuizSettingsModalProps) {
  const { t } = useI18n();
  const s = t.words.quiz.settings;
  const answerText: Record<QuizAnswers, { label: string; hint: string }> = {
    choice: { label: s.choice, hint: s.choiceHint },
    type: { label: s.type, hint: s.typeHint },
    mixed: { label: s.mixed, hint: s.mixedHint },
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={s.title} size="sm">
      <div className="grid gap-6">
        {locked && <Alert tone="info">{s.nextTest}</Alert>}

        <section className="grid gap-2">
          <p className="text-sm font-semibold text-fg">{s.length}</p>
          <Segmented<string>
            label={s.length}
            value={String(settings.length)}
            options={QUIZ_LENGTHS.map((n) => ({ value: String(n), label: n === 0 ? s.all : String(n) }))}
            onChange={(v) => onChange({ ...settings, length: Number(v) as QuizLength })}
          />
        </section>

        <section className="grid gap-2">
          <p className="text-sm font-semibold text-fg">{s.answers}</p>
          <div role="radiogroup" aria-label={s.answers} className="grid gap-2">
            {QUIZ_ANSWERS.map((answers) => {
              const active = settings.answers === answers;
              return (
                <button
                  key={answers}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ ...settings, answers })}
                  className={cx(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active ? "border-accent bg-accent-soft" : "border-transparent bg-inset hover:border-accent/40",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{answerText[answers].label}</span>
                    <span className="block text-xs text-muted">{answerText[answers].hint}</span>
                  </span>
                  {active && <Check size={18} className="shrink-0 text-accent-ink" />}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">{s.explanationNote}</p>
        </section>
      </div>
    </Modal>
  );
}
