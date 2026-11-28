import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { sendSupport } from "../../api/support";
import { LEGAL } from "../../pages/legal/legalInfo";
import { Alert, Button, Field, Modal, Select, Text, Textarea } from "../../ui";
import type { Collection } from "../../types";

export interface ReportCard {
  id: string; // id карточки в готовом наборе (presetCardId)
  word: string;
  translation: string;
}

// Что показать в окне: набор и его карточки. Одна карточка — без выбора слова (открыли со слова в своём
// наборе), несколько — выбор из списка (открыли из просмотра набора Kolo)
export interface ReportTarget {
  preset: NonNullable<Collection["preset"]>;
  cards: ReportCard[];
  voice: string; // язык слов — для lang у текста
}

const MESSAGE_MAX = 1000;

// «Сообщить об ошибке» в готовом наборе (docs/specs/05-ready-sets.md, «Ошибки в наборах»): наборы выходят без
// вычитки, поэтому ошибку можно отправить прямо с карточки. Сообщение уходит в чат команды через /api/support
// вместе с набором, карточкой и языком перевода — переспрашивать, о каком слове речь, не нужно
export default function ReportMistakeModal({
  target,
  onClose,
  onSent,
}: {
  target: ReportTarget | null;
  onClose: () => void;
  onSent: () => void;
}) {
  const { t } = useI18n();
  const r = t.words.ready.report;
  const [cardId, setCardId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<false | "limit" | "failed">(false);

  useEffect(() => {
    if (!target) return;
    setCardId(target.cards.length === 1 ? target.cards[0].id : "");
    setMessage("");
    setFailed(false);
  }, [target]);

  const card = target?.cards.find((c) => c.id === cardId);
  const canSend = !!card && message.trim().length > 0 && !busy;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !card || !canSend) return;
    setBusy(true);
    setFailed(false);
    // Ответ не просим: команде достаточно набора и карточки, почта аккаунта и так видна в сообщении
    const result = await sendSupport("problem", message.trim(), false, {
      set: target.preset.id,
      version: target.preset.version,
      card: card.id,
      lang: target.preset.lang,
      word: card.word,
      translation: card.translation,
    });
    setBusy(false);
    if (result !== "ok") {
      setFailed(result);
      return;
    }
    onSent();
  };

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={r.title}
      size="sm"
      footer={
        <Button type="submit" form="report-mistake" fullWidth loading={busy} disabled={!canSend} iconLeft={<Send size={16} />}>
          {r.send}
        </Button>
      }
    >
      {target && (
        <form id="report-mistake" onSubmit={send} className="grid gap-5">
          <Text size="sm" tone="muted">
            {r.intro}
          </Text>
          {target.cards.length === 1 ? (
            <div className="grid gap-0.5 rounded-2xl bg-inset px-4 py-3">
              <span lang={target.voice} className="font-semibold text-fg">
                {target.cards[0].word}
              </span>
              <span className="text-sm text-muted">{target.cards[0].translation}</span>
            </div>
          ) : (
            <Field label={r.word} htmlFor="report-word">
              <Select id="report-word" value={cardId} onChange={(e) => setCardId(e.target.value)}>
                <option value="" disabled>
                  {r.wordPick}
                </option>
                {target.cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.word} — {c.translation}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label={r.message} htmlFor="report-message">
            <Textarea
              id="report-message"
              rows={4}
              maxLength={MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={r.placeholder}
            />
          </Field>
          {failed && (
            <Alert tone={failed === "limit" ? "warning" : "danger"}>
              {failed === "limit" ? t.other.supportPage.limit.replace("{email}", LEGAL.email.support) : r.error}
            </Alert>
          )}
        </form>
      )}
    </Modal>
  );
}
