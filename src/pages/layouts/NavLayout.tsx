import { X } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

export default function NavLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh my-auto mx-auto max-w-7xl px-5  sm:px-6 lg:px-8 py-8">
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
      <main className="flex-1 py-8 transition-colors duration-500">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mt-16 mx-auto px-6 py-12 border-t border-[#E0DBD3] dark:border-[#2E2C29] text-center">
        <p className="text-[12px] tracking-widest text-[#B5B0A8]">
          © 2026 Kolo by{" "}
          <a
            href="https://dakuta.dev"
            className="text-[#FF5733] hover:underline transition-colors"
          >
            Dakuta
          </a>{" "}
          • Built with ❤️ by the Team
        </p>
      </footer>
    </div>
  );
}
