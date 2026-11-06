import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MailCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Alert, IconButton } from '../ui';

const DISMISS_KEY = 'verify_email_dismissed';

// Просьба подтвердить email — только для входа по паролю; скрывается до конца сессии
export default function VerifyEmailBanner() {
  const { user, sendVerificationEmail } = useAuth();
  const { t } = useI18n();
  const v = t.shell.verify;
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [resent, setResent] = useState(false);
  const [sending, setSending] = useState(false);

  const isEmailProvider = user?.providerData.some((p) => p.providerId === 'password');
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
      // Не мешаем работе: письмо можно запросить ещё раз позже
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
          <Alert tone={resent ? 'success' : 'warning'} className="mb-4 flex items-center gap-3 py-2 pr-2">
            <MailCheck size={18} className="shrink-0" />
            <p className="flex-1">
              {resent ? (
                v.sent
              ) : (
                <>
                  {v.text}{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sending}
                    className="font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-50"
                  >
                    {sending ? v.sending : v.resend}
                  </button>
                </>
              )}
            </p>
            <IconButton size="sm" label={v.dismiss} onClick={handleDismiss}>
              <X size={16} />
            </IconButton>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
