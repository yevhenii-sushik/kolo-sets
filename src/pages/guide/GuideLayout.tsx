import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Logo, cx } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import SiteLanguagePicker from "../../components/landing/SiteLanguagePicker";
import LandingFooter from "../../components/landing/LandingFooter";
import { GUIDE_PAGES, useGuide } from "./guideContent";

// Макет страниц «О Kolo» — как у юридических: шапка с вкладками страниц, текст, общий подвал сайта
export default function GuideLayout() {
  const { user } = useAuth();
  const { t } = useI18n();
  const guide = useGuide();
  const page = t.legal.page;

  const tabs = guide
    ? GUIDE_PAGES.map(({ key, path }) => (
        <NavLink
          key={key}
          to={path}
          className={({ isActive }) =>
            cx(
              "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg",
            )
          }
        >
          {guide.pages[key].tab}
        </NavLink>
      ))
    : null;

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link to={user ? "/" : "/welcome"} className="group shrink-0">
            <Logo />
          </Link>

          <nav aria-label={guide?.nav} className="hidden items-center gap-1 rounded-full bg-inset p-1 lg:flex">
            {tabs}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <SiteLanguagePicker />
            <ButtonLink to={user ? "/" : "/register"} size="sm" iconRight={<ArrowRight size={16} />}>
              {user ? page.openApp : page.signUp}
            </ButtonLink>
          </div>
        </div>

        {/* Вкладки на узких экранах — горизонтальная прокрутка */}
        <nav
          aria-label={guide?.nav}
          className="flex gap-1 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-8 lg:hidden [&::-webkit-scrollbar]:hidden"
        >
          {tabs}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-8 sm:pt-16">
        <Outlet />
      </main>

      <LandingFooter />
    </div>
  );
}
