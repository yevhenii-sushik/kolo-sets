import { Link } from "react-router-dom";
import {
  ChevronRight,
  Rocket,
  PocketKnife,
  SlidersHorizontal,
  ShieldCheck,
  Scale,
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
      path: "/support",
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
  );
}
