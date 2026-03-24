import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { getUserProfile } from "../../firebase/firestore";
import { getCollections } from "../../utils/storage";
// import { DAILY_WORDS } from "../../data/home/dailyWords";
import { STUDY_TIPS } from "../../data/home/tips";
import {
  Flame,
  Play,
  BookOpen,
  Lightbulb,
  RotateCw,
  Compass,
  Target,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();

  const [profile, setProfile] = useState<any>(() => {
    if (!user?.uid) return null;
    const saved = localStorage.getItem(`profile_cache_${user.uid}`);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [stats, setStats] = useState(() => {
    if (!user?.uid) return { totalDecks: 0, totalCards: 0 };
    const saved = localStorage.getItem(`stats_cache_${user.uid}`);
    try {
      return saved ? JSON.parse(saved) : { totalDecks: 0, totalCards: 0 };
    } catch {
      return { totalDecks: 0, totalCards: 0 };
    }
  });

  const [currentTip, setCurrentTip] = useState(STUDY_TIPS[0]);
  const [loading, setLoading] = useState(!profile);

  // const dailyWord = useMemo(() => {
  //   const dayTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  //   const index = dayTimestamp % DAILY_WORDS.length;
  //   return DAILY_WORDS[index];
  // }, []);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        const [p, c] = await Promise.all([
          getUserProfile(user.uid),
          getCollections(),
        ]);
        const newStats = {
          totalDecks: c.length,
          totalCards: c.reduce((s, coll) => s + coll.cards.length, 0),
        };
        setProfile(p);
        setStats(newStats);
        localStorage.setItem(`profile_cache_${user.uid}`, JSON.stringify(p));
        localStorage.setItem(
          `stats_cache_${user.uid}`,
          JSON.stringify(newStats),
        );
        if (loading) {
          setCurrentTip(
            STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)],
          );
        }
      } catch (e) {
        console.error("Home load error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.uid]);

  const refreshTip = () => {
    setCurrentTip(STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* 1. TOP BAR - Оставил инлайном, так как это специфичный плавающий элемент */}
      <div className="flex items-center justify-between bg-white/60 dark:bg-[#1A1917]/60 backdrop-blur-xl p-3 pr-5 rounded-[2rem] border border-[#E0DBD3] dark:border-[#2E2C29] sticky top-18 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-[#EDEAE4] dark:bg-[#242220] flex items-center justify-center">
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
                (loading ? "…" : t.home.guest)}
            </p>
          </div>
        </div>

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

      {/* 2. BENTO GRID */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero card - Теперь b-block */}
        <motion.div
          whileHover={{ scale: 0.99 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/words")}
          className="b-block col-span-12 md:col-span-8 relative overflow-hidden cursor-pointer min-h-[240px]"
        >
          <div className="absolute right-[-6%] bottom-[-8%] rotate-12 pointer-events-none opacity-[0.06]">
            <Compass size={220} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="space-y-3">
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0 bg-[#FF5733]">
                <Play size={18} fill="white" color="white" className="ml-0.5" />
              </div>
              <p className="text-[13px] font-medium opacity-60">
                {t.home.hero.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily word - Теперь w-block */}
        {/* <div className="w-block col-span-12 md:col-span-4 flex flex-col justify-between p-7">
          <div>
            <p className="uc-title mb-4">{t.home.dailyWord.title}</p>
            <h3 className="u-title text-[26px] leading-tight">
              {dailyWord.word}
            </h3>
            <p className="text-[13px] font-medium italic mt-1 text-[#7A756E]">
              {dailyWord.translation}
            </p>
            <p className="text-[11px] leading-relaxed line-clamp-2 mt-3 text-[#B5B0A8]">
              {dailyWord.context}
            </p>
          </div>
          <button className="flex items-center gap-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#B5B0A8] hover:text-[#FF5733] transition-colors">
            {t.home.dailyWord.addToCollection} <Plus size={13} />
          </button>
        </div> */}
        {/* Daily word - Интерактивная заглушка */}

        {/* Daily word - Заглушка (WIP) */}
        <div className="w-block col-span-12 md:col-span-4 flex flex-col justify-between p-7 relative overflow-hidden group">
          {/* Декоративный элемент на фоне (опционально) */}
          <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.05] rotate-12 transition-transform group-hover:rotate-0 duration-700">
            <Zap size={160} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <p className="uc-title">{t.home.dailyWord.title}</p>
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#FF5733] text-white uppercase tracking-tighter">
                WIP
              </span>
            </div>

            <h3 className="u-title text-[24px] leading-tight text-[#1A1714] dark:text-[#F0EDE8]">
              Venter на <span className="text-[#FF5733] italic">чудо...</span>
            </h3>

            <p className="text-[12px] font-medium leading-relaxed mt-4 text-[#7A756E] dark:text-[#8A867F] max-w-[200px]">
              Мы подбираем лучшие слова для вас прямо сейчас.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#FF5733]">
              <Sparkles size={12} /> Coming in v0.2.8
            </div>
            <p className="text-[10px] font-medium text-[#B5B0A8]">
              Почти готово, честное норвежское.
            </p>
          </div>

          {/* Легкий эффект блюра на заднем плане, если хочешь подчеркнуть статус "в разработке" */}
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[1px] pointer-events-none" />
        </div>

        {/* Study tip - Теперь w-block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-block col-span-12 md:col-span-7 p-6"
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

        {/* Stats mini cards - Теперь g-block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="col-span-12 md:col-span-5 grid grid-cols-2 gap-4"
        >
          <div className="g-block flex flex-col justify-center items-center text-center p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-white/70 dark:bg-[#1A1917]/70">
              <BookOpen size={17} className="text-[#3B82F6]" />
            </div>
            <p className="u-title text-[28px] leading-none">
              {stats.totalCards}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mt-1.5 text-[#B5B0A8]">
              {t.home.stats.words}
            </p>
          </div>

          <div className="g-block flex flex-col justify-center items-center text-center p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center bg-white/70 dark:bg-[#1A1917]/70">
              <Target size={17} className="text-[#22C55E]" />
            </div>
            <p className="u-title text-[28px] leading-none">
              {stats.totalDecks}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] mt-1.5 text-[#B5B0A8]">
              {t.home.stats.decks}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
