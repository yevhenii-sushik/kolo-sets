import { useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import { Button, Field, Input, Modal } from "../ui";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Набор создаётся в активном курсе — язык спрашивать не нужно
  onCreate: (name: string) => void;
}

export default function CreateCollectionModal({ isOpen, onClose, onCreate }: CreateCollectionModalProps) {
  const { t } = useI18n();
  const m = t.words.createModal;
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    setName("");
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleClose} title={m.title} size="sm">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label={m.nameLabel} htmlFor="collection-name">
          <Input id="collection-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={m.namePlaceholder} />
        </Field>
        <Button type="submit" size="lg" fullWidth disabled={!name.trim()}>
          {m.create}
        </Button>
      </form>
    </Modal>
  );
}
