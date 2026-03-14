import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'; // Добавили иконки глаза
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Состояние для "подсмотреть"
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginGoogle();
      navigate('/');
    } catch (err: any) {
      setError('Ошибка входа через Google');
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found': return 'Пользователь не найден';
      case 'auth/wrong-password': return 'Неверный пароль';
      default: return 'Ошибка входа';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2ED] dark:bg-[#0F0E0C] px-4 transition-colors duration-500">
      
      {/* Логотип и Название */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-12"
      >
        <img 
          src="/icon-512.png" 
          alt="Kolo Logo" 
          className="w-12 h-12 object-contain" 
        />
        <div className="flex flex-col">
          <h1 className="text-4xl text-[#1A1714] dark:text-[#F0EDE8] font-black tracking-tighter leading-none">
            Kolo <span className="text-[#FF5733]">Sets</span>
          </h1>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[420px] w-full"
      >
        <div className="bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-8 md:p-10 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {/* Поле Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#B5B0A8] dark:text-[#4A4742] uppercase tracking-[0.2em] ml-4">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#B5B0A8] dark:text-[#4A4742]" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-[#F5F2ED] dark:bg-[#242220] border-none rounded-2xl focus:ring-2 ring-[#FF5733] transition-all text-[#1A1714] dark:text-[#F0EDE8] placeholder-[#B5B0A8]/50 outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Поле Пароля с кнопкой подсмотреть */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#B5B0A8] dark:text-[#4A4742] uppercase tracking-[0.2em] ml-4">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#B5B0A8] dark:text-[#4A4742]" size={18} />
                <input
                  type={showPassword ? "text" : "password"} // Переключаем тип поля
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-[#F5F2ED] dark:bg-[#242220] border-none rounded-2xl focus:ring-2 ring-[#FF5733] transition-all text-[#1A1714] dark:text-[#F0EDE8] placeholder-[#B5B0A8]/50 outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button" // Важно: type="button", чтобы не срабатывал submit
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-[#B5B0A8] dark:text-[#4A4742] hover:text-[#FF5733] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 mt-4 shadow-lg shadow-[#FF5733]/10"
            >
              {loading ? 'Вход...' : (
                <>
                  Sign In <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E0DBD3] dark:border-[#2E2C29]"></div>
            </div>
            <span className="relative px-4 bg-white dark:bg-[#1A1917] text-[10px] font-black text-[#B5B0A8] dark:text-[#4A4742] uppercase tracking-widest">
              Social Login
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white dark:bg-transparent border-2 border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>

        <p className="mt-8 text-center text-[#7A756E] dark:text-[#8A867F] font-bold text-[11px] uppercase tracking-widest">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
            className="text-[#FF5733] hover:underline transition-all ml-1"
          >
            Join
          </button>
        </p>
      </motion.div>
    </div>
  );
}