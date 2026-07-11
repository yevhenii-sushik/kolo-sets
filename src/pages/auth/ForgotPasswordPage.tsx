import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setSent(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F2ED] dark:bg-[#0F0E0C] px-4 transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-12"
      >
        <img src="/icon-512.png" alt="Kolo Logo" className="w-12 h-12 object-contain" />
        <h1 className="text-4xl text-[#1A1714] dark:text-[#F0EDE8] font-black tracking-tighter leading-none">
          Kolo <span className="text-[#FF5733]">Sets</span>
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-[420px] w-full"
      >
        <div className="bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-8 md:p-10 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#FF5733] rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-[#FF5733]/25">
                <CheckCircle2 size={30} className="text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#1A1714] dark:text-[#F0EDE8] mb-3">
                Check your inbox
              </h2>
              <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                If an account exists for{' '}
                <strong className="text-[#1A1714] dark:text-[#F0EDE8]">{email}</strong>,
                a password reset link has been sent. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-8 w-full py-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl hover:opacity-95 transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-black tracking-tight text-[#1A1714] dark:text-[#F0EDE8] mb-2">
                  Forgot password?
                </h2>
                <p className="text-[13px] text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#B5B0A8] dark:text-[#4A4742] uppercase tracking-[0.2em] ml-4">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#B5B0A8] dark:text-[#4A4742]" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 bg-[#F5F2ED] dark:bg-[#242220] border-none rounded-2xl focus:ring-2 ring-[#FF5733] transition-all text-[#1A1714] dark:text-[#F0EDE8] placeholder-[#B5B0A8]/50 outline-none"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex items-center justify-center gap-3 px-4 py-4 bg-[#FF5733] text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50 mt-2 shadow-lg shadow-[#FF5733]/25"
                >
                  {loading ? 'Sending…' : <><ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /> Send reset link</>}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <button
            onClick={() => navigate('/login')}
            className="mt-8 flex items-center gap-2 mx-auto text-[11px] font-black uppercase tracking-widest text-[#7A756E] dark:text-[#8A867F] hover:text-[#FF5733] dark:hover:text-[#FF5733] transition-colors"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        )}
      </motion.div>
    </div>
  );
}
