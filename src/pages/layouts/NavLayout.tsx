import { ArrowLeft } from "lucide-react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { IconButton } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";

// Макет внутренних страниц (набор, настройки, поддержка, обновления…): кнопка «назад» и короткий подвал
export default function NavLayout() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-dvh bg-bg">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="flex h-14 items-center px-3">
          <IconButton label={t.back} onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </IconButton>
        </div>
      </header>

      {/* max-w-5xl — место для боковой колонки «Обновлений»; узкие страницы сужают себя сами */}
      <main className="mx-auto max-w-5xl px-5 pb-16 pt-24 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <p className="text-sm text-faint">
            © {new Date().getFullYear()} Kolo Sets ·{" "}
            <a href="https://dakuta.dev" className="hover:text-fg">
              Dakuta
            </a>
          </p>
          <nav className="flex gap-5 text-sm text-muted">
            <Link to="/privacy" className="transition-colors hover:text-fg">
              {t.legal.tabs.privacy}
            </Link>
            <Link to="/terms" className="transition-colors hover:text-fg">
              {t.legal.tabs.terms}
            </Link>
            <Link to="/other/support" className="transition-colors hover:text-fg">
              {t.legal.page.support}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
