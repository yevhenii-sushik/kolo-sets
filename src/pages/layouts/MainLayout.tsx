import Sidebar from "../../components/ui/Sidebar";
import { IconButton, Logo, cx } from "../../ui";
import BottomNav from "../../components/ui/BottomNav";
import { Outlet, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronRight, Share2 } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { motion, AnimatePresence } from "framer-motion";
import OnboardingModal from "../../components/OnboardingModal";
import { onboardingDone } from "../../utils/firstRun";
import VerifyEmailBanner from "../../components/VerifyEmailBanner";
import LegalUpdateBanner from "../../components/LegalUpdateBanner";
import { TrialBanner } from "../../components/auth/SaveProgress";
import InstallPrompt from "../../components/InstallPrompt";
import { FIND_WORD_EVENT } from "../../utils/wordSearch";
import CourseSwitcher from "../../components/courses/CourseSwitcher";
import { OrbitRing } from "../../components/progress/OrbitRing";
import { WeekCard } from "../../components/progress/WeekOrbit";
import { openOrbitShare } from "../../components/progress/ShareOrbitModal";
import { OrbitGoalModal } from "../../components/progress/OrbitGoalModal";
import PageLoading from "../../components/ui/PageLoading";
import { prefetchAppPages } from "../lazyPages";
import { localDateKey } from "../../utils/progress";

const SIDEBAR_KEY = "sidebar-open";

export default function MainLayout() {
  const { t, language } = useI18n();
  const sh = t.shell;
  const locale = getLanguageInfo(language).htmlLang;
  const { profile, progression, courses, coursesReady } = useData();
  const orbit = progression?.orbit;
  const [showWeekCard, setShowWeekCard] = useState(false);
  const [goalDismissed, setGoalDismissed] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === "true";
  });

  const toggleSidebar = () => setOpen((o) => !o);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);

  // Приложение открылось — в свободное время подгружаем код вкладок и сессий,
  // чтобы первый переход на них был без ожидания
  useEffect(prefetchAppPages, []);

  // Show onboarding once for new users
  useEffect(() => {
    if (!onboardingDone()) {
      const timer = setTimeout(() => setShowOnboarding(true), 900);
      return () => clearTimeout(timer);
    }
  }, []);


  // ⌘K / Ctrl+K — найти слово: поиск живёт на вкладке «Слова», а не в шапке каждой страницы
  // (на «Главной» или в «Наградах» искать нечего). С другой вкладки переходим туда, на ней — фокус в поле
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      // Открытое окно (новый набор, подтверждение) не бросаем на полпути
      if (document.querySelector('[aria-modal="true"]')) return;
      e.preventDefault();
      if (pathRef.current === "/words") window.dispatchEvent(new Event(FIND_WORD_EVENT));
      else navigate("/words", { state: { findWord: true } });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  // Цель недели новичок выбирает в пошаговом первом входе (StartPage). Кто её не выбрал (пришёл по ссылке на набор,
  // старый аккаунт) — окно в другой день после первой тренировки, а не сразу после урока: тогда оно мешает
  // (решение пользователя 2026-11-28). До этого цель ждёт в «Первых шагах» на главной
  const today = localDateKey(new Date());
  const studiedBefore = (profile?.studyHistory ?? []).some((d: { date?: string }) => !!d.date && d.date !== today);
  const needsGoal =
    !!progression && !progression.orbit.goalSet && !goalDismissed && !showOnboarding && onboardingDone() && studiedBefore;

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
              <Logo />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <CourseSwitcher />

            {/* ОРБИТА НЕДЕЛИ (docs/specs/02-progression.md) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWeekCard(!showWeekCard)}
                aria-expanded={showWeekCard}
                aria-label={orbit ? `${t.orbit.label}: ${plural(locale, orbit.streak, t.orbit.inRow)}` : t.orbit.label}
                className={cx(
                  "flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold tabular-nums transition-colors",
                  orbit?.closed ? "bg-accent-soft text-accent-ink" : "bg-inset text-muted hover:text-fg",
                )}
              >
                <OrbitRing goal={orbit?.goal ?? 3} done={orbit?.days.length ?? 0} closed={orbit?.closed ?? false} size={22} />
                {orbit && <span className={orbit.streak > 0 ? "text-fg" : undefined}>{orbit.streak}</span>}
              </button>

              <AnimatePresence>
                {showWeekCard && progression && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowWeekCard(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      className="absolute right-0 z-50 mt-3 grid w-80 max-w-[calc(100vw-2rem)] gap-4 rounded-3xl border border-line bg-surface p-5 shadow-xl"
                    >
                      <WeekCard progression={progression} />
                      <div className="grid gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowWeekCard(false);
                            openOrbitShare();
                          }}
                          className="flex items-center justify-between rounded-2xl bg-inset px-3.5 py-3 text-left text-sm font-medium text-fg transition-colors hover:bg-track"
                        >
                          {t.orbit.share.title}
                          <Share2 size={16} />
                        </button>
                        <Link
                          to="/profile"
                          onClick={() => setShowWeekCard(false)}
                          className="flex items-center justify-between rounded-2xl bg-inset px-3.5 py-3 text-sm font-medium text-fg transition-colors hover:bg-track"
                        >
                          {t.orbit.more}
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar open={open} />

        {/* pb-24 = ровно высота BottomNav (h-24=96px); pb-20 (80px) оставлял
            низ страницы частично под нижним меню на мобилке */}
        <main className="flex-1 w-full max-w-5xl mx-auto pt-6 pb-24 md:pb-6 px-5 sm:px-6 lg:px-8">
          <TrialBanner />
          <VerifyEmailBanner />
          <LegalUpdateBanner />
          {/* Своя граница: шапка и меню не пропадают, пока грузится код вкладки */}
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <BottomNav />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <OrbitGoalModal open={needsGoal} onClose={() => setGoalDismissed(true)} />

      <InstallPrompt />
    </div>
  );
}
