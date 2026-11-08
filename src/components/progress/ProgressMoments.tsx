import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, Shield, Sparkles, Wrench } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Ring } from "../../ui";
import type { Progression } from "../../api/progress";
import { ORBIT_BONUS } from "../../../server/core/xp";
import { REPAIR_SESSIONS } from "../../../server/core/orbit";
import { OrbitRing } from "./OrbitRing";
import { CapsuleArt } from "../rewards/CapsuleArt";

// Празднования этапа 2 (docs/specs/02-progression.md): орбита замкнута, новый уровень, починка удалась,
// а после подведения итогов недели — щит сработал или серию можно починить. Не каждый день, а то, что важно.
export const PROGRESS_MOMENTS_EVENT = "kolo:progress-moments";

export type Moment =
  | { kind: "orbit"; streak: number; goal: number; shield: boolean }
  | { kind: "level"; level: number }
  | { kind: "repaired"; streak: number }
  | { kind: "shieldUsed" }
  | { kind: "repair"; left: number }
  | { kind: "capsule"; count: number }
  | { kind: "beta" };

export function momentsOf(p: Progression): Moment[] {
  const e = p.events;
  const out: Moment[] = [];
  if (e.includes("shieldUsed")) out.push({ kind: "shieldUsed" });
  if (e.includes("repairAvailable") && p.orbit.repair) out.push({ kind: "repair", left: REPAIR_SESSIONS - p.orbit.repair.sessions });
  if (e.includes("repaired")) out.push({ kind: "repaired", streak: p.orbit.streak });
  if (e.includes("orbitClosed")) out.push({ kind: "orbit", streak: p.orbit.streak, goal: p.orbit.goal, shield: e.includes("shieldEarned") });
  if (p.xp.levelUp) out.push({ kind: "level", level: p.xp.level });
  if (p.capsules?.gained > 0) out.push({ kind: "capsule", count: p.capsules.gained });
  return out;
}

// Особые медали, выданные при синхронизации (бета-тестерам)
export function announceMedals(granted: string[]) {
  const moments: Moment[] = granted.includes("beta_tester") ? [{ kind: "beta" }] : [];
  if (moments.length > 0) window.dispatchEvent(new CustomEvent(PROGRESS_MOMENTS_EVENT, { detail: moments }));
}

export function announceProgress(p: Progression) {
  const moments = momentsOf(p);
  if (moments.length > 0) window.dispatchEvent(new CustomEvent(PROGRESS_MOMENTS_EVENT, { detail: moments }));
}

// Глобальный хост на уровне App: страницы тренировок идут без MainLayout. Моменты — по очереди
let seq = 0;

export function ProgressMomentsHost() {
  const [queue, setQueue] = useState<{ id: number; moment: Moment }[]>([]);

  useEffect(() => {
    const handler = (e: Event) =>
      setQueue((q) => [...q, ...((e as CustomEvent<Moment[]>).detail ?? []).map((moment) => ({ id: ++seq, moment }))]);
    window.addEventListener(PROGRESS_MOMENTS_EVENT, handler);
    return () => window.removeEventListener(PROGRESS_MOMENTS_EVENT, handler);
  }, []);

  const next = useCallback(() => setQueue((q) => q.slice(1)), []);
  const current = queue[0];

  return (
    <AnimatePresence mode="wait">
      {current && <MomentCard key={current.id} moment={current.moment} onClose={next} />}
    </AnimatePresence>
  );
}

function MomentCard({ moment, onClose }: { moment: Moment; onClose: () => void }) {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const m = t.orbit.moments;
  const locale = getLanguageInfo(language).htmlLang;
  const [filled, setFilled] = useState(false);

  // Кольцо стартует пустым и замыкается; через 4,5 секунды карточка закрывается сама
  useEffect(() => {
    const fill = setTimeout(() => setFilled(true), 150);
    const close = setTimeout(onClose, 4500);
    return () => {
      clearTimeout(fill);
      clearTimeout(close);
    };
  }, [onClose]);

  let visual: ReactNode;
  let title: string;
  let text: ReactNode;
  switch (moment.kind) {
    case "orbit":
      title = m.orbitTitle;
      visual = (
        <OrbitRing goal={moment.goal} done={filled ? moment.goal : 0} closed={filled} size={148}>
          <span className="font-display text-5xl font-extrabold leading-none text-fg">{moment.streak}</span>
        </OrbitRing>
      );
      text = (
        <>
          <span className="font-display text-xl font-extrabold text-fg">{plural(locale, moment.streak, t.orbit.inRow)}</span>
          <span className="mx-auto mt-1 w-fit rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent-ink">
            {m.xp.replace("{n}", String(ORBIT_BONUS))}
          </span>
          {moment.shield && (
            <span className="mt-2 flex items-start gap-2 text-left text-sm text-muted">
              <Shield size={16} className="mt-0.5 shrink-0 text-info" />
              {m.shieldEarned}
            </span>
          )}
        </>
      );
      break;
    case "level":
      title = m.levelTitle;
      visual = (
        <Ring value={filled ? 1 : 0} size={148} stroke={10} tone="special" label={m.level.replace("{n}", String(moment.level))}>
          <span className="grid justify-items-center">
            <Sparkles size={22} className="text-special" />
            <span className="font-display text-5xl font-extrabold leading-none text-fg">{moment.level}</span>
          </span>
        </Ring>
      );
      text = <span className="font-display text-xl font-extrabold text-fg">{m.level.replace("{n}", String(moment.level))}</span>;
      break;
    case "repaired":
      title = m.repairedTitle;
      visual = (
        <Ring value={filled ? 1 : 0} size={148} stroke={10} tone="success" label={plural(locale, moment.streak, t.orbit.inRow)}>
          <span className="font-display text-5xl font-extrabold leading-none text-fg">{moment.streak}</span>
        </Ring>
      );
      text = <span className="font-display text-xl font-extrabold text-fg">{plural(locale, moment.streak, t.orbit.inRow)}</span>;
      break;
    case "shieldUsed":
      title = m.shieldUsedTitle;
      visual = <Emblem icon={<Shield size={48} className="fill-info-soft text-info" />} />;
      text = <span className="text-sm text-muted">{m.shieldUsedText}</span>;
      break;
    case "repair":
      title = m.repairTitle;
      visual = <Emblem icon={<Wrench size={44} className="text-accent" />} />;
      text = <span className="text-sm text-muted">{plural(locale, moment.left, m.repairText)}</span>;
      break;
    case "beta":
      title = t.rewards.moment.medalTitle;
      visual = <Emblem icon={<FlaskConical size={48} className="text-special" />} />;
      text = (
        <>
          <span className="font-display text-xl font-extrabold text-fg">{t.rewards.medal.beta.name}</span>
          <span className="mt-1 text-sm text-muted">{t.rewards.moment.betaText}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate("/rewards");
            }}
            className="mx-auto mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            {t.rewards.moment.open}
          </button>
        </>
      );
      break;
    case "capsule":
      title = plural(locale, moment.count, t.rewards.moment.title);
      visual = <CapsuleArt size={132} glow />;
      text = (
        <>
          <span className="text-sm text-muted">{t.rewards.moment.text}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              navigate("/rewards");
            }}
            className="mx-auto mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
          >
            {t.rewards.moment.open}
          </button>
        </>
      );
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={onClose}
      role="dialog"
      aria-live="polite"
      aria-label={title}
      className="fixed inset-0 z-[500] grid place-items-center bg-scrim/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="grid w-full max-w-xs justify-items-center gap-4 rounded-4xl border border-line bg-surface p-8 text-center shadow-2xl"
      >
        {visual}
        <div className="grid gap-1">
          <h2 className="text-sm font-semibold text-accent-ink">{title}</h2>
          {text}
        </div>
        <p className="text-xs text-faint">{m.tap}</p>
      </motion.div>
    </motion.div>
  );
}

function Emblem({ icon }: { icon: ReactNode }) {
  return <span className="grid h-32 w-32 place-items-center rounded-full bg-inset">{icon}</span>;
}
