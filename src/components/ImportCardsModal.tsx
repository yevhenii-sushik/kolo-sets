import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Upload } from "lucide-react";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { parseImportText, type ImportedWord } from "../utils/importText";
import { Alert, Button, Modal, Text, Textarea } from "../ui";

interface ImportCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (words: ImportedWord[]) => void;
  existing: readonly { word: string; translation: string }[]; // слова набора — чтобы не добавить их второй раз
  lang: string; // изучаемый язык по-человечески («норвежский») — в подсказке и в промте для ИИ
}

const PREVIEW = 3;

// Импорт списком: по слову в строке, поля через табуляцию, «;», тире или «=» (src/utils/importText.ts).
// Пока вставляешь, окно показывает, что распознано: сколько слов, первые строки так, как их поняли,
// и строки, которые не вышло разобрать. Ноль слов — не «успех», а подсказка о формате
// (docs/specs/06-audit-fixes.md, шаг 2). Можно скопировать подсказку для ИИ-ассистента
export default function ImportCardsModal({ isOpen, onClose, onImport, existing, lang }: ImportCardsModalProps) {
  const { t, language } = useI18n();
  const m = t.words.editCollection.modals;
  const locale = getLanguageInfo(language).htmlLang;
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => parseImportText(text, existing), [text, existing]);
  const found = parsed.words.length;
  const hasText = text.trim().length > 0;

  const copyPrompt = () => {
    navigator.clipboard.writeText(m.aiPrompt.replace("{lang}", lang));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={m.importTitle} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (found === 0) return;
          onImport(parsed.words);
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
            <p className="mt-1 text-xs leading-relaxed text-muted">{m.formatHint.replace("{lang}", lang)}</p>
          </div>
          <Button variant="soft" size="sm" onClick={copyPrompt} iconLeft={copied ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}>
            {copied ? m.promptCopied : m.copyPrompt}
          </Button>
        </div>

        <Textarea
          rows={8}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={m.importPlaceholder}
          aria-label={m.importTitle}
          className="font-mono"
        />

        {/* Что распознано — сразу, пока вставляешь */}
        {hasText && (
          <div aria-live="polite" className="grid gap-3">
            {found > 0 ? (
              <>
                <p className="text-sm">
                  <span className="font-semibold text-success">{plural(locale, found, m.importFound)}</span>
                  {parsed.skipped.length > 0 && <span className="text-muted"> · {plural(locale, parsed.skipped.length, m.importSkipped)}</span>}
                  {parsed.duplicates.length > 0 && (
                    <span className="text-muted"> · {plural(locale, parsed.duplicates.length, m.importDuplicates)}</span>
                  )}
                </p>
                <div className="grid gap-1.5 rounded-2xl border border-line p-3">
                  <p className="text-xs font-semibold text-muted">{m.importPreview}</p>
                  <ul className="grid gap-1">
                    {parsed.words.slice(0, PREVIEW).map((w, i) => (
                      <li key={i} className="flex min-w-0 items-center gap-2 text-sm">
                        <span className="truncate font-semibold text-fg">{w.word}</span>
                        <ArrowRight size={14} className="shrink-0 text-faint" aria-hidden />
                        <span className="truncate text-muted">{w.translation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Alert tone="warning">
                {parsed.duplicates.length > 0 && parsed.skipped.length === 0 ? m.importAllDuplicates : m.importNothing}
              </Alert>
            )}
            {parsed.skipped.length > 0 && (
              <div className="grid gap-1">
                <p className="text-xs font-semibold text-muted">{m.importSkippedLines}</p>
                <ul className="grid gap-0.5">
                  {parsed.skipped.slice(0, PREVIEW).map((s) => (
                    <li key={s.line} className="flex min-w-0 gap-2 font-mono text-xs text-muted">
                      <span className="shrink-0 tabular-nums text-faint">{m.importLine.replace("{n}", String(s.line))}</span>
                      <span className="truncate">{s.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth disabled={found === 0} iconLeft={<Upload size={18} />}>
          {found > 0 ? plural(locale, found, m.importButton) : m.importButtonIdle}
        </Button>
      </form>
    </Modal>
  );
}
