import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, language: string) => void;
}

// Коллекция всегда учит норвежский — language здесь только для TTS-фолбэка
// в старом коде (storage.ts/exportImport.ts), пользователю выбор не нужен.
const COLLECTION_LANGUAGE = "nb-NO";

export default function CreateCollectionModal({
  isOpen,
  onClose,
  onCreate,
}: CreateCollectionModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), COLLECTION_LANGUAGE);
      setName("");
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#1A1714]/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                {t.words.createModal.title}
              </h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label
                htmlFor="collection-name"
                className="block text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-3"
              >
                {t.words.createModal.nameLabel}
              </label>
              <input
                autoFocus
                type="text"
                id="collection-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.words.createModal.namePlaceholder}
                className="w-full px-4 py-3 rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] text-[#1A1714] dark:text-[#F0EDE8] font-bold placeholder-[#B5B0A8] outline-none focus:ring-2 focus:ring-[#FF5733]/30 mb-5 sm:mb-6"
              />

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3.5 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-95 disabled:opacity-40"
              >
                {t.words.createModal.create}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
