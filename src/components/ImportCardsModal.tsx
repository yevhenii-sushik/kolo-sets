import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../contexts/I18nContext";
import { X, Sparkles, CheckCircle2, Upload } from "lucide-react";

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

export default function ImportCardsModal({
  isOpen,
  onClose,
  onImport,
}: ImportCardsModalProps) {
  const { t } = useI18n();
  const m = t.words.editCollection.modals;
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onImport(text);
      setText("");
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(m.aiPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = text.trim() ? text.trim().split("\n").length : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1714]/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="relative w-full sm:max-w-xl bg-white dark:bg-[#1A1917] rounded-t-4xl sm:rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl max-h-[90dvh] flex flex-col"
          >
            <div className="flex justify-between items-center px-6 sm:px-7 pt-6 pb-4 shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                  {m.importTitle}
                </h3>
                <p className="text-xs text-[#7A756E] dark:text-[#8A867F] font-medium mt-0.5">
                  {m.importSubtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E] shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-6 sm:px-7 pb-6 overflow-y-auto"
            >
              {/* Compact format hint + AI prompt copy — one row on sm+ */}
              <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <div className="flex-1 p-3.5 bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl">
                  <code className="block text-[10px] text-[#7A756E] dark:text-[#8A867F] font-mono break-all mb-1">
                    {m.formatPattern}
                  </code>
                  <p className="text-[10px] text-[#B5B0A8] dark:text-[#5A5652] font-medium leading-relaxed">
                    {m.formatHint}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyPrompt}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-0 sm:w-40 bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#FF5733] hover:text-white transition-all active:scale-95"
                >
                  {copied ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>{copied ? m.promptCopied : m.copyPrompt}</span>
                </button>
              </div>

              <div className="relative mb-5">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={m.importPlaceholder}
                  rows={7}
                  className="w-full px-4 py-3.5 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-mono text-xs resize-none leading-relaxed"
                />
                {lineCount > 0 && (
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] text-[9px] font-black uppercase tracking-widest rounded-full">
                    {lineCount} {m.cardsReady}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!text.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <Upload size={14} /> {m.startImport}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
