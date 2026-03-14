import { X } from 'lucide-react';
import { Outlet,  useNavigate} from 'react-router-dom';


export default function NavLayout() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen my-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F2ED] dark:bg-[#0F0E0C]">
        <div className="px-3 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-[#E0DBD3] dark:border-[#2E2C29] text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8]">
          © 2026 Euphoria Software AS • Built with ❤️ by Kolo Team
        </p>
      </footer>

    </div>
  );
}