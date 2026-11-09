import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Medal, Sparkles } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Alert, Button, Modal, cx } from "../../ui";
import { equipItem, openCapsule, saveSatellites, type CapsuleResult } from "../../api/progress";
import { itemById } from "../../../server/core/items";
import { PITY_AT, satelliteSlots, satellitesOf } from "../../../server/core/loot";
import { CapsuleArt } from "./CapsuleArt";
import { ItemArt, RARITY_TONE, RarityChip, TitleBadge } from "./ItemArt";

// Открытие капсулы: случайность — на сервере; пока он отвечает, капсулу трясёт (не меньше секунды)
const MIN_SHAKE_MS = 1100;

export function CapsuleOpenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, language } = useI18n();
  const r = t.rewards;
  const locale = getLanguageInfo(language).htmlLang;
  const { loot, applyLoot, progression } = useData();
  const [phase, setPhase] = useState<"idle" | "opening" | "revealed">("idle");
  const [result, setResult] = useState<CapsuleResult | null>(null);
  const [failed, setFailed] = useState(false);
  const [equipping, setEquipping] = useState(false);

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setResult(null);
      setFailed(false);
    }
  }, [open]);

  const start = async () => {
    setPhase("opening");
    setFailed(false);
    try {
      const [res] = await Promise.all([openCapsule(), new Promise((ok) => setTimeout(ok, MIN_SHAKE_MS))]);
      const opened = res as CapsuleResult;
      applyLoot(opened.loot);
      setResult(opened);
      setPhase("revealed");
    } catch {
      setFailed(true);
      setPhase("idle");
    }
  };

  const item = result ? itemById(result.item) : undefined;
  // Спутник встаёт на свободное место орбиты; если мест нет — вместо последнего надетого
  const sats = satellitesOf(loot.equipped);
  const replaces = item?.kind === "satellite" && sats.length >= satelliteSlots(progression?.xp.level ?? 1) ? sats[sats.length - 1] : undefined;
  const equipped = item ? (item.kind === "satellite" ? sats.includes(item.id) : loot.equipped[item.kind] === item.id) : false;

  const equip = async () => {
    if (!item) return;
    setEquipping(true);
    try {
      const next = replaces ? [...sats.slice(0, -1), item.id] : [...sats, item.id];
      applyLoot((item.kind === "satellite" ? await saveSatellites(next) : await equipItem(item.kind, item.id)).loot);
    } catch {
      setFailed(true);
    } finally {
      setEquipping(false);
    }
  };

  const left = PITY_AT - loot.pity;
  const pity = left <= 1 ? r.capsules.pityNow : plural(locale, left, r.capsules.pity);

  return (
    <Modal open={open} onClose={phase === "opening" ? () => {} : onClose} size="sm">
      <div className="grid justify-items-center gap-4 text-center">
        <AnimatePresence mode="wait">
          {phase !== "revealed" || !result || !item ? (
            <motion.div key="capsule" exit={{ scale: 1.3, opacity: 0, transition: { duration: 0.25 } }} className="grid justify-items-center gap-3 pt-2">
              <CapsuleArt size={150} shake={phase === "opening"} glow />
              <p className="font-display text-xl font-extrabold text-fg">{plural(locale, loot.capsules, r.capsules.count)}</p>
              <p className="text-sm text-muted">{pity}</p>
            </motion.div>
          ) : (
            <motion.div
              key="item"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 180 }}
              className="grid justify-items-center gap-3 pt-2"
            >
              <div className="relative grid place-items-center">
                {/* Ореол цвета редкости */}
                <span aria-hidden className={cx("absolute h-44 w-44 rounded-full opacity-70 blur-2xl", RARITY_TONE[result.rarity].soft)} />
                {item.kind === "title" ? (
                  <TitleBadge id={item.id} className="relative px-4 py-1.5 text-lg" />
                ) : (
                  <ItemArt id={item.id} size={128} className="relative shadow-lg" />
                )}
              </div>
              <RarityChip rarity={result.rarity} />
              <h2 className="font-display text-2xl font-extrabold text-fg">{r.items[item.id as keyof typeof r.items]}</h2>
              <p className="text-sm text-muted">{r.kinds[item.kind]}</p>
              <p
                className={cx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold",
                  result.duplicate ? "bg-inset text-muted" : "bg-success-soft text-success",
                )}
              >
                <Sparkles size={14} aria-hidden />
                {result.duplicate ? r.capsules.duplicate.replace("{n}", String(result.dust)) : r.capsules.new}
              </p>
              {result.completed && (
                <p className="flex items-center gap-2 rounded-2xl bg-accent-soft px-3.5 py-3 text-left text-sm font-medium text-accent-ink">
                  <Medal size={18} className="shrink-0" aria-hidden />
                  {r.capsules.completed.replace(
                    "{name}",
                    r.collections.names[result.completed.collection as keyof typeof r.collections.names],
                  )}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {failed && <Alert className="w-full text-left">{r.capsules.error}</Alert>}

        <div className="grid w-full gap-2">
          {phase === "revealed" && item && !result?.duplicate && !equipped && (
            <Button variant="inverse" fullWidth loading={equipping} onClick={equip}>
              {replaces ? r.satellites.instead.replace("{item}", r.items[replaces as keyof typeof r.items]) : r.equip.on}
            </Button>
          )}
          {phase !== "revealed" ? (
            <Button fullWidth loading={phase === "opening"} disabled={loot.capsules < 1} onClick={start}>
              {phase === "opening" ? r.capsules.opening : r.capsules.open}
            </Button>
          ) : (
            <>
              {loot.capsules > 0 && (
                <Button fullWidth onClick={start}>
                  {r.capsules.openMore} · {loot.capsules}
                </Button>
              )}
              <Button variant="secondary" fullWidth onClick={onClose}>
                {r.capsules.done}
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
