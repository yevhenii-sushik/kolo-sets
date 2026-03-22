// Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { navItems } from '../../navigation';
import { useI18n } from '../../contexts/I18nContext';

export default function Sidebar({ open }: { open: boolean }) {
  const { t } = useI18n();
  
  const getLabel = (labelKey: string) => {
    const keys = labelKey.split('.');
    let value: any = t;
    for (const key of keys) {
      value = value[key];
    }
    return value;
  };
  
  return (
    <>
      {/* Прослойка (Spacer), чтобы контент не нырял под фиксированный сайдбар */}
      <div className={`hidden md:block shrink-0 transition-[width] duration-300 ${open ? 'w-50' : 'w-20'}`} />
      
      <aside
        className={`hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-64px)] 
          transition-[width] duration-300 z-40
      
          ${open ? 'w-45' : 'w-18'}
        `}
      >
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-[#FFF0ED] font-bold text-[#FF5733] dark:bg-[#2A1A15] dark:text-[#FF6B47]' 
                  : 'text-[#7A756E] dark:text-[#8A867F] hover:bg-[#EDEAE4] dark:hover:bg-[#242220]'}
              `}
            >
              <div className="shrink-0">
                <Icon size={24} />
              </div>
              
              {/* Плавное исчезновение текста при закрытии */}
              <span className={` text-[15px] whitespace-nowrap overflow-hidden transition-all duration-300 ${
                open ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                {getLabel(labelKey)}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}