import { useState, useEffect, useMemo, useRef } from "react";
import { Plus } from "lucide-react";
import { Card } from "../types";
import { useI18n } from "../contexts/I18nContext";
import { getLanguageInfo } from "../locales/languages";
import { plural } from "../utils/plural";
import { normalizeWord } from "../utils/importText";
import { Button, Modal } from "../ui";
import WordFields, { emptyWord, trimWord } from "./cards/WordFields";

/** Слово, которое уже есть в курсе: для мягкого предупреждения о повторе */
export interface CourseWord {
  word: string;
  translation: string;
  set: string; // название набора
  here: boolean; // в этом же наборе
}

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cardData: Omit<Card, "id" | "srsData" | "createdAt">) => void; // сохраняет, окно остаётся открытым
  courseCode: string;
  courseWords: readonly CourseWord[];
}

const RECENT = 3;

// Новое слово — подряд, без повторного открытия окна (docs/specs/06-audit-fixes.md, шаг 3): «Добавить» (и Enter)
// сохраняет слово, очищает поля и возвращает курсор в слово; «Готово» закрывает окно. Раньше окно закрывалось
// после каждого слова, и двадцать слов значили двадцать открытий. Если такое слово уже есть в курсе — подсказка
// под полем с набором и переводом; добавить всё равно можно: омонимы — разные карточки
export default function AddCardModal({ isOpen, onClose, onSave, courseCode, courseWords }: AddCardModalProps) {
  const { t, language } = useI18n();
  const m = t.words.editCollection.modals;
  const locale = getLanguageInfo(language).htmlLang;
  const [draft, setDraft] = useState(emptyWord);
  const [added, setAdded] = useState<string[]>([]);
  const wordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(emptyWord());
    setAdded([]);
  }, [isOpen]);

  const valid = draft.word.trim() && draft.translation.trim();

  // Это слово уже есть в курсе? Сначала — в этом же наборе
  const repeat = useMemo(() => {
    const key = normalizeWord(draft.word);
    if (!key) return null;
    const same = courseWords.filter((w) => normalizeWord(w.word) === key);
    return same.find((w) => w.here) ?? same[0] ?? null;
  }, [draft.word, courseWords]);

  const repeatHint = repeat && (
    <span className="text-warning">
      {(repeat.here ? m.duplicateHere : m.duplicateIn.replace("{set}", repeat.set))
        .replace("{word}", repeat.word)
        .replace("{translation}", repeat.translation)}
    </span>
  );

  return (
    <Modal open={isOpen} onClose={onClose} title={m.newWord} size="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const word = trimWord(draft);
          onSave(word);
          setAdded((list) => [...list, word.word]);
          setDraft(emptyWord());
          wordRef.current?.focus();
        }}
        className="grid gap-6"
      >
        <WordFields
          value={draft}
          onChange={setDraft}
          idPrefix="new-word"
          courseCode={courseCode}
          autoFocus
          wordRef={wordRef}
          wordHint={repeatHint}
        />
        <div className="grid gap-3">
          {added.length > 0 && (
            <p aria-live="polite" className="truncate text-sm">
              <span className="font-semibold text-success">{plural(locale, added.length, t.words.editCollection.wordsAdded)}</span>
              <span className="text-muted"> · {added.slice(-RECENT).reverse().join(", ")}</span>
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" size="lg" onClick={onClose}>
              {added.length > 0 ? m.done : t.cancel}
            </Button>
            <Button type="submit" size="lg" disabled={!valid} iconLeft={<Plus size={18} />}>
              {m.addWord}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
