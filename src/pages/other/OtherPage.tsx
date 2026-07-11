import { Link } from "react-router-dom";
import {
  ChevronRight,
  Rocket,
  FolderDown,
  PocketKnife,
  SlidersHorizontal,
  ShieldCheck,
  Scale,
  MessageSquareHeart,
} from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { motion } from "framer-motion";

const MenuCard = ({
  label,
  icon: Icon,
  to,
  index,
}: {
  label: string;
  icon: React.ElementType;
  to: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Link
      to={to}
      className="group relative flex flex-col justify-between h-40 p-6 transition-all duration-300
                 bg-white dark:bg-[#1A1917]
                 border border-[#E0DBD3] dark:border-[#2E2C29]
                 rounded-[2.5rem] overflow-hidden
                 hover:shadow-2xl hover:shadow-[#FF5733]/5 hover:-translate-y-1
                 active:scale-[0.98]"
    >
      <Icon
        size={80}
        className="absolute -right-4 -bottom-4 text-[#FF5733]/5 group-hover:text-[#FF5733]/10 transition-colors pointer-events-none rotate-12"
      />

      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center justify-center w-12 h-12 text-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-2xl group-hover:bg-[#FF5733] group-hover:text-white transition-all duration-300">
          <Icon size={22} />
        </div>
        <ChevronRight
          size={20}
          className="text-[#B5B0A8] transition-transform group-hover:translate-x-1 group-hover:text-[#FF5733]"
        />
      </div>

      <div className="relative z-10">
        <span className="text-xl font-serif italic tracking-tight text-[#1A1714] dark:text-[#F0EDE8]">
          {label}
        </span>
      </div>
    </Link>
  </motion.div>
);

const SmallCard = ({
  label,
  sublabel,
  icon: Icon,
  to,
  index,
}: {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  to: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 + index * 0.05 }}
  >
    <Link
      to={to}
      className="group flex items-center gap-4 p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl hover:border-[#FF5733]/40 hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] group-hover:bg-[#FF5733] group-hover:text-white transition-all duration-300">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">{label}</p>
        <p className="text-[11px] text-[#B5B0A8] font-medium mt-0.5">{sublabel}</p>
      </div>
      <ChevronRight size={16} className="ml-auto text-[#B5B0A8] shrink-0 group-hover:translate-x-0.5 group-hover:text-[#FF5733] transition-all" />
    </Link>
  </motion.div>
);

export default function OtherPage() {
  const { t } = useI18n();

  const mainLinks = [
    { id: "settings",   label: t.other.settings,        icon: SlidersHorizontal, path: "/other/settings" },
    { id: "updates",    label: t.other.updates,          icon: Rocket,            path: "/other/updates"  },
    { id: "support",    label: t.other.support,          icon: PocketKnife,       path: "/support"        },
    { id: "export",     label: t.other.dataManagement,   icon: FolderDown,        path: "/other/data-management" },
  ];

  const legalLinks = [
    { id: "privacy", label: "Privacy Policy", sublabel: "How we handle your data", icon: ShieldCheck, path: "/privacy" },
    { id: "terms",   label: "Terms of Service", sublabel: "Rules and conditions",   icon: Scale,       path: "/terms"   },
    { id: "contact", label: "Contact & Support", sublabel: "Send feedback or report a bug", icon: MessageSquareHeart, path: "/support" },
  ];

  return (
    <div className="space-y-8">
      {/* Main menu cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {mainLinks.map((link, index) => (
          <MenuCard key={link.id} label={link.label} icon={link.icon} to={link.path} index={index} />
        ))}
      </div>

      {/* Legal & Docs section */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-4 ml-1">
          Legal & Docs
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {legalLinks.map((link, i) => (
            <SmallCard key={link.id} label={link.label} sublabel={link.sublabel} icon={link.icon} to={link.path} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
