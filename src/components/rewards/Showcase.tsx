import { useEffect, useState } from "react";
import { Check, Flame, FlaskConical, Medal, Plus } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { Alert, Button, Modal, cx } from "../../ui";
import { saveShowcase } from "../../api/progress";
import { ALL_ACHIEVEMENTS } from "../../utils/achievements";
import { COLLECTIONS, ITEMS, itemById } from "../../../server/core/items";
import { BETA_MEDAL, LEGACY_MEDAL, SHOWCASE_MAX } from "../../../server/core/loot";
import { ItemArt } from "./ItemArt";

// Что можно выставить на витрину и как это выглядит: предмет, медаль за коллекцию, медаль огоньков, достижение
function useEntry() {
  const { t } = useI18n();
  const r = t.rewards;
  return (id: string): { name: string; art: React.ReactNode } | null => {
    const item = itemById(id);
    if (item) return { name: r.items[id as keyof typeof r.items], art: <ItemArt id={id} size={56} /> };
    const collection = COLLECTIONS.find((c) => c.medal === id);
    if (collection)
      return {
        name: r.medal.name.replace("{name}", r.collections.names[collection.id]),
        art: (
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
            <Medal size={28} />
          </span>
        ),
      };
    if (id === BETA_MEDAL)
      return {
        name: r.medal.beta.name,
        art: (
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-special-soft text-special">
            <FlaskConical size={28} />
          </span>
        ),
      };
    if (id === LEGACY_MEDAL)
      return {
        name: t.profile.legacyFlames.name,
        art: (
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft">
            <Flame size={28} className="fill-accent text-accent" />
          </span>
        ),
      };
    const achievement = ALL_ACHIEVEMENTS.find((a) => a.id === id);
    if (achievement)
      return {
        name: t.profile.achievementsList[achievement.id].name,
        art: <span className="grid h-14 w-14 place-items-center rounded-2xl bg-inset text-3xl">{achievement.icon}</span>,
      };
    return null;
  };
}

export function ShowcaseTile({ id }: { id?: string }) {
  const { t } = useI18n();
  const entry = useEntry();
  const e = id ? entry(id) : null;
  return (
    <div
      className={cx(
        "grid min-h-36 content-center justify-items-center gap-2 rounded-2xl p-3 text-center",
        e ? "bg-inset" : "border-2 border-dashed border-line text-faint",
      )}
    >
      {e ? (
        <>
          {e.art}
          <p className="line-clamp-2 text-sm font-semibold leading-tight text-fg">{e.name}</p>
        </>
      ) : (
        <>
          <Plus size={22} aria-hidden />
          <p className="text-sm">{t.rewards.showcase.empty}</p>
        </>
      )}
    </div>
  );
}

export function ShowcaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const s = t.rewards.showcase;
  const { loot, applyLoot, profile } = useData();
  const entry = useEntry();
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setPicked(loot.equipped.showcase ?? []);
      setFailed(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = ITEMS.filter((i) => loot.inventory[i.id]).map((i) => i.id);
  const medals = [
    ...(typeof profile?.legacyFlames === "number" ? [LEGACY_MEDAL] : []),
    ...loot.medals,
    ...((profile?.achievements ?? []) as string[]),
  ];

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < SHOWCASE_MAX ? [...p, id] : p));

  const save = async () => {
    setSaving(true);
    setFailed(false);
    try {
      applyLoot((await saveShowcase(picked)).loot);
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const group = (title: string, ids: string[]) =>
    ids.length > 0 && (
      <section className="grid gap-2">
        <h3 className="text-sm font-semibold text-muted">{title}</h3>
        <ul className="grid grid-cols-3 gap-2">
          {ids.map((id) => {
            const e = entry(id);
            if (!e) return null;
            const on = picked.includes(id);
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(id)}
                  disabled={!on && picked.length >= SHOWCASE_MAX}
                  className={cx(
                    "relative grid w-full justify-items-center gap-1.5 rounded-2xl border p-2 text-center transition-colors disabled:opacity-40",
                    on ? "border-accent bg-accent-soft" : "border-line hover:bg-inset",
                  )}
                >
                  {on && (
                    <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-on-accent">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                  {e.art}
                  <span className="line-clamp-2 text-xs font-semibold leading-tight text-fg">{e.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={s.pick}
      footer={
        <Button onClick={save} loading={saving}>
          {s.save} · {picked.length}/{SHOWCASE_MAX}
        </Button>
      }
    >
      <div className="grid gap-5">
        {items.length + medals.length === 0 && <p className="text-sm text-muted">{s.nothing}</p>}
        {group(s.items, items)}
        {group(s.medals, medals)}
        {failed && <Alert>{t.rewards.equip.error}</Alert>}
      </div>
    </Modal>
  );
}
