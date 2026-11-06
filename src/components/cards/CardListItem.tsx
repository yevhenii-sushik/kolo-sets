import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "../../types";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Badge, Button, IconButton, cx } from "../../ui";
import WordFields, { WordDraft, trimWord } from "./WordFields";
import { normalizePos, posLabel } from "../../data/partsOfSpeech";

interface CardListItemProps {
  card: Card;
  onSave: (cardData: Omit<Card, "id" | "srsData" | "createdAt">) => void;
  onDelete: () => void;
}

// Слово в списке набора: компактно — слово, часть речи, перевод, объяснение, пример, освоение.
// По клику (или карандашу) превращается в форму правки.
export default function CardListItem({ card, onSave, onDelete }: CardListItemProps) {
  const { t, language } = useI18n();
  const e = t.words.editCollection;
  const [draft, setDraft] = useState<WordDraft | null>(null);

  const startEditing = () =>
    setDraft({
      word: card.word,
      translation: card.translation,
      partOfSpeech: normalizePos(card.partOfSpeech),
      explanation: card.explanation,
      example: card.example,
    });

  if (draft) {
    const valid = draft.word.trim() && draft.translation.trim();
    return (
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          if (!valid) return;
          onSave(trimWord(draft));
          setDraft(null);
        }}
        onKeyDown={(ev) => ev.key === "Escape" && setDraft(null)}
        className="grid gap-5 rounded-3xl border border-accent bg-surface p-5"
      >
        <WordFields value={draft} onChange={setDraft} idPrefix={`edit-${card.id}`} autoFocus />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDraft(null)}>
            {t.cancel}
          </Button>
          <Button type="submit" disabled={!valid}>
            {t.save}
          </Button>
        </div>
      </form>
    );
  }

  // Освоение — по интервалу повторения, максимум 5 делений
  const level = Math.min(5, card.srsData?.interval || 0);
  const total = card.srsData.totalReviews ?? 0;
  const accuracy = total > 0 && card.srsData.correctReviews != null ? Math.round((card.srsData.correctReviews / total) * 100) : null;

  return (
    <div
      onClick={startEditing}
      className="group cursor-pointer rounded-3xl border border-line bg-surface p-5 transition-colors hover:border-accent/40"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 dir="auto" className="font-display text-xl font-extrabold text-fg">{card.word}</h3>
            {card.partOfSpeech && <Badge>{posLabel(card.partOfSpeech, t.words.pos)}</Badge>}
          </div>
          <p dir="auto" className="mt-0.5 text-base font-medium text-accent-ink">{card.translation}</p>
        </div>
        <div className="flex shrink-0 gap-0.5" onClick={(ev) => ev.stopPropagation()}>
          <IconButton size="sm" label={t.edit} onClick={startEditing}>
            <Pencil size={16} />
          </IconButton>
          <IconButton size="sm" label={t.delete} onClick={onDelete}>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {(card.explanation || card.example) && (
        <div className="mt-3 grid gap-1 text-sm leading-relaxed">
          {card.explanation && <p dir="auto" className="text-muted">{card.explanation}</p>}
          {card.example && <p dir="auto" className="italic text-fg">{card.example}</p>}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3">
        <div className="flex items-center gap-1" title={t.words.collectionCard.masteryLevel} aria-label={`${t.words.collectionCard.masteryLevel}: ${level}/5`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className={cx("h-1.5 w-5 rounded-full", i < level ? "bg-accent" : "bg-track")} />
          ))}
        </div>
        {total > 0 && (
          <p className="text-xs text-faint">
            {plural(getLanguageInfo(language).htmlLang, total, e.reviews)}
            {accuracy !== null && (
              <>
                {" · "}
                <span className={cx("font-semibold", accuracy >= 70 ? "text-success" : accuracy >= 40 ? "text-warning" : "text-danger")}>
                  {e.accuracy.replace("{n}", String(accuracy))}
                </span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
