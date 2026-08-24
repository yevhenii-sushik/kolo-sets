import { X } from "lucide-react";
import { Outlet, useNavigate, Link } from "react-router-dom";

export default function NavLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F2ED] dark:bg-[#0F0E0C]">
        <div className="px-3 h-12 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* pt-20 clears the fixed h-12 header with room to spare. max-w-5xl
          gives room for Updates' sidebar+content layout; Settings/Support
          constrain themselves narrower (max-w-2xl) from inside */}
      <main className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-20 pb-16 transition-colors duration-500">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0DBD3] dark:border-[#2E2C29] py-8">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-[#B5B0A8]">
            © 2026 Kolo by{" "}
            <a
              href="https://dakuta.dev"
              className="text-[#FF5733] hover:underline"
            >
              Dakuta
            </a>
          </p>

          <div className="flex gap-5 text-[11px] font-bold text-[#B5B0A8]">
            <Link
              to="/privacy"
              className="hover:text-[#FF5733] transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-[#FF5733] transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/other/support"
              className="hover:text-[#FF5733] transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
