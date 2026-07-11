import Sidebar from "../../components/ui/Sidebar";
import BottomNav from "../../components/ui/BottomNav";
import { Outlet, Link } from "react-router-dom";
import { Menu, Languages, Flame, Trophy, ChevronRight, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { Language } from "../../locales";
import { useData } from "../../contexts/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingModal, {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_RESTART_EVENT,
} from "../../components/OnboardingModal";
import VerifyEmailBanner from "../../components/VerifyEmailBanner";
import InstallPrompt from "../../components/InstallPrompt";
import SearchModal from "../../components/SearchModal";

const SIDEBAR_KEY = "sidebar-open";

export default function MainLayout() {
  const { language, setLanguage } = useI18n();
  const { profile } = useData();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [showStreakCard, setShowStreakCard] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === "true";
  });

  const toggleSidebar = () => setOpen((o) => !o);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);

  // Show onboarding once for new users
  useEffect(() => {
    if (!localStorage.getItem(ONBOARDING_STORAGE_KEY)) {
      const timer = setTimeout(() => setShowOnboarding(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for restart event from ProfilePage
  useEffect(() => {
    const handler = () => setShowOnboarding(true);
    window.addEventListener(ONBOARDING_RESTART_EVENT, handler);
    return () => window.removeEventListener(ONBOARDING_RESTART_EVENT, handler);
  }, []);

  // Cmd/Ctrl+K → open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const streakData = useMemo(() => {
    if (!profile) return { current: 0, isActive: false, longest: 0 };
    const lastDate =
      typeof profile.lastStudyDate?.toDate === 'function'
        ? profile.lastStudyDate.toDate()
        : profile.lastStudyDate
        ? new Date(profile.lastStudyDate)
        : null;
    const isActive = !!lastDate && lastDate.toDateString() === new Date().toDateString();
    return {
      current: profile.currentStreak ?? 0,
      isActive,
      longest: profile.longestStreak ?? 0,
    };
  }, [profile]);

  const languageNames = {
    en: "🇬🇧 English (UK)",
    no: "🇳🇴 Norsk (Bokmål)",
    ru: "🇷🇺 Русский",
    uk: "🇺🇦 Українстька",
  };

  return (
    <div className="min-h-dvh bg-[#F5F2ED] dark:bg-[#0F0E0C] text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 right-0 z-100 bg-[#F5F2ED] dark:bg-[#0F0E0C]">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 mr-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"
            >
              <Menu size={22} />
            </button>

            <Link to="/" className="flex items-center gap-2 group relative">
              {/* Иконка */}
              <div className="p-1.5 bg-[#FF5733] rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/25 shrink-0">
                <img
                  src="/icon-192.png"
                  alt="logo"
                  className="w-5 h-5 brightness-0 invert"
                />
              </div>

              <div className="flex items-baseline gap-1.5 relative">
                <h1 className="text-xl font-black tracking-tighter leading-none">
                  KOLO
                </h1>

                {/* Бейдж "Beta" — закомментирован по просьбе пользователя */}
                {false && (
                <div className="relative">
                  <span
                    onContextMenu={(e) => {
                      e.preventDefault(); // Чтобы на мобилках не вылезало меню
                      setShowEasterEgg(true);
                      setTimeout(() => setShowEasterEgg(false), 3000);
                    }}
                    onClick={(e) => {
                      if (e.detail === 4) {
                        // Тройной клик - классика пасхалок
                        setShowEasterEgg(true);
                        setTimeout(() => setShowEasterEgg(false), 3000);
                      }
                    }}
                    className="cursor-help select-none px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[9px] font-bold uppercase tracking-widest leading-none active:scale-90 transition-transform"
                  >
                    Beta
                  </span>

                  {/* Сама пасхалка */}
                  <AnimatePresence>
                    {showEasterEgg && (
                      <motion.div
                        initial={{ opacity: 0, x: 10, scale: 0.8 }}
                        animate={{ opacity: 1, x: 20, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute left-full top-0 ml-2 whitespace-nowrap bg-black dark:bg-white text-white dark:text-black text-[10px] py-1 px-2 rounded-lg shadow-xl z-110 font-medium"
                      >
                        <div className="absolute -left-1 top-2 w-2 h-2 bg-black dark:bg-white rotate-45" />
                        Бридж добавил, чтоб не расстраивались, что много багов
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                )}
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* SEARCH BUTTON */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E] dark:text-[#8A867F] hover:text-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] transition-all"
              title="Search cards (⌘K)"
            >
              <Search size={16} />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Search
              </span>
              <kbd className="hidden md:inline text-[9px] font-bold bg-white dark:bg-[#1A1917] px-1.5 py-0.5 rounded-md border border-[#E0DBD3] dark:border-[#2E2C29] text-[#B5B0A8]">
                ⌘K
              </kbd>
            </button>

            {/* STREAK WIDGET */}
            <div className="relative">
              <button
                onClick={() => setShowStreakCard(!showStreakCard)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-500 ${
                  streakData.isActive
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-70 hover:opacity-100"
                }`}
              >
                <Flame
                  size={18}
                  fill={streakData.isActive ? "currentColor" : "none"}
                  className={streakData.isActive ? "animate-pulse" : ""}
                />
                <span className="font-black text-sm">{streakData.current}</span>
              </button>

              {/* STREAK DROP CARD */}
              <AnimatePresence>
                {showStreakCard && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowStreakCard(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-72 z-50 overflow-hidden bg-white dark:bg-gray-800 rounded-4xl shadow-2xl border border-gray-100 dark:border-gray-700"
                    >
                      <div
                        className={`p-6 ${streakData.isActive ? "bg-orange-500" : "bg-gray-400"} transition-colors`}
                      >
                        <div className="flex justify-between items-start text-white">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                              Ваш ударный режим
                            </p>
                            <h3 className="text-3xl font-black">
                              {streakData.current} дн.
                            </h3>
                          </div>
                          <Flame
                            size={32}
                            fill="white"
                            className={
                              streakData.isActive
                                ? "animate-bounce"
                                : "opacity-50"
                            }
                          />
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Trophy size={14} />
                            <span>Рекорд</span>
                          </div>
                          <span className="font-bold">
                            {streakData.longest} дн.
                          </span>
                        </div>

                        {!streakData.isActive ? (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
                            <p className="text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
                              Упс! Ваш огонек потух. Пройдите урок сегодня,
                              чтобы зажечь его снова!
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                            <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">
                              Вы сегодня молодец! Огонек горит ярко.
                              Возвращайтесь завтра.
                            </p>
                          </div>
                        )}

                        <Link
                          to="/profile"
                          onClick={() => setShowStreakCard(false)}
                          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                        >
                          Подробнее в профиле
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Language switcher — закомментирован по просьбе пользователя */}
            {false && (
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                  <Languages
                    size={16}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
                <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">
                  {language}
                </span>
              </button>

              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLangMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden"
                    >
                      {(Object.keys(languageNames) as Language[]).map(
                        (lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang);
                              setShowLangMenu(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm font-bold flex items-center justify-between transition-colors ${
                              language === lang
                                ? "bg-purple-600 text-white"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          >
                            {languageNames[lang]}
                            {language === lang && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            )}
                          </button>
                        ),
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar open={open} />

        {/* pb-24 = ровно высота BottomNav (h-24=96px); pb-20 (80px) оставлял
            низ страницы частично под нижним меню на мобилке */}
        <main className="flex-1 w-full max-w-5xl mx-auto pt-6 pb-24 md:pb-6 px-5 sm:px-6 lg:px-8">
          <VerifyEmailBanner />
          <Outlet />
        </main>
      </div>

      <BottomNav />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
      <InstallPrompt />
    </div>
  );
}
