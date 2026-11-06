import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Flame, Lightbulb } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { formatDuration } from "../utils/progress";
import { Button, Heading, Logo, Text, cx } from "../ui";

export const ONBOARDING_STORAGE_KEY = "kolo_onboarding_v1";
export const ONBOARDING_RESTART_EVENT = "kolo:restart-onboarding";

// ── Иллюстрации шагов: маленькие копии настоящих экранов, тексты — из тех же переводов ──

function useStrings() {
  const { t, language } = useI18n();
  return { t, locale: getLanguageInfo(language).htmlLang, sample: t.onboarding.sample };
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

function CollectionsIll() {
  const { t, locale, sample } = useStrings();
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="grid w-full max-w-56 gap-2">
        {sample.sets.map((name, i) => (
          <motion.div key={name} {...pop(i)} className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
            <p className="text-xs font-semibold text-fg">{name}</p>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-2xs text-muted">{plural(locale, i === 0 ? 24 : 48, t.words.collectionCard.words)}</span>
              <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-semibold text-on-accent">{sample.study}</span>
            </div>
          </motion.div>
        ))}
        <motion.div {...pop(2)} className="rounded-2xl border border-dashed border-accent/50 py-2 text-center text-xs font-semibold text-accent-ink">
          + {t.words.addDeck}
        </motion.div>
      </div>
    </div>
  );
}

const RATING_TONES = ["bg-danger-soft text-danger", "bg-warning-soft text-warning", "bg-info-soft text-info", "bg-success-soft text-success"];

function FlashcardsIll() {
  const { t, sample } = useStrings();
  const levels = t.words.flashcards.levels;
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="grid w-full max-w-56 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold tabular-nums text-muted">2 / 8</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
            <motion.div initial={{ width: 0 }} animate={{ width: "25%" }} transition={{ delay: 0.3, duration: 0.6 }} className="h-full rounded-full bg-accent" />
          </div>
        </div>
        <motion.div {...pop(0)} className="rounded-2xl border border-line bg-surface p-3 text-center shadow-sm">
          <p className="font-display text-xl font-semibold text-fg">{sample.word}</p>
          <p className="text-sm font-semibold text-accent-ink">{sample.translation}</p>
          <p className="mt-1 text-2xs italic text-faint">“{sample.example}”</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-1">
          {[levels.dontKnow, levels.forgot, levels.remember, levels.know].map((label, i) => (
            <motion.span key={label} {...pop(i + 1)} className={cx("truncate rounded-lg px-1 py-1 text-center text-2xs font-semibold", RATING_TONES[i])}>
              {label}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizIll() {
  const { t, sample } = useStrings();
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="grid w-full max-w-56 gap-2 rounded-2xl border border-line bg-surface p-3 shadow-sm">
        <span className="w-fit rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">
          {t.words.quiz.settings.types.word_by_translation}
        </span>
        <p className="font-semibold text-fg">{sample.translation}</p>
        <div className="grid gap-1">
          {sample.options.map((opt, i) => (
            <motion.div
              key={opt}
              {...pop(i)}
              className={cx(
                "flex items-center rounded-xl border px-3 py-1 text-2xs font-semibold",
                i === 0 ? "border-success bg-success-soft text-success" : "border-line text-muted",
              )}
            >
              {opt}
              {i === 0 && <span className="ml-auto">✓</span>}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressIll() {
  const { t, locale } = useStrings();
  const days = (n: number) => plural(locale, n, t.shell.streak.days);
  const list = t.profile.achievementsList;
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="grid w-full max-w-60 gap-2">
        <motion.div {...pop(0)} className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5 shadow-sm">
          <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-sm font-semibold text-on-accent">
            <Flame size={13} className="fill-current" />7
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-fg">{days(7)}</p>
            <p className="truncate text-2xs text-muted">
              {t.profile.streak.record}: {days(14)}
            </p>
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

function DoneIll() {
  const { t } = useStrings();
  return (
    <div className="grid h-full place-items-center content-center gap-3">
      <motion.span
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 80, delay: 0.1 }}
        className="text-6xl"
      >
        🚀
      </motion.span>
      <motion.p {...pop(3)} className="text-sm font-semibold text-white/80">
        {t.onboarding.ready}
      </motion.p>
    </div>
  );
}

// Первый и последний шаги — на ночном фоне бренда, остальные — на светлой «подложке» с мини-экранами
const ILLUSTRATIONS = [
  { Ill: WelcomeIll, bg: "bg-brand-night" },
  { Ill: CollectionsIll, bg: "bg-band" },
  { Ill: FlashcardsIll, bg: "bg-band" },
  { Ill: QuizIll, bg: "bg-band" },
  { Ill: ProgressIll, bg: "bg-band" },
  { Ill: DoneIll, bg: "bg-brand-night" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Знакомство с приложением: 6 шагов, стрелки и Enter — дальше, Esc — пропустить
export default function OnboardingModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const o = t.onboarding;
  const [step, setStep] = useState(0);
  const total = o.steps.length;
  const isLast = step === total - 1;

  const close = useCallback(
    (goHome: boolean) => {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
      onClose();
      if (goHome) navigate("/");
    },
    [navigate, onClose],
  );

  const goNext = useCallback(() => {
    if (step < total - 1) setStep((s) => s + 1);
    else close(true);
  }, [step, total, close]);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") close(false);
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
            onClick={() => close(false)}
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
                      <button type="button" onClick={() => close(false)} className="text-sm font-semibold text-muted transition-colors hover:text-fg">
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
                <Button fullWidth onClick={goNext} iconRight={isLast ? undefined : <ArrowRight size={16} />} className="flex-1">
                  {isLast ? o.start : o.next}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
