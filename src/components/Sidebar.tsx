// Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { navItems } from '../navigation';

export default function Sidebar({ open }: { open: boolean }) {
  return (
    <>
      {/* Прослойка (Spacer), чтобы контент не нырял под фиксированный сайдбар */}
      <div className={`hidden md:block shrink-0 transition-[width] duration-300 ${open ? 'w-64' : 'w-20'}`} />
      
      <aside
        className={`hidden md:flex flex-col fixed top-16 left-0 h-[calc(100vh-64px)] 
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transition-[width] duration-300 z-40
          ${open ? 'w-64' : 'w-18'}
        `}
      >
        <nav className="flex-1 px-3 py-4 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-200
                ${isActive 
                  ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <div className="shrink-0">
                <Icon size={24}  />
              </div>
              
              {/* Плавное исчезновение текста при закрытии */}
              <span className={`font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                open ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}