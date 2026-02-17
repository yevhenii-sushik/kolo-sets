import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Language } from '../utils/i18n';

const SIDEBAR_KEY = 'sidebar-open';

export default function MainLayout() {
  const { language, setLanguage } = useI18n();
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // состояние sidebar с сохранением в localStorage
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === 'true';
  });

  const toggleSidebar = () => setOpen(o => !o);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);
  
  const languageNames = {
    en: '🇬🇧 English',
    no: '🇳🇴 Norsk',
    ru: '🇷🇺 Русский'
  };

return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            {/* Скрываем бургер на мобилках (hidden), показываем от md и выше (md:flex) */}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 mr-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <Menu size={24} />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img src="/icon.svg" alt="logo" className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">Kolo</h1>
            </Link>
          </div>
          
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              title="Change language"
            >
              <Languages size={20} />
              <span className="hidden sm:inline text-sm">{languageNames[language]}</span>
            </button>
            
            {showLangMenu && (
              <>
                {/* Overlay to close menu */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangMenu(false)}
                />
                
                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        language === lang ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : ''
                      }`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="flex pt-16 pb-20 md:pb-0"> {/* Отступ снизу для мобильного BottomNav */}
        <Sidebar open={open} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-200">
          <Outlet />
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}


// import { Outlet, Link } from 'react-router-dom';

// export default function MainLayout() {
//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Header */}
//       <header className="bg-white dark:bg-gray-800 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <div className="flex justify-between items-center">
//             <Link to="/" className="flex items-center gap-2">
//               <img src="/icon.svg" alt="logo" className="w-10 h-10" />
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//                 Kolo
//               </h1>
//             </Link>
//           </div>
//         </div>
//       </header>

//       {/* Content */}
//       <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <Outlet />
//       </main>

//       {/* Footer */}
//       <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
//         <Link to="/about">
//           <p>Kolo — Version 0.1.3</p>
//         </Link>
//         <p>© 2026 Euphoria Software</p>
//       </footer>
//     </div>
//   );
// } 
