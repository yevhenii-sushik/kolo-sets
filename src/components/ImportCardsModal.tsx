import { useState } from "react";
import { CheckCircle2, Sparkles, Upload } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { Badge, Button, Modal, Text, Textarea } from "../ui";

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (text: string) => void;
}

// Импорт списком: по слову в строке, поля через «;». Можно скопировать подсказку для ИИ-ассистента
export default function ImportCardsModal({ isOpen, onClose, onImport }: ImportCardsModalProps) {
  const { t } = useI18n();
  const m = t.words.editCollection.modals;
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(m.aiPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = text.trim() ? text.trim().split("\n").length : 0;

  return (
    <Modal open={isOpen} onClose={onClose} title={m.importTitle} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onImport(text);
          setText("");
        }}
        className="grid gap-4"
      >
        <Text size="sm" tone="muted" className="-mt-2">
          {m.importSubtitle}
        </Text>

        <div className="grid gap-3 rounded-2xl bg-inset p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <code className="block break-all font-mono text-xs text-fg">{m.formatPattern}</code>
            <p className="mt-1 text-xs leading-relaxed text-muted">{m.formatHint}</p>
          </div>
          <Button variant="soft" size="sm" onClick={copyPrompt} iconLeft={copied ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}>
            {copied ? m.promptCopied : m.copyPrompt}
          </Button>
        </div>

        <div className="relative">
          <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={m.importPlaceholder} className="font-mono" />
          {lineCount > 0 && (
            <Badge tone="accent" className="absolute bottom-3 right-3">
              {lineCount} {m.cardsReady}
            </Badge>
          )}
        </div>

        <Button type="submit" size="lg" fullWidth disabled={!text.trim()} iconLeft={<Upload size={18} />}>
          {m.startImport}
        </Button>
      </form>
    </Modal>
  );
}
