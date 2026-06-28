import { Link } from "react-router-dom";
import { ChevronRight, Rocket, FolderDown, PocketKnife, SlidersHorizontal } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { motion } from "framer-motion";

// --- КОМПОНЕНТ КНОПКИ-ССЫЛКИ В СТИЛЕ BENTO ---
const MenuCard = ({
  label,
  icon: Icon,
  to,
  index,
}: {
  label: string;
  icon: any;
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
        <div
          className="flex items-center justify-center w-12 h-12
                     text-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] 
                     rounded-2xl group-hover:bg-[#FF5733] group-hover:text-white transition-all duration-300"
        >
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

export default function OtherPage() {
  const { t } = useI18n();

  const menuLinks = [
    {
      id: "settings",
      label: t.other.settings,
      icon: SlidersHorizontal,
      path: "/other/settings",
    },
    {
      id: "updates",
      label: t.other.updates,
      icon: Rocket,
      path: "/other/updates",
    },
    {
      id: "support",
      label: t.other.support,
      icon: PocketKnife,
      path: "/other/support",
    },
    {
      id: "export",
      label: t.other.dataManagement,
      icon: FolderDown,
      path: "/other/data-management",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {menuLinks.map((link, index) => (
          <MenuCard
            key={link.id}
            label={link.label}
            icon={link.icon}
            to={link.path}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
