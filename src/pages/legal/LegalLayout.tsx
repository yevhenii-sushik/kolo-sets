import { Link, useNavigate, Outlet } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function LegalLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(user ? "/" : "/welcome");
    }
  };

  return (
    <div className="min-h-dvh bg-[#F5F2ED] dark:bg-[#0F0E0C]">
      {/* Sticky header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F5F2ED]/85 dark:bg-[#0F0E0C]/85 border-b border-[#E0DBD3]/60 dark:border-[#2E2C29]/60">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#7A756E] hover:text-[#FF5733] transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <Link to="/welcome" className="flex items-center gap-2">
            <img src="/icon-512.png" className="w-6 h-6" alt="Kolo" />
            <span className="text-[13px] font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
              Kolo <span className="text-[#FF5733]">Sets</span>
            </span>
          </Link>

          <Link
            to={user ? "/" : "/register"}
            className="text-[11px] font-black uppercase tracking-[0.12em] text-[#FF5733] hover:underline"
          >
            {user ? "App →" : "Sign up →"}
          </Link>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-12 pb-24">
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
            <a
              href="mailto:support@dakuta.dev"
              className="hover:text-[#FF5733] transition-colors"
            >
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
