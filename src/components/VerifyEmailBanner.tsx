import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DISMISS_KEY = 'verify_email_dismissed';

export default function VerifyEmailBanner() {
  const { user, sendVerificationEmail } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);

  const isEmailProvider = user?.providerData.some(p => p.providerId === 'password');
  const show = !!(user && !user.emailVerified && isEmailProvider && !dismissed);

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleResend = async () => {
    if (sending || resent) return;
    setSending(true);
    try {
      await sendVerificationEmail();
      setResent(true);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="mx-4 sm:mx-5 mt-3 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/30 rounded-2xl">
            <MailCheck size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="flex-1 text-[12px] font-semibold text-amber-800 dark:text-amber-300 leading-snug">
              Please verify your email to secure your account.{' '}
              {resent ? (
                <span className="font-black text-green-700 dark:text-green-400">✓ Email sent!</span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="font-black underline underline-offset-2 hover:no-underline disabled:opacity-50 transition-all"
                >
                  {sending ? 'Sending…' : 'Resend verification'}
                </button>
              )}
            </p>
            <button
              onClick={handleDismiss}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 shrink-0 transition-colors p-0.5"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
