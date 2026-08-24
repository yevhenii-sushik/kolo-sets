import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { PARTS_OF_SPEECH } from "../data/partsOfSpeech";
import { X, Plus } from "lucide-react";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, "id" | "srsData" | "createdAt">) => void;
}

export default function AddCardModal({
  isOpen,
  onClose,
  onSave,
}: AddCardModalProps) {
  const { t } = useI18n();
  const fields = t.words.editCollection.fields;
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [example, setExample] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");

  useEffect(() => {
    if (isOpen) {
      setWord("");
      setTranslation("");
      setExplanation("");
      setExample("");
      setPartOfSpeech("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (word.trim() && translation.trim()) {
      onSave({
        word: word.trim(),
        translation: translation.trim(),
        explanation: explanation.trim(),
        example: example.trim(),
        partOfSpeech: partOfSpeech.trim(),
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-end sm:items-center justify-center">
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
            className="relative w-full sm:max-w-lg bg-white dark:bg-[#1A1917] rounded-t-4xl sm:rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl max-h-[90dvh] flex flex-col"
          >
            <div className="flex justify-between items-center px-6 sm:px-7 pt-6 pb-4 shrink-0">
              <h3 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                {t.words.editCollection.modals.newWord}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E]"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="px-6 sm:px-7 pb-6 overflow-y-auto"
            >
              <div className="grid sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                    {fields.word} *
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder={fields.wordPlaceholder}
                    className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                    {fields.translation} *
                  </label>
                  <input
                    type="text"
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    placeholder={fields.translationPlaceholder}
                    className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                  {fields.partOfSpeech}
                </label>
                <select
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium appearance-none"
                >
                  <option value="">{fields.partOfSpeechNone}</option>
                  {PARTS_OF_SPEECH.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 mb-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                  {fields.explanation}
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder={fields.explanationPlaceholder}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5 mb-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                  {fields.example}
                </label>
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder={fields.examplePlaceholder}
                  rows={2}
                  className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#242220] border-2 border-transparent focus:border-[#FF5733] rounded-2xl outline-none transition-colors text-[#1A1714] dark:text-[#F0EDE8] font-medium italic resize-none leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!word.trim() || !translation.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-[0.98] disabled:opacity-40"
              >
                <Plus size={14} /> {t.words.editCollection.modals.createWord}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
