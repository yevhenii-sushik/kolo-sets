import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Card } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { Button, Modal } from "../ui";
import WordFields, { emptyWord, trimWord } from "./cards/WordFields";

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, "id" | "srsData" | "createdAt">) => void;
}

export default function AddCardModal({ isOpen, onClose, onSave }: AddCardModalProps) {
  const { t } = useI18n();
  const m = t.words.editCollection.modals;
  const [draft, setDraft] = useState(emptyWord);

  useEffect(() => {
    if (isOpen) setDraft(emptyWord());
  }, [isOpen]);

  const valid = draft.word.trim() && draft.translation.trim();

  return (
    <Modal open={isOpen} onClose={onClose} title={m.newWord} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave(trimWord(draft));
        }}
        className="grid gap-6"
      >
        <WordFields value={draft} onChange={setDraft} idPrefix="new-word" autoFocus />
        <Button type="submit" size="lg" fullWidth disabled={!valid} iconLeft={<Plus size={18} />}>
          {m.createWord}
        </Button>
      </form>
    </Modal>
  );
}
