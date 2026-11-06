import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, SquarePlus, X } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { AppIcon, Button, IconButton } from "../ui";

const DISMISS_KEY = "kolo_install_prompt_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// «Нажми {share} и выбери {add} …» → текст со значками на местах {share} и {add}
function withIcons(template: string, icons: Record<string, ReactNode>) {
  return template.split(/(\{\w+\})/).map((part, i) => {
    const key = part.match(/^\{(\w+)\}$/)?.[1];
    return key && icons[key] ? (
      <span key={i} className="inline-flex translate-y-0.5 text-fg">
        {icons[key]}
      </span>
    ) : (
      part
    );
  });
}

// Предложение установить Kolo как приложение (PWA). В iOS нет системного запроса —
// там подсказка, как добавить Kolo на экран «Домой» вручную.
export default function InstallPrompt() {
  const { t } = useI18n();
  const ip = t.shell.install;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    const timer = isIOS() ? setTimeout(() => setShowIOSHint(true), 2500) : undefined;

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setDismissed(true);
  };

  const show = !dismissed && (deferredPrompt !== null || showIOSHint);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-24 left-1/2 z-100 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:bottom-5"
        >
          <div className="flex items-start gap-3 rounded-3xl border border-line bg-surface p-3 pl-4 shadow-2xl">
            <AppIcon size={44} />
            {/* Кнопка — под текстом, чтобы заголовок и подсказка не сжимались в узкую колонку */}
            <div className="grid min-w-0 flex-1 justify-items-start gap-0.5">
              <p className="text-sm font-semibold text-fg">{ip.title}</p>
              <p className="text-xs leading-snug text-muted">
                {deferredPrompt ? ip.text : withIcons(ip.ios, { share: <Share size={13} />, add: <SquarePlus size={13} /> })}
              </p>
              {deferredPrompt && (
                <Button size="sm" onClick={handleInstall} className="mt-2">
                  {ip.install}
                </Button>
              )}
            </div>
            <IconButton size="sm" label={t.close} onClick={handleDismiss} className="self-start">
              <X size={16} />
            </IconButton>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
