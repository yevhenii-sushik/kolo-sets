import { Check } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { Modal, Switch, cx } from "../../ui";
import { Segmented } from "../other/SettingsList";
import { FlashDirection, FlashPrefs } from "../../utils/flashPrefs";

const DIRECTIONS: FlashDirection[] = ["forward", "reverse", "mixed"];

// Настройки флэшкарт прямо в тренировке: направление, порядок, озвучка (docs/specs/perigee.md,
// «Флэшкарты, шаг 2»). Меняют то, что ещё впереди, — круг заново не начинается.
// voice: можно ли озвучивать — нет голоса языка на устройстве или звук выключен в настройках приложения
export default function FlashSettingsModal({
  open,
  onClose,
  prefs,
  onChange,
  voice,
}: {
  open: boolean;
  onClose: () => void;
  prefs: FlashPrefs;
  onChange: (prefs: FlashPrefs) => void;
  voice: "ok" | "noVoice" | "soundOff";
}) {
  const { t } = useI18n();
  const s = t.words.flashcards.settings;
  const hints: Record<FlashDirection, string> = { forward: s.forwardHint, reverse: s.reverseHint, mixed: s.mixedHint };
  const speakHint = voice === "noVoice" ? s.noVoice : voice === "soundOff" ? s.soundOff : s.speakHint;

  return (
    <Modal open={open} onClose={onClose} title={s.title} size="sm">
      <div className="grid gap-6">
        <section className="grid gap-2">
          <p className="text-sm font-semibold text-fg">{s.direction}</p>
          <div role="radiogroup" aria-label={s.direction} className="grid gap-2">
            {DIRECTIONS.map((direction) => {
              const active = prefs.direction === direction;
              return (
                <button
                  key={direction}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange({ ...prefs, direction })}
                  className={cx(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active ? "border-accent bg-accent-soft" : "border-transparent bg-inset hover:border-accent/40",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{s[direction]}</span>
                    <span className="block text-xs text-muted">{hints[direction]}</span>
                  </span>
                  {active && <Check size={18} className="shrink-0 text-accent-ink" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-2">
          <p className="text-sm font-semibold text-fg">{s.order}</p>
          <Segmented
            label={s.order}
            value={prefs.shuffle ? "shuffled" : "inOrder"}
            options={[
              { value: "inOrder", label: s.inOrder },
              { value: "shuffled", label: s.shuffled },
            ]}
            onChange={(v) => onChange({ ...prefs, shuffle: v === "shuffled" })}
          />
        </section>

        <section className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">{s.speak}</p>
            <p className="text-xs text-muted">{speakHint}</p>
          </div>
          <Switch checked={prefs.speak && voice === "ok"} disabled={voice !== "ok"} onChange={(speak) => onChange({ ...prefs, speak })} label={s.speak} />
        </section>
      </div>
    </Modal>
  );
}
