import { Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Rocket,
  PocketKnife,
  SlidersHorizontal,
  ShieldCheck,
  Scale,
  Compass,
  Sparkle,
} from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl divide-y divide-[#F0EDE8] dark:divide-[#2E2C29] overflow-hidden">
      {children}
    </div>
  );
}

const SettingsRow = ({
  label,
  sublabel,
  icon: Icon,
  to,
}: {
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  to: string;
}) => (
  <Link
    to={to}
    className="group flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#F5F2ED] dark:hover:bg-[#242220] active:bg-[#F0EDE8] dark:active:bg-[#2A2825] transition-colors"
  >
    <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] group-hover:bg-[#FF5733] group-hover:text-white transition-colors">
      <Icon size={18} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] font-bold text-[#1A1714] dark:text-[#F0EDE8] tracking-tight truncate">
        {label}
      </p>
      {sublabel && (
        <p className="text-[11px] text-[#B5B0A8] font-medium mt-0.5 truncate">
          {sublabel}
        </p>
      )}
    </div>
    <ChevronRight
      size={18}
      className="shrink-0 text-[#D0CBC4] group-hover:text-[#FF5733] group-hover:translate-x-0.5 transition-transform"
    />
  </Link>
);

// Отдельный премиальный блок под остальными пунктами — не строчка в общем
// списке, а самостоятельная зазывающая карточка. Тёмный градиент + звёздная
// россыпь вокруг круглого бейджа — та же идея, что у премиум-иконки
// Telegram (тёмный кружок с иконкой в окружении звёздочек).
function ExploreMorePromo() {
  const { t } = useI18n();
  const p = t.explore.promo;

  return (
    <Link
      to="/other/explore"
      className="group relative block rounded-4xl overflow-hidden bg-linear-to-br from-[#1A1714] via-[#151312] to-[#0A0908] p-8 sm:p-10 text-center transition-transform active:scale-[0.99]"
    >
      {/* лёгкая сетка-текстура на фоне */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* звёздная россыпь вокруг бейджа */}
      <Sparkle size={16} className="absolute top-7 left-[20%] text-white/40 fill-white/15" />
      <Sparkle size={9} className="absolute top-16 right-[22%] text-white/25 fill-white/10" />
      <Sparkle size={11} className="absolute bottom-10 left-[26%] text-white/25 fill-white/10" />
      <Sparkle size={9} className="absolute top-8 right-[32%] text-[#FF5733]/70 fill-[#FF5733]/25" />
      <Sparkle size={13} className="absolute bottom-14 right-[18%] text-white/30 fill-white/10" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-linear-to-b from-[#3A3630] to-[#141210] ring-1 ring-white/10 shadow-2xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
          <Compass size={26} className="text-white" strokeWidth={1.75} />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black italic font-serif text-white leading-tight mb-2">
          {p.title}
          <span className="text-[#FF5733]">.</span>
        </h3>
        <p className="text-[13px] text-white/50 font-medium max-w-xs mb-6">
          {p.subtitle}
        </p>
        <span className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-[#1A1714] text-[11px] font-black uppercase tracking-widest group-hover:gap-3 transition-all">
          {p.cta}
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}

export default function OtherPage() {
  const { t } = useI18n();

  const mainLinks = [
    {
      id: "settings",
      label: t.other.settings,
      sublabel: "Notifications, theme, language",
      icon: SlidersHorizontal,
      path: "/other/settings",
    },
    {
      id: "updates",
      label: t.other.updates,
      sublabel: "See what's new in Kolo",
      icon: Rocket,
      path: "/other/updates",
    },
    {
      id: "support",
      label: t.other.support,
      sublabel: "Get help or send feedback",
      icon: PocketKnife,
      path: "/other/support",
    },
  ];

  const legalLinks = [
    {
      id: "privacy",
      label: "Privacy Policy",
      sublabel: "How we handle your data",
      icon: ShieldCheck,
      path: "/privacy",
    },
    {
      id: "terms",
      label: "Terms of Service",
      sublabel: "Rules and conditions",
      icon: Scale,
      path: "/terms",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-3 ml-1">
            General
          </p>
          <SettingsGroup>
            {mainLinks.map((link) => (
              <SettingsRow
                key={link.id}
                label={link.label}
                sublabel={link.sublabel}
                icon={link.icon}
                to={link.path}
              />
            ))}
          </SettingsGroup>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-3 ml-1">
            Legal & Docs
          </p>
          <SettingsGroup>
            {legalLinks.map((link) => (
              <SettingsRow
                key={link.id}
                label={link.label}
                sublabel={link.sublabel}
                icon={link.icon}
                to={link.path}
              />
            ))}
          </SettingsGroup>
        </div>
      </div>

      <ExploreMorePromo />
    </div>
  );
}
