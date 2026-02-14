import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { Outlet, Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';

const SIDEBAR_KEY = 'sidebar-open';

export default function MainLayout() {
  // состояние sidebar с сохранением в localStorage
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === 'true';
  });

  const toggleSidebar = () => setOpen(o => !o);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);

return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 h-16 flex items-center">
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
