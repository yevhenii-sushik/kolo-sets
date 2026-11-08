import { useState } from "react";
import { ChevronDown, Medal, Shield, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { Badge, Button, Card, Heading, Text, cx } from "../../ui";
import { buyShield, craftItem, equipItem } from "../../api/progress";
import { CapsuleArt } from "../../components/rewards/CapsuleArt";
import { CapsuleOpenModal } from "../../components/rewards/CapsuleOpenModal";
import { ItemArt, RarityChip } from "../../components/rewards/ItemArt";
import { COLLECTIONS, RARITIES, collectionItems, type Item } from "../../../server/core/items";
import { CRAFT_COST, ODDS, PITY_AT, SHIELD_COST } from "../../../server/core/loot";
import { MAX_SHIELDS } from "../../../server/core/orbit";

// Награды (docs/specs/02-progression.md → «2b»): капсулы, звёздная пыль, коллекции. Всё пишет сервер
export default function RewardsPage() {
  const { t, language } = useI18n();
  const r = t.rewards;
  const locale = getLanguageInfo(language).htmlLang;
  const { loot, applyLoot, progression, applyProgression } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();
  const [opening, setOpening] = useState(false);
  const [oddsOpen, setOddsOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const shields = progression?.orbit.shields ?? 0;
  const name = (id: string) => r.items[id as keyof typeof r.items];

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
    } catch {
      error(r.dust.error);
    } finally {
      setBusy(null);
    }
  };

  const shield = () =>
    run("shield", async () => {
      const res = await buyShield();
      applyLoot({ ...loot, dust: res.loot.dust });
      applyProgression(res.progression, false);
      success(r.dust.shieldDone);
    });

  const craft = async (item: Item, cost: number) => {
    const ok = await confirm({
      title: name(item.id),
      message: r.dust.craftConfirm.replace("{n}", String(cost)).replace("{item}", name(item.id)),
      type: "info",
      confirmText: r.dust.craft.replace("{n}", String(cost)),
    });
    if (!ok) return;
    await run(item.id, async () => {
      const res = await craftItem(item.id);
      applyLoot(res.loot);
      success(r.dust.crafted.replace("{item}", name(item.id)));
    });
  };

  const toggle = (item: Item) =>
    run(item.id, async () => {
      const on = loot.equipped[item.kind] !== item.id;
      applyLoot((await equipItem(item.kind, on ? item.id : null)).loot);
    });

  const left = PITY_AT - loot.pity;

  // grid-cols-1 = minmax(0, 1fr): длинные названия не растягивают колонку шире экрана
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      <header className="grid gap-1">
        <Heading size={1}>{r.title}</Heading>
        <Text tone="muted">{r.subtitle}</Text>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-[3fr_2fr]">
        {/* ── Капсулы ── */}
        <Card tone="inverse" padding="lg" className="grid content-between gap-5">
          <div className="flex items-center gap-5">
            <CapsuleArt size={104} glow={loot.capsules > 0} />
            <div className="grid gap-1">
              <p className="text-sm text-on-inverse/70">{r.capsules.title}</p>
              <p className="font-display text-3xl font-extrabold tabular-nums">{plural(locale, loot.capsules, r.capsules.count)}</p>
              {loot.capsules > 0 && (
                <p className="text-sm text-on-inverse/70">
                  {left <= 1 ? r.capsules.pityNow : plural(locale, left, r.capsules.pity)}
                </p>
              )}
            </div>
          </div>
          {loot.capsules > 0 ? (
            <Button onClick={() => setOpening(true)} iconLeft={<Sparkles size={16} />}>
              {r.capsules.open}
            </Button>
          ) : (
            <p className="text-sm text-on-inverse/70">{r.capsules.none}</p>
          )}
          <div>
            <button
              type="button"
              onClick={() => setOddsOpen((o) => !o)}
              aria-expanded={oddsOpen}
              className="flex items-center gap-1 text-sm font-semibold text-on-inverse/80 hover:text-on-inverse"
            >
              {r.capsules.odds}
              <ChevronDown size={15} className={cx("transition-transform", oddsOpen && "rotate-180")} />
            </button>
            <AnimatePresence initial={false}>
              {oddsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
                    {RARITIES.map((rarity) => (
                      <div key={rarity} className="flex items-baseline justify-between gap-2">
                        <dt className="text-on-inverse/70">{r.rarity[rarity]}</dt>
                        <dd className="font-semibold tabular-nums">{ODDS[rarity]} %</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-sm leading-relaxed text-on-inverse/70">{r.capsules.oddsText}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* ── Звёздная пыль ── */}
        <Card padding="lg" className="grid content-between gap-5">
          <div className="grid gap-2">
            <p className="text-sm text-muted">{r.dust.title}</p>
            <p className="flex items-center gap-2 font-display text-3xl font-extrabold tabular-nums text-fg">
              <Sparkles size={24} className="text-special" aria-hidden />
              {loot.dust}
            </p>
            <p className="text-sm leading-relaxed text-muted">{r.dust.hint}</p>
          </div>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              iconLeft={<Shield size={16} />}
              loading={busy === "shield"}
              disabled={shields >= MAX_SHIELDS || loot.dust < SHIELD_COST || !!busy}
              onClick={shield}
            >
              {shields >= MAX_SHIELDS ? r.dust.shieldFull : r.dust.shield.replace("{n}", String(SHIELD_COST))}
            </Button>
            <p className="text-xs text-faint">{r.dust.shieldHint}</p>
          </div>
        </Card>
      </div>

      {/* ── Коллекции ── */}
      <Heading size={2} className="mt-4">
        {r.collections.title}
      </Heading>
      {COLLECTIONS.map((c) => {
        const items = collectionItems(c.id);
        const owned = items.filter((i) => loot.inventory[i.id]).length;
        const complete = loot.medals.includes(c.medal);
        return (
          <Card key={c.id} padding="lg" className="grid grid-cols-1 gap-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-1">
                <Heading size={3} as="h3">
                  {r.collections.names[c.id]}
                </Heading>
                <p className="text-sm text-muted">
                  {c.title ? r.collections.reward.replace("{title}", name(c.title)) : r.collections.rewardMedal}
                </p>
              </div>
              {complete ? (
                <Badge tone="success">
                  <Medal size={13} aria-hidden />
                  {r.collections.complete}
                </Badge>
              ) : (
                <Badge tone="neutral" className="tabular-nums">
                  {r.collections.progress.replace("{n}", String(owned)).replace("{total}", String(items.length))}
                </Badge>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(owned / items.length) * 100}%` }} />
            </div>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((item) => {
                const has = !!loot.inventory[item.id];
                const on = loot.equipped[item.kind] === item.id;
                const cost = CRAFT_COST[item.rarity];
                return (
                  <li
                    key={item.id}
                    className={cx(
                      "grid content-start justify-items-center gap-2 rounded-2xl border p-3 text-center",
                      on ? "border-accent bg-accent-soft" : "border-line",
                    )}
                  >
                    <ItemArt id={item.id} size={64} className={cx(!has && "opacity-25 grayscale")} />
                    <p className={cx("text-sm font-semibold leading-tight", has ? "text-fg" : "text-faint")}>{name(item.id)}</p>
                    <RarityChip rarity={item.rarity} />
                    {has ? (
                      <Button
                        size="sm"
                        variant={on ? "ghost" : "secondary"}
                        loading={busy === item.id}
                        disabled={!!busy}
                        onClick={() => toggle(item)}
                        className="mt-1 w-full"
                      >
                        {on ? r.equip.off : r.equip.on}
                      </Button>
                    ) : cost !== undefined ? (
                      <Button
                        size="sm"
                        variant="soft"
                        loading={busy === item.id}
                        disabled={loot.dust < cost || !!busy}
                        title={loot.dust < cost ? r.dust.notEnough : undefined}
                        onClick={() => craft(item, cost)}
                        className="mt-1 w-full"
                      >
                        {r.dust.craft.replace("{n}", String(cost))}
                      </Button>
                    ) : (
                      <p className="mt-1 text-xs text-faint">{r.collections.missing}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        );
      })}

      <CapsuleOpenModal open={opening} onClose={() => setOpening(false)} />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}
