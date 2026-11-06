import { useState } from "react";
import { useI18n } from "../contexts/I18nContext";
import { Button, Field, Input, Modal } from "../ui";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, language: string) => void;
}

// Коллекция всегда учит норвежский — language здесь только для TTS-фолбэка
// в старом коде (storage.ts/exportImport.ts), пользователю выбор не нужен.
const COLLECTION_LANGUAGE = "nb-NO";

export default function CreateCollectionModal({ isOpen, onClose, onCreate }: CreateCollectionModalProps) {
  const { t } = useI18n();
  const m = t.words.createModal;
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), COLLECTION_LANGUAGE);
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
