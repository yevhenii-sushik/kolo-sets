import { NavLink } from 'react-router-dom';
import { navItems } from '../navigation';

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed h-24 pb-5 bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-2 z-50">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `
            flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-all duration-200
            ${isActive 
              ? 'text-purple-600 dark:text-purple-400' 
              : 'text-gray-500 dark:text-gray-400'}
          `}
        >
          {({ isActive }) => (
            <>
              {/* Обертка для иконки с эффектом фона при активности */}
              <div className={`
                p-2 rounded-xl transition-colors
                ${isActive ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-transparent'}
              `}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Текст под иконкой */}
              <span className={`text-[10px] font-medium leading-none ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}