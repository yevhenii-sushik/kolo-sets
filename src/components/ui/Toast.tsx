import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { IconButton } from '../../ui';
import { useI18n } from '../../contexts/I18nContext';

interface ToastProps {
  isOpen: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

const ICONS = {
  success: <CheckCircle size={20} className="text-success" />,
  error: <XCircle size={20} className="text-danger" />,
  info: <Info size={20} className="text-info" />,
  warning: <AlertTriangle size={20} className="text-warning" />,
};

// Короткое уведомление: сверху справа на компьютере, над нижней навигацией на телефоне
export default function Toast({ isOpen, message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role={type === 'error' ? 'alert' : 'status'}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="fixed inset-x-4 bottom-28 z-[200] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-surface py-2.5 pl-4 pr-2 shadow-xl md:inset-x-auto md:bottom-auto md:right-6 md:top-20"
        >
          {ICONS[type]}
          <p className="flex-1 text-sm font-medium text-fg">{message}</p>
          <IconButton size="sm" label={t.close} onClick={onClose}>
            <X size={16} />
          </IconButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
