import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { LANGUAGES, getLanguageInfo } from "../../locales/languages";

export default function SiteLanguagePicker() {
  const { t, language, setLanguage } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getLanguageInfo(language);

  // Закрываем по клику снаружи и по Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.landing.nav.siteLanguage}: ${current.label}`}
        className="flex items-center gap-2 h-9 px-3 rounded-full text-sm font-medium text-muted hover:bg-inset hover:text-fg transition-colors"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span className="hidden sm:inline text-fg">{current.label}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-10 mt-2 w-56 p-1.5 bg-surface border border-line rounded-2xl shadow-xl origin-top-right"
          >
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  role="option"
                  lang={lang.htmlLang}
                  aria-selected={lang.code === language}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    lang.code === language
                      ? "bg-accent-soft text-accent-ink"
                      : "text-fg hover:bg-inset "
                  }`}
                >
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span className="flex-1 text-left">{lang.label}</span>
                  {lang.code === language && <Check size={15} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
