import { Link, useLocation } from "react-router-dom";
import { Badge, Logo, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { LANGUAGES } from "../../locales/languages";
import { openCookieSettings } from "../../utils/consent";
import { LEGAL } from "../../pages/legal/legalInfo";

// Подвал сайта — ночной синий в обеих темах (bg-brand-night), как иконка приложения и превью ссылок

type FooterLink = {
  label: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
  badge?: string;
};

const LINK_CLASS = "text-sm text-white/60 hover:text-white transition-colors";

function FooterItem({ link }: { link: FooterLink }) {
  const badge = link.badge && (
    <Badge tone="warning" className="ml-2 align-middle">
      {link.badge}
    </Badge>
  );
  if (link.onClick) {
    return (
      <button type="button" onClick={link.onClick} className={cx(LINK_CLASS, "text-left")}>
        {link.label}
      </button>
    );
  }
  if (link.to) {
    return (
      <Link to={link.to} className={LINK_CLASS}>
        {link.label}
        {badge}
      </Link>
    );
  }
  return (
    <a href={link.href} className={LINK_CLASS} {...(link.external && { target: "_blank", rel: "noopener noreferrer" })}>
      {link.label}
      {badge}
    </a>
  );
}

export default function LandingFooter() {
  const { t, language, setLanguage } = useI18n();
  const f = t.landing.footer;
  const docs = t.legal.docs;
  // На лендинге — якорь раздела, с других страниц (документы) — переход на лендинг к этому разделу
  const { pathname } = useLocation();
  const section = (id: string): Pick<FooterLink, "href" | "to"> =>
    pathname === "/welcome" ? { href: `#${id}` } : { to: `/welcome#${id}` };

  // Только ссылки, которые куда-то ведут: разделы страницы, помощь, студия, документы
  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Kolo",
      links: [
        // Отдельные страницы с подробностями (src/pages/guide)
        { label: f.how, to: "/how-it-works" },
        { label: f.modes, to: "/modes" },
        { label: f.engine, to: "/perigee" },
      ],
    },
    {
      title: f.help,
      links: [
        { label: f.faq, ...section("faq") },
        { label: f.install, ...section("apps") },
        { label: f.contact, href: `mailto:${LEGAL.email.support}` },
      ],
    },
    {
      title: "Dakuta",
      links: [
        { label: f.about, href: "https://dakuta.dev", external: true },
        { label: f.woky, href: "https://woky.dakuta.dev", external: true },
        { label: f.boey, href: "https://boey.dakuta.dev", external: true, badge: f.soon },
      ],
    },
    {
      title: f.legal,
      links: [
        { label: docs.privacy, to: "/privacy" },
        { label: docs.terms, to: "/terms" },
        { label: docs.cookies, to: "/cookies" },
        { label: docs.refund, to: "/refund" },
        { label: t.legal.cookies.settings, onClick: openCookieSettings },
      ],
    },
  ];

  return (
    <footer className="bg-brand-night text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-10 grid gap-12">
        <div className="grid gap-12">
          <div className="grid gap-3">
            <Link to="/welcome" className="group w-fit">
              <Logo tone="night" />
            </Link>
            <p className="max-w-sm text-sm text-white/60">{f.tagline}</p>
          </div>

          <nav className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="mb-4 text-sm font-semibold text-white">{col.title}</h3>
                <ul className="grid gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <FooterItem link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="text-sm text-white/50">{f.siteLanguage}</span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                lang={lang.htmlLang}
                aria-current={lang.code === language}
                className={cx(
                  "text-sm transition-colors",
                  lang.code === language ? "font-semibold text-white" : "text-white/60 hover:text-white",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Kolo Sets ·{" "}
            <a href="https://dakuta.dev" className="hover:text-white">
              Dakuta
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
