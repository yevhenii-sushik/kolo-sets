import { NavLink } from 'react-router-dom';
import { navItems } from '../../navigation';
import { useI18n } from '../../contexts/I18nContext';

export default function BottomNav() {
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
    <nav className="md:hidden fixed h-24 pb-5 bottom-0 left-0 right-0 
                    bg-[#F5F2ED]/80 backdrop-blur-lg dark:bg-[#0F0E0C]/70 backdrop-blur-lg 
                    flex justify-around items-center px-2 z-50"
    >
      {navItems.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-all duration-200
            ${isActive 
              ? 'text-[#FF5733] dark:text-[#FF6B47]' 
              : 'text-[#7A756E] dark:text-[#8A867F]'}
          `}
        >
          {({ isActive }) => (
            <>
              {/* Обертка для иконки с эффектом фона при активности */}
              <div className={`
                p-2 rounded-xl transition-colors
                ${isActive ? 'bg-[#FFF0ED] dark:bg-[#2A1A15]' : 'bg-transparent'}
              `}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Текст под иконкой */}
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {getLabel(labelKey)}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}