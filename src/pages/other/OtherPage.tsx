import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Cookie, Languages, LayoutDashboard, LifeBuoy, Rocket, Scale, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { ElementType } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useIsAdmin } from "../../api/admin";
import { Card, Heading, Text } from "../../ui";
import { DakutaLogo } from "../../components/brand/DakutaLogo";

// Ссылка-строка в группе: иконка, название, пояснение, шеврон
function Row({ to, icon: Icon, label, hint }: { to: string; icon: ElementType; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-3xl px-4 py-3 transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
        <Icon size={18} />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate font-semibold text-fg">{label}</span>
        <span className="text-sm text-muted">{hint}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid content-start gap-3">
      <Heading size={4} as="h2" className="px-1 text-muted">
        {title}
      </Heading>
      <Card padding="none" className="grid p-2">
        {children}
      </Card>
    </section>
  );
}

// «Ещё»: курсы, настройки (аккаунт, оформление, копия), что нового и поддержка, документы;
// ниже — другие приложения Dakuta (они про норвежский — только тем, кто его учит)
export default function OtherPage() {
  const { t } = useI18n();
  const { courses } = useData();
  const isAdmin = useIsAdmin();
  const learnsNorwegian = courses.some((c) => c.id === "nb");
  const o = t.other;
  const promo = t.explore.promo;
  const version = t.updates.versions[0]?.number;

  return (
    <div className="grid grid-cols-1 gap-6">
      <Heading size={1}>{t.nav.other}</Heading>

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <Group title={o.groups.app}>
          <Row to="/courses" icon={Languages} label={o.courses} hint={o.hints.courses} />
          <Row to="/other/settings" icon={SlidersHorizontal} label={o.settings} hint={o.hints.settings} />
          <Row to="/other/updates" icon={Rocket} label={o.updates} hint={o.hints.updates} />
          <Row to="/other/support" icon={LifeBuoy} label={o.support} hint={o.hints.support} />
          {/* Только у команды; внутренний инструмент — по-русски, без перевода (docs/specs/admin.md) */}
          {isAdmin && <Row to="/admin" icon={LayoutDashboard} label="Админ-панель" hint="Сводка и поиск пользователей" />}
        </Group>

        <Group title={o.groups.docs}>
          <Row to="/privacy" icon={ShieldCheck} label={t.legal.tabs.privacy} hint={o.hints.privacy} />
          <Row to="/terms" icon={Scale} label={t.legal.tabs.terms} hint={o.hints.terms} />
          <Row to="/cookies" icon={Cookie} label={t.legal.tabs.cookies} hint={o.hints.cookies} />
        </Group>
      </div>

      {/* Другие приложения команды — ночной блок, как подвал сайта */}
      {learnsNorwegian && (
      <Link
        to="/other/explore"
        className="group grid gap-6 rounded-4xl bg-brand-night p-6 text-white transition-transform active:scale-[0.99] sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"
      >
        <div className="grid justify-items-start gap-3">
          <DakutaLogo size={36} />
          <p className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{promo.title}</p>
          <p className="max-w-md text-sm text-white/70">{promo.subtitle}</p>
        </div>
        <span className="inline-flex h-11 items-center gap-2 justify-self-start rounded-full bg-white px-5 text-sm font-semibold text-brand-night transition-[gap] group-hover:gap-3">
          {promo.cta}
          <ArrowRight size={16} />
        </span>
      </Link>
      )}

      {version && (
        <Text size="sm" tone="faint" className="text-center">
          Kolo Sets · {o.version.replace("{v}", version)}
        </Text>
      )}
    </div>
  );
}
