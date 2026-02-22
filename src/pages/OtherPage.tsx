import { Link } from "react-router-dom";
import { ChevronRight, Rocket, ShieldCheck, Info, FolderDown, PocketKnife} from "lucide-react";

// --- КОМПОНЕНТ КНОПКИ-ССЫЛКИ ---
const MenuLink = ({
  label,
  icon: Icon,
  to,
}: {
  label: string;
  icon: any;
  to: string;
}) => (
  <Link
    to={to}
    className="flex items-center justify-between w-full px-4 py-3 mb-3 transition-all duration-200 
               bg-white dark:bg-gray-800 
               border border-gray-100 dark:border-gray-700 
               rounded-3xl group 
               hover:bg-purple-50 dark:hover:bg-purple-900/20 
               hover:border-purple-200 dark:hover:border-purple-800 
               active:scale-[0.98]"
    style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)" }}
  >
    <div className="flex items-center gap-4">
      <div
        className="flex items-center justify-center w-10 h-10 
                   text-purple-600 dark:text-purple-400 
                   transition-colors bg-purple-100 dark:bg-purple-900/40 
                   rounded-xl group-hover:bg-purple-600 group-hover:text-white"
      >
        <Icon size={20} />
      </div>

      <span className="text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-800 dark:group-hover:text-purple-300">
        {label}
      </span>
    </div>

    <ChevronRight
      size={22}
      className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600 dark:group-hover:text-purple-400"
    />
  </Link>
);

export default function OtherPage() {
  const menuLinks = [
    { id: "updates", label: "Kolo Updates", icon: Rocket, path: "/updates" },
    { id: "privacy", label: "Security & Privacy", icon: ShieldCheck, path: "/privacy" },
    { id: "about", label: "About System", icon: Info, path: "/system-info" },
    { id: "export", label: "Export / Import", icon: FolderDown, path: "/data-management" },
    { id: "support", label: "Support", icon: PocketKnife, path: "/support" },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-210px)] max-w-5xl mx-auto">
      
      {/* Основной контент */}
      <div className="flex-1 w-full">
        <div className="mb-8 pt-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Other 
          </h2>
        </div>

        <section className="flex flex-col">
          {menuLinks.map((link) => (
            <MenuLink
              key={link.id}
              label={link.label}
              icon={link.icon}
              to={link.path}
            />
          ))}
        </section>
      </div>

      {/* Footer */}
      <footer className="pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Utviklet av{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            Euphoria Software
          </span>
        </p>
      </footer>

    </div>
  );
}