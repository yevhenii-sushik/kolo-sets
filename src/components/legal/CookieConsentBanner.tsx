import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { OPEN_SETTINGS_EVENT, getConsent, saveConsent } from "../../utils/consent";
import ConsentText from "./ConsentText";
import { Button, Switch } from "../../ui";

// Баннер согласия: показывается, пока нет действующего решения, и заново —
// по ссылке «Настройки cookie» (событие OPEN_SETTINGS_EVENT).
export default function CookieConsentBanner() {
  const { t } = useI18n();
  const c = t.legal.cookies;
  const [visible, setVisible] = useState(() => getConsent() === null);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(() => getConsent()?.analytics ?? false);

  useEffect(() => {
    const open = () => {
      setAnalytics(getConsent()?.analytics ?? false);
      setCustomizing(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  const decide = (choice: boolean) => {
    saveConsent({ analytics: choice });
    setVisible(false);
    setCustomizing(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-text"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed z-[120] inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] rounded-3xl border border-line bg-surface p-5 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[26rem] sm:p-6"
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
              <Cookie size={18} />
            </span>
            <h2 id="cookie-consent-title" className="text-base font-semibold text-fg">
              {c.title}
            </h2>
          </div>
          <p id="cookie-consent-text" className="text-sm leading-relaxed text-muted">
            {c.text} <ConsentText template={c.more} />
          </p>

          {customizing && (
            <div className="mt-4 grid gap-2">
              <div className="flex items-start gap-3 rounded-2xl bg-inset p-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-fg">{c.necessary}</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted">{c.necessaryDesc}</div>
                </div>
                <Switch checked disabled label={`${c.necessary}: ${c.alwaysOn}`} />
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-inset p-3">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-fg">{c.analytics}</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted">{c.analyticsDesc}</div>
                </div>
                <Switch checked={analytics} onChange={setAnalytics} label={c.analytics} />
              </div>
            </div>
          )}

          {/* «Только необходимые» и «Принять все» одинаковы по весу — отказ не должен быть сложнее согласия */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {customizing ? (
              <Button fullWidth onClick={() => decide(analytics)}>
                {c.save}
              </Button>
            ) : (
              <>
                <Button variant="inverse" fullWidth onClick={() => decide(false)}>
                  {c.necessaryOnly}
                </Button>
                <Button variant="inverse" fullWidth onClick={() => decide(true)}>
                  {c.acceptAll}
                </Button>
              </>
            )}
          </div>
          {!customizing && (
            <Button variant="ghost" size="sm" fullWidth onClick={() => setCustomizing(true)} className="mt-2">
              {c.customize}
            </Button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
