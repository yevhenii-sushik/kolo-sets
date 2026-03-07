import { X } from 'lucide-react';
import { Outlet,  useNavigate} from 'react-router-dom';


export default function NavLayout() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen my-auto mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-50 dark:bg-gray-900 backdrop-blur-md">
        <div className="px-3 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
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