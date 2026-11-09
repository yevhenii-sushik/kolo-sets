import { Fragment, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, Lightbulb, Plus, RotateCw } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { useData } from "../contexts/DataContext";
import { finishOnboarding } from "../utils/firstRun";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { formatDuration } from "../utils/progress";
import { Button, Heading, Logo, Text, cx } from "../ui";
import { OrbitRing } from "./progress/OrbitRing";

// ── Иллюстрации шагов: маленькие копии настоящих экранов, тексты — из тех же переводов ──

function useStrings() {
  const { t, language } = useI18n();
  return { t, locale: getLanguageInfo(language).htmlLang };
}

const pop = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 + i * 0.08 },
});

function WelcomeIll() {
  return (
    <div className="grid h-full place-items-center content-center gap-4">
      <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 14, stiffness: 120 }}>
        <Logo size="lg" tone="night" />
      </motion.div>
      <div className="flex gap-2">
        {["📚", "🧠", "🔥", "🏆"].map((e, i) => (
          <motion.span key={e} {...pop(i + 2)} className="text-xl">
            {e}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// Как работает Kolo: добавь → учи → повторяй, и снова по кругу
function LoopIll() {
  const { t } = useStrings();
  const l = t.onboarding.loop;
  const steps = [
    { icon: Plus, label: l.add, tone: "bg-accent-soft text-accent-ink" },
    { icon: Layers, label: l.learn, tone: "bg-info-soft text-info" },
    { icon: RotateCw, label: l.repeat, tone: "bg-special-soft text-special" },
  ];
  return (
    <div className="grid h-full place-items-center px-5">
      <div className="grid w-full max-w-64 gap-4">
        <div className="flex items-start justify-between">
          {steps.map(({ icon: Icon, label, tone }, i) => (
            <Fragment key={label}>
              {i > 0 && (
                <motion.span {...pop(i * 2 - 1)} className="mt-4 text-faint">
                  <ArrowRight size={16} />
                </motion.span>
              )}
              <motion.div {...pop(i * 2)} className="grid w-18 justify-items-center gap-1.5">
                <span className={cx("grid h-12 w-12 place-items-center rounded-2xl shadow-sm", tone)}>
                  <Icon size={22} />
                </span>
                <span className="text-center text-xs font-semibold leading-tight text-fg">{label}</span>
              </motion.div>
            </Fragment>
          ))}
        </div>
        <motion.p {...pop(5)} className="justify-self-center rounded-full bg-surface px-3 py-1.5 text-center text-2xs font-semibold text-muted shadow-sm">
          {l.note}
        </motion.p>
      </div>
    </div>
  );
}

function ProgressIll() {
  const { t, locale } = useStrings();
  const list = t.profile.achievementsList;
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="grid w-full max-w-60 gap-2">
        <motion.div {...pop(0)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 shadow-sm">
          <OrbitRing goal={3} done={2} closed={false} size={36}>
            <span className="font-display text-xs font-extrabold text-fg">4</span>
          </OrbitRing>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-fg">{plural(locale, 4, t.orbit.inRow)}</p>
            <p className="truncate text-2xs text-muted">{t.orbit.daysOf.replace("{done}", "2").replace("{goal}", "3")}</p>
          </div>
        </motion.div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: "📚", name: list.first_collection.name, done: true },
            { icon: "🎴", name: list.flashcards_10.name, done: true },
            { icon: "🏅", name: list.cards_100.name, done: false },
          ].map((a, i) => (
            <motion.div
              key={a.name}
              {...pop(i + 1)}
              className={cx("rounded-xl border border-line bg-surface p-2 text-center", !a.done && "opacity-50")}
            >
              <div className={cx("text-lg", !a.done && "grayscale")}>{a.icon}</div>
              <p className="mt-0.5 line-clamp-2 text-2xs font-semibold leading-tight text-muted">{a.name}</p>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { v: "12", l: t.profile.stats.weekSessions },
            { v: "248", l: t.profile.stats.totalWords },
            { v: formatDuration(locale, 4 * 3600), l: t.profile.stats.studyTime },
          ].map((s, i) => (
            <motion.div key={s.l} {...pop(i + 4)} className="rounded-xl border border-line bg-surface px-1 py-1.5 text-center">
              <p className="text-xs font-semibold tabular-nums text-fg">{s.v}</p>
              <p className="truncate text-2xs text-faint">{s.l}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Первый шаг — на ночном фоне бренда, остальные — на светлой «подложке» с мини-экранами
const ILLUSTRATIONS = [
  { Ill: WelcomeIll, bg: "bg-brand-night" },
  { Ill: LoopIll, bg: "bg-band" },
  { Ill: ProgressIll, bg: "bg-band" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Вступление: 3 коротких шага — что такое Kolo, как он работает и ритм недели. Учит дальше не слайд,
// а дело: в конце — «Создать первый набор» (сценарий набора на главной), а там ждут «Первые шаги». Стрелки и Enter — дальше,
// Esc — пропустить
export default function OnboardingModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { collections } = useData();
  const o = t.onboarding;
  // Повторное знакомство (из настроек) у того, у кого наборы уже есть, — без призыва создать первый
  const [step, setStep] = useState(0);
  const total = o.steps.length;
  const isLast = step === total - 1;

  const firstSet = collections.length === 0;

  const close = useCallback(
    (to?: string) => {
      finishOnboarding();
      onClose();
      if (to) navigate(to);
    },
    [navigate, onClose],
  );

  const goNext = useCallback(() => {
    if (step < total - 1) setStep((s) => s + 1);
    else close(firstSet ? "/?guide=set" : "/");
  }, [step, total, close, firstSet]);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, goNext, close]);

  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  const current = o.steps[step] as { title: string; text: string; tip?: string };
  const { Ill, bg } = ILLUSTRATIONS[step];

  return (
    <AnimatePresence>
      {isOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" className="fixed inset-0 z-200 grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-scrim/50 backdrop-blur-sm"
            onClick={() => close()}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="relative w-full max-w-sm overflow-hidden rounded-4xl border border-line bg-surface shadow-2xl"
          >
            <div className={cx("relative h-56 transition-colors duration-300", bg)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0"
                >
                  <Ill />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid gap-5 p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="grid gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-faint tabular-nums">
                      {o.step.replace("{n}", String(step + 1)).replace("{total}", String(total))}
                    </span>
                    {!isLast && (
                      <button type="button" onClick={() => close()} className="text-sm font-semibold text-muted transition-colors hover:text-fg">
                        {o.skip}
                      </button>
                    )}
                  </div>
                  <Heading size={3} as="h2" id="onboarding-title">
                    {current.title}
                  </Heading>
                  <Text size="sm" tone="muted">
                    {current.text}
                  </Text>
                  {current.tip && (
                    <div className="mt-1 flex gap-2.5 rounded-2xl bg-accent-soft p-3 text-sm text-accent-ink">
                      <Lightbulb size={16} className="mt-0.5 shrink-0" />
                      <p className="leading-snug">{current.tip}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-1.5">
                {o.steps.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={o.step.replace("{n}", String(i + 1)).replace("{total}", String(total))}
                    aria-current={i === step || undefined}
                    onClick={() => setStep(i)}
                    className={cx(
                      "h-2 rounded-full transition-all duration-300",
                      i === step ? "w-5 bg-accent" : i < step ? "w-2 bg-accent/40" : "w-2 bg-track",
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {step > 0 && (
                  <Button variant="secondary" onClick={goPrev}>
                    {o.back}
                  </Button>
                )}
                <Button fullWidth onClick={goNext} iconRight={isLast && !firstSet ? undefined : <ArrowRight size={16} />} className="flex-1">
                  {!isLast ? o.next : firstSet ? o.createFirst : o.start}
                </Button>
              </div>
              {isLast && firstSet && (
                <button type="button" onClick={() => close()} className="-mt-2 text-sm font-semibold text-muted transition-colors hover:text-fg">
                  {o.later}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
