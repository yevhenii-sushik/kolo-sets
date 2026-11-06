import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Layers, Lightbulb, RotateCw, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { TIPS_ICONS } from "../../data/home/tips";
import DailyGameWidget from "../../components/game/DailyGameWidget";
import { FEATURES } from "../../config/features";
import { getDailyGoal, isDueCard } from "../../utils/storage";
import { localDateKey } from "../../utils/progress";
import { ALL_ACHIEVEMENTS } from "../../utils/achievements";
import { getLanguageInfo } from "../../locales/languages";
import { plural, type PluralForms } from "../../utils/plural";
import { ButtonLink, Card, Heading, IconButton, Ring, Text, cx } from "../../ui";

const MILESTONES = [10, 25, 50, 100, 200, 500];

// Главная: приветствие → что делать сейчас (повторение или наборы) с целью дня → цифры → игра дня и совет
export default function HomePage() {
  const { t, language } = useI18n();
  const h = t.home;
  const { profile, collections, totalCards, profileLoading } = useData();
  const { user } = useAuth();
  const locale = getLanguageInfo(language).htmlLang;
  const count = (n: number, forms: PluralForms) => plural(locale, n, forms);

  // ── Совет дня ──
  const tipKeys = useMemo(() => Object.keys(h.tips), [h.tips]);
  const [tipKey, setTipKey] = useState(() => tipKeys[Math.floor(Math.random() * tipKeys.length)]);
  const tip = useMemo(() => {
    const tips = h.tips as Record<string, { category: string; text: string }>;
    const data = tips[tipKey] ?? tips[tipKeys[0]];
    return { icon: TIPS_ICONS[tipKey] ?? "💡", ...data };
  }, [tipKey, h.tips, tipKeys]);
  const refreshTip = () => setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]);

  // ── Повторение и цель дня ──
  const dueCount = useMemo(() => collections.reduce((n, col) => n + col.cards.filter(isDueCard).length, 0), [collections]);
  const dailyGoal = getDailyGoal();
  const todayStudied = useMemo(() => {
    // Ключ дня — по местному времени: так сервер записывает историю (docs/specs/00-server.md)
    const today = localDateKey(new Date());
    return profile?.studyHistory?.find((d: any) => d.date === today)?.cardsStudied ?? 0;
  }, [profile?.studyHistory]);
  const goalMet = todayStudied >= dailyGoal;

  // ── Веха: следующее круглое число слов ──
  const nextMilestone = MILESTONES.find((m) => totalCards < m) ?? null;
  const milestonePct = nextMilestone ? Math.min(100, Math.round((totalCards / nextMilestone) * 100)) : 100;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : hour >= 18 && hour < 23 ? "evening" : "night";
    const options = h.greeting[period];
    return options[(hour + new Date().getDate()) % options.length];
  }, [h.greeting]);

  // Имя из профиля, а если его там нет (старые аккаунты) — из аккаунта, как в профиле
  const name = (profile?.displayName || user?.displayName)?.split(" ")[0] || (profileLoading ? "…" : h.guest);
  const unlocked = profile?.achievements?.length ?? 0;

  return (
    <div className="grid gap-4 sm:gap-5">
      {/* ── Приветствие ── */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {profile?.photoURL || user?.photoURL ? (
            <img src={profile?.photoURL || user?.photoURL || ""} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-lg font-extrabold text-accent-ink">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <Text size="sm" tone="muted">
              {greeting}
            </Text>
            <Heading size={1} className="truncate">
              {name}
            </Heading>
          </div>
        </div>
        <ButtonLink to="/profile" variant="secondary" size="sm" iconLeft={<Trophy size={16} />} aria-label={h.achievements} title={h.achievements}>
          {unlocked}/{ALL_ACHIEVEMENTS.length}
        </ButtonLink>
      </header>

      {/* ── Что делать сейчас: повторение или наборы; справа — цель дня ── */}
      <Card tone="inverse" padding="lg" className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="grid justify-items-start gap-3">
          <Heading size={1} as="h2" tone="inverse">
            {dueCount > 0 ? count(dueCount, h.review.dueTitle) : h.review.doneTitle}
          </Heading>
          <Text tone="inverse">{dueCount > 0 ? h.review.dueText : h.review.doneText}</Text>
          <ButtonLink to={dueCount > 0 ? "/review" : "/words"} size="lg" iconRight={<ArrowRight size={18} />} className="mt-2">
            {dueCount > 0 ? h.review.dueButton : h.review.doneButton}
          </ButtonLink>
        </div>
        <div className="flex items-center gap-4 sm:grid sm:justify-items-center sm:gap-3 sm:text-center">
          <Ring
            value={todayStudied / dailyGoal}
            size={112}
            stroke={10}
            tone={goalMet ? "success" : "accent"}
            track="inverse"
            label={`${h.goal.label}: ${todayStudied} / ${dailyGoal}`}
          >
            <span className="font-display text-2xl font-extrabold text-on-inverse">
              {todayStudied}
              <span className="text-base text-on-inverse/50">/{dailyGoal}</span>
            </span>
          </Ring>
          <div>
            <p className="text-sm font-semibold text-on-inverse">{h.goal.label}</p>
            <p className="text-sm text-on-inverse/75">{goalMet ? h.goal.met : count(dailyGoal - todayStudied, h.goal.left)}</p>
          </div>
        </div>
      </Card>

      {/* ── Цифры и веха ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<BookOpen size={18} />} value={totalCards} label={count(totalCards, h.stats.words)} />
        <StatCard icon={<Layers size={18} />} value={collections.length} label={count(collections.length, h.stats.sets)} />
        <Card className="col-span-2 grid content-between gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-fg">{h.milestone.label}</p>
            {nextMilestone && <p className="text-sm text-faint tabular-nums">{h.milestone.target.replace("{m}", String(nextMilestone))}</p>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milestonePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-info"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">{nextMilestone ? count(nextMilestone - totalCards, h.milestone.left) : h.milestone.done}</p>
            <Link to="/words" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-ink hover:underline underline-offset-2">
              {h.milestone.add}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Игра дня и совет ── */}
      <div className={cx("grid gap-4", FEATURES.dailyGame && "md:grid-cols-2")}>
        {FEATURES.dailyGame && <DailyGameWidget />}
        <Card className="grid content-start gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-accent-ink" />
              <Heading size={4} as="h2">
                {h.tip.title}
              </Heading>
            </div>
            <IconButton size="sm" label={h.tipRefresh} onClick={refreshTip}>
              <RotateCw size={16} />
            </IconButton>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={tip.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-4"
            >
              <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-inset text-2xl">
                {tip.icon}
              </span>
              <div className="grid gap-1">
                <p className="text-xs font-semibold text-accent-ink">{tip.category}</p>
                <p className="text-sm leading-snug text-fg">{tip.text}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <Card className="grid content-between gap-6">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-inset text-muted">{icon}</span>
      <div>
        <p className="font-display text-3xl font-extrabold leading-none text-fg tabular-nums">{value}</p>
        <p className="mt-1.5 text-sm text-muted">{label}</p>
      </div>
    </Card>
  );
}
