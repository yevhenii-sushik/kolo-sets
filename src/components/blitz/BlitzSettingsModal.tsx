import { Check } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Modal, cx } from "../../ui";
import { BLITZ_MODES, BlitzMode, BlitzSettings } from "../../blitz/plan";

// Настройки Блица (docs/specs/perigee.md, «Блиц, шаг 2»): как спрашивать. Открываются до старта раунда:
// пауза посреди минуты ради настроек давала бы время подумать над вопросом
export default function BlitzSettingsModal({
  isOpen,
  settings,
  canListen,
  onClose,
  onChange,
}: {
  isOpen: boolean;
  settings: BlitzSettings;
  canListen: boolean; // есть голос для языка набора и звук включён
  onClose: () => void;
  onChange: (settings: BlitzSettings) => void;
}) {
  const { t } = useI18n();
  const s = t.words.blitz.settings;
  const text: Record<BlitzMode, { label: string; hint: string }> = {
    forward: { label: s.forward, hint: s.forwardHint },
    reverse: { label: s.reverse, hint: s.reverseHint },
    mixed: { label: s.mixed, hint: s.mixedHint },
    listen: { label: s.listen, hint: canListen ? s.listenHint : s.listenOff },
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={s.title} size="sm">
      <section className="grid gap-2">
        <p className="text-sm font-semibold text-fg">{s.mode}</p>
        <div role="radiogroup" aria-label={s.mode} className="grid gap-2">
          {BLITZ_MODES.map((mode) => {
            const active = settings.mode === mode;
            const disabled = mode === "listen" && !canListen;
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => onChange({ mode })}
                className={cx(
                  "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-55",
                  active ? "border-accent bg-accent-soft" : "border-transparent bg-inset hover:border-accent/40 disabled:hover:border-transparent",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{text[mode].label}</span>
                  <span className="block text-xs text-muted">{text[mode].hint}</span>
                </span>
                {active && <Check size={18} className="shrink-0 text-accent-ink" />}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{s.recordNote}</p>
      </section>
    </Modal>
  );
}
