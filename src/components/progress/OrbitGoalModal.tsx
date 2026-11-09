import { useEffect, useState } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Alert, Button, Modal, cx } from "../../ui";
import { DEFAULT_GOAL, GOAL_MAX, GOAL_MIN } from "../../../server/core/orbit";
import { OrbitRing } from "./OrbitRing";

const GOALS = Array.from({ length: GOAL_MAX - GOAL_MIN + 1 }, (_, i) => GOAL_MIN + i);

// Цель недели. Первый раз — знакомство с орбитами (и итог перехода со старых огоньков), цель сразу;
// потом — смена цели, она начнёт действовать с понедельника
export function OrbitGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, language } = useI18n();
  const g = t.orbit.goal;
  const locale = getLanguageInfo(language).htmlLang;
  const { progression, profile, setWeeklyGoal } = useData();
  const orbit = progression?.orbit;
  const first = !orbit?.goalSet;
  const current = orbit ? (orbit.nextGoal ?? orbit.goal) : DEFAULT_GOAL;

  const [goal, setGoal] = useState(current);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setGoal(current);
      setFailed(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Рекорд старых огоньков: сервер сохраняет его медалью, если он не меньше 3 дней
  const legacy: number | null = profile?.legacyFlames ?? (profile?.longestStreak >= 3 ? profile.longestStreak : null);
  // Новичок не видел старых огоньков — объясняем орбиту с нуля, на картинке
  const newcomer = first && !legacy && !(orbit && orbit.streak > 0);

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      await setWeeklyGoal(goal);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={g.title}
      footer={
        <Button onClick={save} loading={saving} disabled={!first && goal === current}>
          {first ? g.start : g.save}
        </Button>
      }
    >
      <div className="grid gap-4">
        {first && (
          <div className="grid gap-2 text-sm leading-relaxed text-muted">
            {newcomer && (
              <div className="mb-1 flex items-center gap-4 rounded-2xl bg-inset p-3">
                <OrbitRing goal={3} done={2} closed={false} size={56} />
                <p className="leading-snug text-fg">{g.ringCaption}</p>
              </div>
            )}
            <p>{newcomer ? g.introNew : g.intro}</p>
            {orbit && orbit.streak > 0 && <p className="font-medium text-fg">{plural(locale, orbit.streak, g.migrated)}</p>}
            {legacy && <p>{g.legacy.replace("{days}", plural(locale, legacy, t.shell.streak.days))}</p>}
          </div>
        )}

        <div role="radiogroup" aria-label={g.title} className="grid gap-2">
          {GOALS.map((n) => {
            const selected = n === goal;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setGoal(n)}
                className={cx(
                  "flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors",
                  selected ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-inset",
                )}
              >
                <OrbitRing goal={n} done={selected ? n : 0} closed={selected} size={30} />
                <span className="grid">
                  <span className="font-semibold text-fg">{plural(locale, n, g.perWeek)}</span>
                  <span className="text-sm text-muted">{g.levels[String(n) as keyof typeof g.levels]}</span>
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-faint">{first ? g.hint : g.nextWeek}</p>
        {failed && <Alert>{g.error}</Alert>}
      </div>
    </Modal>
  );
}
