import { ArrowUpRight, Bell } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../../contexts/I18nContext";
import { Text } from "../../ui";
import { PageHeader } from "../../components/other/PageSection";

// Карточка приложения: верх — в фирменных цветах самого приложения (Woky, Bøy! — BRAND_HEX
// в scripts/check-design.mjs), низ — обычная полоса Kolo с адресом и действием
function AppCard({
  href,
  panel,
  domain,
  action,
  children,
}: {
  href: string;
  panel: string;
  domain: string;
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-4xl border border-line transition-shadow hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className={`grid justify-items-start gap-3 p-6 sm:p-8 ${panel}`}>{children}</div>
      <div className="flex items-center justify-between gap-3 bg-surface px-6 py-4 text-sm">
        <span className="text-faint">{domain}</span>
        <span className="flex items-center gap-1.5 font-semibold text-accent-ink transition-[gap] group-hover:gap-2.5">{action}</span>
      </div>
    </a>
  );
}

// «Ещё от Dakuta»: другие приложения команды
export default function ExplorePage() {
  const { t } = useI18n();
  const e = t.explore;

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={`${e.title} ${e.titleAccent}`} subtitle={e.subtitle} />

      <AppCard
        href="https://woky.dakuta.dev"
        panel="bg-[#13121B] text-white"
        domain="woky.dakuta.dev"
        action={
          <>
            {e.visit}
            <ArrowUpRight size={16} />
          </>
        }
      >
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#A5B4FC]">{e.woky.category}</span>
        <p className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
          <span className="text-[#A5B4FC]">Norsk</span> <span className="text-white">Grammatikk</span>
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-white/70">{e.woky.tagline}</p>
        <div className="mt-2 flex gap-8">
          <div>
            <p className="font-display text-2xl font-extrabold">10</p>
            <p className="text-xs text-white/60">{e.woky.sections}</p>
          </div>
          <div>
            <p className="font-display text-2xl font-extrabold">97</p>
            <p className="text-xs text-white/60">{e.woky.exercises}</p>
          </div>
        </div>
      </AppCard>

      <AppCard
        href="https://boey.dakuta.dev"
        panel="bg-[#F3ECE2] text-[#1E1915]"
        domain="boey.dakuta.dev"
        action={
          <>
            <Bell size={16} />
            {e.notifyMe}
          </>
        }
      >
        <span className="rounded-full bg-[#C0553B]/10 px-3 py-1 text-xs font-semibold text-[#C0553B]">{e.comingSoon}</span>
        <p className="font-display text-4xl font-extrabold leading-none sm:text-5xl">
          Bøy<span className="text-[#C0553B]">!</span>
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-[#1E1915]/70">{e.boey.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {e.boey.tags.map((tag: string) => (
            <span key={tag} className="rounded-full bg-[#E6DCCF] px-2.5 py-1 text-xs font-semibold text-[#1E1915]/70">
              {tag}
            </span>
          ))}
        </div>
      </AppCard>

      <Text size="sm" tone="faint" className="text-center">
        {e.footer}
      </Text>
    </div>
  );
}
