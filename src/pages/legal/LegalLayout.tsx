import { Link, NavLink, Outlet } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ButtonLink, Logo, cx } from "../../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import SiteLanguagePicker from "../../components/landing/SiteLanguagePicker";
import LandingFooter from "../../components/landing/LandingFooter";
import { LEGAL_DOCS } from "./legalInfo";

// Макет юридических страниц: шапка с вкладками документов, текст, общий подвал сайта
export default function LegalLayout() {
  const { user } = useAuth();
  const { t } = useI18n();
  const page = t.legal.page;

  const tabs = LEGAL_DOCS.map((doc) => {
    const Icon = doc.icon;
    return (
      <NavLink
        key={doc.key}
        to={doc.path}
        className={({ isActive }) =>
          cx(
            "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
            isActive ? "bg-surface text-fg shadow-xs" : "text-muted hover:text-fg",
          )
        }
      >
        <Icon size={15} />
        {t.legal.tabs[doc.key]}
      </NavLink>
    );
  });

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link to={user ? "/" : "/welcome"} className="group shrink-0">
            <Logo />
          </Link>

          <nav aria-label={page.docsNav} className="hidden items-center gap-1 rounded-full bg-inset p-1 lg:flex">
            {tabs}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <SiteLanguagePicker />
            <ButtonLink to={user ? "/" : "/register"} size="sm" iconRight={<ArrowRight size={16} />}>
              {user ? page.openApp : page.signUp}
            </ButtonLink>
          </div>
        </div>

        {/* Вкладки документов на узких экранах — горизонтальная прокрутка */}
        <nav
          aria-label={page.docsNav}
          className="flex gap-1 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:px-8 lg:hidden [&::-webkit-scrollbar]:hidden"
        >
          {tabs}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-8 sm:pt-14">
        <Outlet />
      </main>

      <LandingFooter />
    </div>
  );
}
