import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { TIPS_ICONS } from "../../data/home/tips";
import DailyGameWidget from "../../components/game/DailyGameWidget";
import { getDailyGoal, isDueCard } from "../../utils/storage";
import {
  Flame,
  Play,
  BookOpen,
  Lightbulb,
  RotateCw,
  Compass,
  Target,
  ArrowRight,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile, collections, totalCards, profileLoading } = useData();

  const tipKeys = useMemo(() => Object.keys(t.home.tips), [t.home.tips]);

  const [tipKey, setTipKey] = useState<string>(
    () => tipKeys[Math.floor(Math.random() * tipKeys.length)],
  );

  const currentTip = useMemo(() => {
    const tips = t.home.tips as Record<
      string,
      { category: string; text: string }
    >;
    const data = tips[tipKey] ?? tips[tipKeys[0]];
    return {
      icon: TIPS_ICONS[tipKey] ?? "💡",
      category: data.category,
      text: data.text,
    };
  }, [tipKey, t.home.tips, tipKeys]);

  const refreshTip = () => {
    setTipKey(tipKeys[Math.floor(Math.random() * tipKeys.length)]);
  };

  const stats = { totalDecks: collections.length, totalCards };

  const dueCount = useMemo(
    () =>
      collections.reduce((n, col) => n + col.cards.filter(isDueCard).length, 0),
    [collections],
  );

  const dailyGoal = getDailyGoal();

  const todayStudied = useMemo(() => {
    if (!profile?.studyHistory) return 0;
    const today = new Date().toISOString().split("T")[0];
    const entry = profile.studyHistory.find((d: any) => d.date === today);
    return entry?.cardsStudied ?? 0;
  }, [profile?.studyHistory]);

  const goalPct = Math.min(100, Math.round((todayStudied / dailyGoal) * 100));
  const goalMet = todayStudied >= dailyGoal;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let period: "morning" | "afternoon" | "evening" | "night";
    if (hour >= 5 && hour < 12) period = "morning";
    else if (hour >= 12 && hour < 18) period = "afternoon";
    else if (hour >= 18 && hour < 23) period = "evening";
    else period = "night";
    const options = t.home.greeting[period];
    const index = (hour + new Date().getDate()) % options.length;
    return options[index];
  }, [t.home.greeting]);

  // Progress towards a milestone
  const nextMilestone = useMemo(() => {
    const milestones = [10, 25, 50, 100, 200, 500];
    return milestones.find((m) => totalCards < m) ?? null;
  }, [totalCards]);

  const progressPct = nextMilestone
    ? Math.min(100, Math.round((totalCards / nextMilestone) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/60 dark:bg-[#1A1917]/60 backdrop-blur-xl p-3 pr-5 rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] sticky top-18 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#EDEAE4] dark:bg-[#242220] flex items-center justify-center">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                className="object-cover w-full h-full"
                alt="avatar"
              />
            ) : (
              <span className="text-base">🧑‍💻</span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] leading-none mb-1.5 text-[#B5B0A8] dark:text-[#4A4742]">
              {greeting}
            </p>
            <p className="u-title text-[17px] leading-none">
              {profile?.displayName?.split(" ")[0] ||
                (profileLoading ? "…" : t.home.guest)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15]">
            <Flame
              size={15}
              strokeWidth={0}
              className={
                profile?.currentStreak > 0
                  ? "fill-[#FF5733] text-[#FF5733]"
                  : "fill-[#B5B0A8] text-[#B5B0A8]"
              }
            />
            <span className="text-[13px] font-bold text-[#FF5733]">
              {profile?.currentStreak || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Review Queue — shown only when cards are due */}
        <AnimatePresence>
          {dueCount > 0 && (
            <motion.div
              key="review-queue"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="col-span-12"
            >
              <motion.div
                whileHover={{ scale: 0.995 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/review")}
                className="w-block flex items-center gap-4 p-5 cursor-pointer border-[#FF5733]/20 bg-[#FFF8F6] dark:bg-[#1F1410]"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FF5733] flex items-center justify-center shrink-0 shadow-lg shadow-[#FF5733]/30">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="uc-title text-[#FF5733]">Due for review</p>
                  <p className="u-title text-2xl leading-tight">
                    {dueCount} {dueCount === 1 ? "card" : "cards"} today
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FF5733] rounded-2xl shrink-0 shadow-md shadow-[#FF5733]/25">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    Review
                  </span>
                  <ArrowRight size={13} className="text-white" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero — Start studying */}
        <motion.div
          whileHover={{ scale: 0.99 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/words")}
          className="b-block col-span-12 md:col-span-8 relative overflow-hidden cursor-pointer min-h-55"
        >
          <div className="absolute right-[-6%] bottom-[-8%] rotate-12 pointer-events-none opacity-[0.06]">
            <Compass size={200} strokeWidth={1} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.15em] bg-white/10 dark:bg-black/10">
                {t.home.hero.badge}
              </span>
              <h2 className="u-title text-4xl md:text-5xl leading-[0.95]">
                {t.home.hero.titleFirst}
                <br />
                {t.home.hero.titleSecond}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg shrink-0 bg-[#FF5733]">
                <Play size={17} fill="white" color="white" className="ml-0.5" />
              </div>
              <p className="text-[13px] font-medium opacity-60">
                {t.home.hero.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats — compact 2-col */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-4">
          <div className="g-block flex-1 flex flex-col justify-center items-center text-center p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-white/70 dark:bg-[#1A1917]/70">
              <BookOpen size={17} className="text-[#3B82F6]" />
            </div>
            <p className="u-title text-[28px] leading-none">
              {stats.totalCards}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 text-[#B5B0A8]">
              {t.home.stats.words}
            </p>
          </div>
          <div className="g-block flex-1 flex flex-col justify-center items-center text-center p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-white/70 dark:bg-[#1A1917]/70">
              <Target size={17} className="text-[#22C55E]" />
            </div>
            <p className="u-title text-[28px] leading-none">
              {stats.totalDecks}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest mt-1.5 text-[#B5B0A8]">
              {t.home.stats.decks}
            </p>
          </div>
        </div>

        {/* Daily Game Widget */}
        <div className="col-span-12 md:col-span-5">
          <DailyGameWidget />
        </div>

        {/* Progress + Daily Goal card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="w-block col-span-12 md:col-span-7 p-6 flex flex-col gap-6"
        >
          {/* Daily goal section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="uc-title">Today's Goal</p>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  goalMet ? "bg-[#22C55E]/10 text-[#22C55E]" : "text-[#B5B0A8]"
                }`}
              >
                {todayStudied} / {dailyGoal}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-[#EDEAE4] dark:bg-[#2E2C29] overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalPct}%` }}
                transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                className={`h-full rounded-full transition-colors ${goalMet ? "bg-[#22C55E]" : "bg-[#FF5733]"}`}
              />
            </div>
            <p className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F]">
              {goalMet
                ? "Daily goal reached! Great work 🎉"
                : `${dailyGoal - todayStudied} more cards to hit today's goal`}
            </p>
          </div>

          {/* Milestone section */}
          <div className="pt-5 border-t border-[#EDEAE4] dark:border-[#2E2C29]">
            <div className="flex items-center justify-between mb-3">
              <p className="uc-title">Milestone</p>
              {nextMilestone && (
                <span className="text-[10px] font-bold text-[#B5B0A8]">
                  {totalCards} / {nextMilestone}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-[#EDEAE4] dark:bg-[#2E2C29] overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="h-full rounded-full bg-[#3B82F6]"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F]">
                {progressPct < 100 && nextMilestone
                  ? `${nextMilestone - totalCards} words to ${nextMilestone} 🎯`
                  : "All milestones reached 🚀"}
              </p>
              <button
                onClick={() => navigate("/words")}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#FF5733]"
              >
                Add words <ArrowRight size={11} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Study tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="w-block col-span-12 p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-[#FF5733]" />
              <span className="uc-title">{t.home.tip.title}</span>
            </div>
            <button
              onClick={refreshTip}
              className="p-2 rounded-full transition-colors text-[#B5B0A8] hover:bg-[#EDEAE4] dark:hover:bg-[#242220]"
            >
              <RotateCw size={14} />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTip.text}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-4"
            >
              <span className="text-4xl leading-none">{currentTip.icon}</span>
              <div>
                <p className="uc-title text-[8px] mb-1">
                  {currentTip.category}
                </p>
                <p className="text-[14px] font-medium leading-snug">
                  {currentTip.text}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
