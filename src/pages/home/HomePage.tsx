import { useState, useEffect, useMemo } from 'react';
import { useNavigate} from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../firebase/firestore';
import { getCollections } from '../../utils/storage';
import { DAILY_WORDS } from '../../data/home/dailyWords';
import { STUDY_TIPS } from '../../data/home/tips';
import { Flame, Play, BookOpen, Lightbulb, RotateCw, Plus, Compass, Target} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(() => {
    if (!user?.uid) return null;
    const saved = localStorage.getItem(`profile_cache_${user.uid}`);
    try { return saved ? JSON.parse(saved) : null; }
    catch { return null; }
  });

  const [stats, setStats] = useState(() => {
    if (!user?.uid) return { totalDecks: 0, totalCards: 0 };
    const saved = localStorage.getItem(`stats_cache_${user.uid}`);
    try { return saved ? JSON.parse(saved) : { totalDecks: 0, totalCards: 0 }; }
    catch { return { totalDecks: 0, totalCards: 0 }; }
  });

  const [currentTip, setCurrentTip] = useState(STUDY_TIPS[0]);
  const [loading, setLoading] = useState(!profile);

  const dailyWord = useMemo(() => {
    const dayTimestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const index = dayTimestamp % DAILY_WORDS.length;
    return DAILY_WORDS[index];
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user?.uid) return;
      try {
        const [p, c] = await Promise.all([getUserProfile(user.uid), getCollections()]);
        const newStats = {
          totalDecks: c.length,
          totalCards: c.reduce((s, coll) => s + coll.cards.length, 0)
        };
        setProfile(p);
        setStats(newStats);
        localStorage.setItem(`profile_cache_${user.uid}`, JSON.stringify(p));
        localStorage.setItem(`stats_cache_${user.uid}`, JSON.stringify(newStats));
        if (loading) {
          setCurrentTip(STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
        }
      } catch (e) {
        console.error('Home load error:', e);
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
    
    const phrases = {
      morning: [
        "God morgen", "Доброе утро", "Утренняя разминка?", 
        "Klar for litt norsk?", "Время для кофе и слов", "Как спалось?"
      ],
      afternoon: [
        "God dag", "Добрый день", "Продуктивного дня", 
        "Hvordan går det?", "Время сделать перерыв", "Продолжим обучение?"
      ],
      evening: [
        "God kveld", "Добрый вечер", "Приятного вечера", 
        "Kveldsøkt?", "Вечернее повторение", "Подведем итоги дня?"
      ],
      night: [
        "God natt", "Доброй ночи", "Не спится?", 
        "Nattugle?", "Тихое время для учебы", "Ночная смена"
      ]
    };

    let selectedPeriod: keyof typeof phrases;
    if (hour >= 5 && hour < 12) selectedPeriod = 'morning';
    else if (hour >= 12 && hour < 18) selectedPeriod = 'afternoon';
    else if (hour >= 18 && hour < 23) selectedPeriod = 'evening';
    else selectedPeriod = 'night';

    const options = phrases[selectedPeriod];
    // Используем час + дату как сид, чтобы приветствие было разным, 
    // но стабильным в течение часа и не прыгало при каждом рендере.
    const index = (hour + new Date().getDate()) % options.length;
    return options[index];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-32 pt-6 space-y-5"
    >

      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between
                      bg-white/60 dark:bg-[#1A1917]/60
                      backdrop-blur-xl
                      p-3 pr-5 rounded-[2rem]
                      border border-[#E0DBD3] dark:border-[#2E2C29]
                      sticky top-18 z-50 shadow-sm">

        {/* Avatar + greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0
                          bg-[#EDEAE4] dark:bg-[#242220]
                          flex items-center justify-center">
            {profile?.photoURL ? (
              <img src={profile.photoURL} className="object-cover w-full h-full" alt="avatar" />
            ) : (
              <span className="text-base">🧑‍💻</span>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] leading-none mb-1.5
                          text-[#B5B0A8] dark:text-[#4A4742]">
              {greeting}
            </p>
            <p className="font-serif italic text-[17px] leading-none
                          text-[#1A1714] dark:text-[#F0EDE8]">
              {profile?.displayName?.split(' ')[0] || (loading ? '…' : 'Гость')}
            </p>
          </div>
        </div>

        {/* Streak badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                        bg-[#FFF0ED] dark:bg-[#2A1A15]">
          <Flame
            size={15}
            strokeWidth={0}
            className={
              profile?.currentStreak > 0
                ? 'fill-[#FF5733] dark:fill-[#FF6B47] text-[#FF5733] dark:text-[#FF6B47]'
                : 'fill-[#B5B0A8] dark:fill-[#4A4742] text-[#B5B0A8] dark:text-[#4A4742]'
            }
          />
          <span className="text-[13px] font-bold text-[#FF5733] dark:text-[#FF6B47]">
            {profile?.currentStreak || 0}
          </span>
        </div>
      </div>

      {/* 2. BENTO GRID */}
      <div className="grid grid-cols-12 gap-4">
        {/* ── Hero card: "Пора повторить" ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 0.99 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/words')}
          className="col-span-12 md:col-span-8
                     relative overflow-hidden cursor-pointer
                     bg-[#1A1714] dark:bg-[#F0EDE8]
                     rounded-[2rem] p-8 min-h-[240px]"
        >
          {/* Decorative bg icon */}
          <div className="absolute right-[-6%] bottom-[-8%] rotate-12 pointer-events-none
                          opacity-[0.06] text-[#F5F2ED] dark:text-[#1A1714]">
            <Compass size={220} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between gap-8">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full
                               text-[10px] font-semibold uppercase tracking-[0.15em]
                               bg-white/10 dark:bg-black/10
                               text-[#F5F2ED] dark:text-[#1A1714]">
                Продолжить обучение
              </span>
              <h2 className="font-serif italic leading-[0.95]
                             text-[#F5F2ED] dark:text-[#1A1714]
                             text-4xl md:text-5xl">
                Пора<br />повторить
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg flex-shrink-0
                              bg-[#FF5733] dark:bg-[#FF6B47]
                              hover:opacity-90 transition-opacity">
                <Play size={18} fill="white" color="white" className="ml-0.5" />
              </div>
              <p className="text-[13px] font-medium
                            text-[#F5F2ED]/60 dark:text-[#1A1714]/60">
                Зайди и начни прямо сейчас
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Daily word ── */}
        <div
          className="col-span-12 md:col-span-4
                     flex flex-col justify-between
                     bg-white dark:bg-[#1A1917]
                     border border-[#E0DBD3] dark:border-[#2E2C29]
                     rounded-[2rem] p-7"
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4
                          text-[#FF5733] dark:text-[#FF6B47]">
              Слово дня
            </p>
            <h3 className="font-serif italic leading-tight text-[26px]
                           text-[#1A1714] dark:text-[#F0EDE8]">
              {dailyWord.word}
            </h3>
            <p className="text-[13px] font-medium italic mt-1
                          text-[#7A756E] dark:text-[#8A867F]">
              {dailyWord.translation}
            </p>
            <p className="text-[11px] leading-relaxed line-clamp-2 mt-3
                          text-[#B5B0A8] dark:text-[#4A4742]">
              {dailyWord.context}
            </p>
          </div>
          <button className="flex items-center gap-2 mt-5
                             text-[11px] font-semibold uppercase tracking-[0.12em]
                             text-[#B5B0A8] dark:text-[#4A4742]
                             hover:text-[#FF5733] dark:hover:text-[#FF6B47]
                             transition-colors">
            В коллекцию <Plus size={13} />
          </button>
        </div>

        {/* ── Study tip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-7
                     bg-white dark:bg-[#1A1917]
                     border border-[#E0DBD3] dark:border-[#2E2C29]
                     rounded-[2rem] p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={15} className="text-[#FF5733] dark:text-[#FF6B47]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em]
                               text-[#FF5733] dark:text-[#FF6B47]">
                Совет дня
              </span>
            </div>
            <button
              onClick={refreshTip}
              className="p-2 rounded-full transition-colors
                         text-[#B5B0A8] dark:text-[#4A4742]
                         hover:bg-[#EDEAE4] dark:hover:bg-[#242220]"
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-1
                              text-[#FF5733] dark:text-[#FF6B47]">
                  {currentTip.category}
                </p>
                <p className="text-[14px] font-medium leading-snug
                              text-[#1A1714] dark:text-[#F0EDE8]">
                  {currentTip.text}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* ── Stats mini cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="col-span-12 md:col-span-5 grid grid-cols-2 gap-4"
        >
          {/* Words */}
          <div className="flex flex-col justify-center items-center text-center
                          bg-[#EDEAE4] dark:bg-[#242220]
                          rounded-[1.75rem] p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center
                            bg-white/70 dark:bg-[#1A1917]/70">
              <BookOpen size={17} className="text-[#3B82F6] dark:text-[#60A5FA]" />
            </div>
            <p className="font-serif text-[28px] leading-none
                          text-[#1A1714] dark:text-[#F0EDE8]">
              {stats.totalCards}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-1.5
                          text-[#B5B0A8] dark:text-[#4A4742]">
              Слов
            </p>
          </div>

          {/* Decks */}
          <div className="flex flex-col justify-center items-center text-center
                          bg-[#EDEAE4] dark:bg-[#242220]
                          rounded-[1.75rem] p-5">
            <div className="w-9 h-9 rounded-xl mb-3 flex items-center justify-center
                            bg-white/70 dark:bg-[#1A1917]/70">
              <Target size={17} className="text-[#22C55E] dark:text-[#4ADE80]" />
            </div>
            <p className="font-serif text-[28px] leading-none
                          text-[#1A1714] dark:text-[#F0EDE8]">
              {stats.totalDecks}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mt-1.5
                          text-[#B5B0A8] dark:text-[#4A4742]">
              Сетов
            </p>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════
          3. QUICK LINKS
          ══════════════════════════════════════ */}

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <Link
          to="/words"
          className="group flex items-center justify-between
                     p-2 pl-5
                     bg-white dark:bg-[#1A1917]
                     border border-[#E0DBD3] dark:border-[#2E2C29]
                     rounded-full hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0
                            bg-[#FFF0ED] dark:bg-[#2A1A15]">
              <Layout size={15} className="text-[#FF5733] dark:text-[#FF6B47]" />
            </div>
            <span className="font-serif italic text-[15px]
                             text-[#1A1714] dark:text-[#F0EDE8]">
              Моя библиотека
            </span>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all
                          bg-[#EDEAE4] dark:bg-[#242220]
                          text-[#7A756E] dark:text-[#8A867F]
                          group-hover:bg-[#FF5733] dark:group-hover:bg-[#FF6B47]
                          group-hover:text-white">
            <ChevronRight size={18} />
          </div>
        </Link>

        <Link
          to="/settings"
          className="group flex items-center justify-between
                     p-2 pl-5
                     bg-white dark:bg-[#1A1917]
                     border border-[#E0DBD3] dark:border-[#2E2C29]
                     rounded-full hover:shadow-lg transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0
                            bg-[#EFF6FF] dark:bg-[#1e3a5f]/30">
              <RotateCw size={15} className="text-[#3B82F6] dark:text-[#60A5FA]" />
            </div>
            <span className="font-serif italic text-[15px]
                             text-[#1A1714] dark:text-[#F0EDE8]">
              История сессий
            </span>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all
                          bg-[#EDEAE4] dark:bg-[#242220]
                          text-[#7A756E] dark:text-[#8A867F]
                          group-hover:bg-[#3B82F6] dark:group-hover:bg-[#60A5FA]
                          group-hover:text-white">
            <ChevronRight size={18} />
          </div>
        </Link>

      </div> */}
    </motion.div>
  );
}
