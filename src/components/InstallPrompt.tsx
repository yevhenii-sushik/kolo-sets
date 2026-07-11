import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, X, SquarePlus } from 'lucide-react';

const DISMISS_KEY = 'kolo_install_prompt_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };
    window.addEventListener('appinstalled', handleInstalled);

    // iOS не поддерживает beforeinstallprompt вовсе — там установка
    // возможна только вручную через Share → "На экран Домой"
    if (isIOS()) {
      const timer = setTimeout(() => setShowIOSHint(true), 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setDismissed(true);
  };

  const show = !dismissed && (deferredPrompt !== null || showIOSHint);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-24 md:bottom-5 left-1/2 -translate-x-1/2 z-100 w-[calc(100%-2rem)] max-w-sm"
        >
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl shadow-2xl shadow-black/10">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF0ED] dark:bg-[#2A1A15] flex items-center justify-center text-[#FF5733] shrink-0">
              {deferredPrompt ? <Download size={20} /> : <Share size={18} />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-[#1A1714] dark:text-[#F0EDE8]">
                Установить Kolo
              </p>
              {deferredPrompt ? (
                <p className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F] leading-snug">
                  Быстрый доступ с экрана, без адресной строки
                </p>
              ) : (
                <p className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F] leading-snug flex items-center gap-1 flex-wrap">
                  Нажмите <Share size={12} className="inline shrink-0" /> и выберите
                  <SquarePlus size={12} className="inline shrink-0" /> «На экран Домой»
                </p>
              )}
            </div>

            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="shrink-0 px-3.5 py-2 bg-[#FF5733] text-white text-[11px] font-black uppercase tracking-wide rounded-xl hover:bg-[#E54D2A] transition-colors active:scale-95"
              >
                Установить
              </button>
            )}

            <button
              onClick={handleDismiss}
              aria-label="Закрыть"
              className="shrink-0 p-1.5 rounded-lg text-[#B5B0A8] hover:text-[#1A1714] dark:hover:text-[#F0EDE8] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
