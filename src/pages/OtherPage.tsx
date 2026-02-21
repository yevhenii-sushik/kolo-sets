import { Link } from "react-router-dom"; // Импортируем Link
import { ChevronRight, Rocket, ShieldCheck, Info } from "lucide-react";

// --- КОМПОНЕНТ КНОПКИ-ССЫЛКИ ---
const MenuLink = ({ label, icon: Icon, to }: { label: string, icon: any, to: string }) => (
  <Link
    to={to}
    className="flex items-center justify-between w-full px-5 py-4 mb-3 transition-all duration-200 
               bg-white dark:bg-gray-800 
               border border-gray-100 dark:border-gray-700 
               rounded-2xl group 
               hover:bg-purple-50 dark:hover:bg-purple-900/20 
               hover:border-purple-200 dark:hover:border-purple-800 
               active:scale-[0.98]"
    style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)" }}
  >
    <div className="flex items-center gap-4">
      {/* Иконка слева */}
      <div className="flex items-center justify-center w-10 h-10 
                      text-purple-600 dark:text-purple-400 
                      transition-colors bg-purple-100 dark:bg-purple-900/40 
                      rounded-xl group-hover:bg-purple-600 group-hover:text-white">
        <Icon size={20} />
      </div>
      
      {/* Текст */}
      <span className="text-lg font-medium text-gray-700 dark:text-gray-200 group-hover:text-purple-800 dark:group-hover:text-purple-300">
        {label}
      </span>
    </div>

    {/* Стрелка справа */}
    <ChevronRight 
      size={22} 
      className="text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600 dark:group-hover:text-purple-400" 
    />
  </Link>
);

export default function OtherPage() {
  // Определяем пути для каждой кнопки
  const menuLinks = [
    { id: "updates", label: "Kolo Updates", icon: Rocket, path: "/updates" },
    // { id: "export", label: "Export Collections", icon: Download, path: "/export" },
    { id: "privacy", label: "Security & Privacy", icon: ShieldCheck, path: "/privacy" },
    { id: "about", label: "About System", icon: Info, path: "/system-info" },
  ];

  return (
    <div className="max-w-4xl mx-auto pt-10 pb-10 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Прочее
        </h2>
      </div>
      
      <section className="flex flex-col">
        {menuLinks.map((link) => (
          <MenuLink 
            key={link.id}
            label={link.label}
            icon={link.icon}
            to={link.path} // Передаем путь
          />
        ))}
      </section>

      <footer className="pt-12 mt-12 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Utviklet av <span className="font-semibold text-gray-900 dark:text-white">Euphoria Software</span>
        </p>
      </footer>
    </div>
  );
}