import Sidebar from "../../components/ui/Sidebar";
import { IconButton, Logo, cx } from "../../ui";
import { APP_LANGUAGES } from "../../locales/languages";
import BottomNav from "../../components/ui/BottomNav";
import { Outlet, Link, Navigate } from "react-router-dom";
import { Menu, Languages, Flame, Trophy, ChevronRight, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingModal, {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_RESTART_EVENT,
} from "../../components/OnboardingModal";
import VerifyEmailBanner from "../../components/VerifyEmailBanner";
import InstallPrompt from "../../components/InstallPrompt";
import SearchModal from "../../components/SearchModal";
import CourseSwitcher from "../../components/courses/CourseSwitcher";

const SIDEBAR_KEY = "sidebar-open";

export default function MainLayout() {
  const { t, language, setLanguage } = useI18n();
  const sh = t.shell;
  const days = (n: number) => plural(getLanguageInfo(language).htmlLang, n, sh.streak.days);
  const { profile, courses, coursesReady } = useData();
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

  // Без курса приложение начинается с выбора языка
  if (coursesReady && courses.length === 0) return <Navigate to="/start" replace />;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="fixed inset-x-0 top-0 z-100 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="hidden md:contents">
              <IconButton label={sh.menu} onClick={toggleSidebar} className="mr-3">
                <Menu size={22} />
              </IconButton>
            </span>

            <Link to="/" className="flex items-center gap-2 group relative">

              <div className="flex items-center gap-1.5 relative">
                <Logo />

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
                    className="cursor-help select-none px-1.5 py-0.5 rounded-md bg-inset border border-line text-muted text-2xs font-semibold uppercase tracking-widest leading-none active:scale-90 transition-transform"
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
                        className="absolute left-full top-0 ml-2 whitespace-nowrap bg-black dark:bg-white text-on-inverse text-2xs py-1 px-2 rounded-lg shadow-xl z-110 font-medium"
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
            <CourseSwitcher />

            {/* Поиск по карточкам */}
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              title={sh.searchHint}
              aria-label={sh.searchHint}
              className="flex h-9 items-center gap-2 rounded-full bg-inset px-3 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <Search size={16} />
              <span className="hidden sm:inline">{sh.search}</span>
              <kbd className="hidden rounded-md border border-line bg-surface px-1.5 py-0.5 text-2xs font-semibold text-faint md:inline">
                ⌘K
              </kbd>
            </button>

            {/* STREAK WIDGET */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStreakCard(!showStreakCard)}
                aria-expanded={showStreakCard}
                aria-label={`${sh.streak.label}: ${days(streakData.current)}`}
                className={cx(
                  "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold tabular-nums transition-colors",
                  streakData.isActive ? "bg-accent-soft text-accent-ink" : "bg-inset text-muted hover:text-fg",
                )}
              >
                <Flame size={17} className={streakData.isActive ? "fill-accent text-accent" : ""} />
                {streakData.current}
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
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      className="absolute right-0 z-50 mt-3 grid w-72 gap-4 rounded-3xl border border-line bg-surface p-5 shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cx(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                            streakData.isActive ? "bg-accent-soft text-accent" : "bg-inset text-faint",
                          )}
                        >
                          <Flame size={22} className={streakData.isActive ? "fill-accent" : ""} />
                        </span>
                        <div>
                          <p className="text-sm text-muted">{sh.streak.label}</p>
                          <p className="font-display text-xl font-extrabold text-fg">{days(streakData.current)}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted">
                          <Trophy size={15} />
                          {sh.streak.best}
                        </span>
                        <span className="font-semibold text-fg">{days(streakData.longest)}</span>
                      </div>
                      <p
                        className={cx(
                          "rounded-2xl px-3.5 py-3 text-sm leading-snug",
                          streakData.isActive ? "bg-success-soft text-success" : "bg-accent-soft text-accent-ink",
                        )}
                      >
                        {streakData.isActive ? sh.streak.active : sh.streak.inactive}
                      </p>
                      <Link
                        to="/profile"
                        onClick={() => setShowStreakCard(false)}
                        className="flex items-center justify-between rounded-2xl bg-inset px-3.5 py-3 text-sm font-medium text-fg transition-colors hover:bg-track"
                      >
                        {sh.streak.more}
                        <ChevronRight size={16} />
                      </Link>
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
                className="flex items-center gap-2 p-2 hover:bg-inset rounded-xl transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-inset flex items-center justify-center border border-line">
                  <Languages
                    size={16}
                    className="text-muted"
                  />
                </div>
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">
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
                      className="absolute right-0 mt-2 w-56 bg-surface rounded-2xl shadow-2xl border border-line py-2 z-50 overflow-hidden"
                    >
                      {APP_LANGUAGES.map(
                        ({ code: lang, flag, label }) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setLanguage(lang);
                              setShowLangMenu(false);
                            }}
                            className={`w-full px-5 py-3 text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                              language === lang
                                ? "bg-special text-white"
                                : "hover:bg-inset "
                            }`}
                          >
                            {flag} {label}
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
