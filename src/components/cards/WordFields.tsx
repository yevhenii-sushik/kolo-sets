import { Field, Input, Select, Textarea } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { POS_CODES, normalizePos } from "../../data/partsOfSpeech";

export interface WordDraft {
  word: string;
  translation: string;
  partOfSpeech: string;
  explanation: string;
  example: string;
}

export const emptyWord = (): WordDraft => ({ word: "", translation: "", partOfSpeech: "", explanation: "", example: "" });

// Поля слова — общие для окна «Новое слово» и правки прямо в списке
export default function WordFields({
  value,
  onChange,
  idPrefix,
  autoFocus,
}: {
  value: WordDraft;
  onChange: (next: WordDraft) => void;
  idPrefix: string;
  autoFocus?: boolean;
}) {
  const { t } = useI18n();
  const f = t.words.editCollection.fields;
  const set = (key: keyof WordDraft) => (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value });
  const id = (key: string) => `${idPrefix}-${key}`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* dir="auto" — слова на арабском, иврите и т. п. пишутся справа налево */}
        <Field label={`${f.word} *`} htmlFor={id("word")}>
          <Input id={id("word")} dir="auto" autoFocus={autoFocus} value={value.word} onChange={set("word")} placeholder={f.wordPlaceholder} required />
        </Field>
        <Field label={`${f.translation} *`} htmlFor={id("translation")}>
          <Input id={id("translation")} dir="auto" value={value.translation} onChange={set("translation")} placeholder={f.translationPlaceholder} required />
        </Field>
      </div>
      <Field label={f.partOfSpeech} htmlFor={id("pos")}>
        <Select id={id("pos")} value={value.partOfSpeech} onChange={set("partOfSpeech")}>
          <option value="">{f.partOfSpeechNone}</option>
          {POS_CODES.map((code) => (
            <option key={code} value={code}>
              {t.words.pos[code]}
            </option>
          ))}
          {/* Значение не из списка (например, из импорта) — показываем, чтобы оно не потерялось */}
          {value.partOfSpeech && !(POS_CODES as readonly string[]).includes(value.partOfSpeech) && (
            <option value={value.partOfSpeech}>{value.partOfSpeech}</option>
          )}
        </Select>
      </Field>
      <Field label={f.explanation} htmlFor={id("explanation")}>
        <Textarea id={id("explanation")} dir="auto" rows={2} value={value.explanation} onChange={set("explanation")} placeholder={f.explanationPlaceholder} />
      </Field>
      <Field label={f.example} htmlFor={id("example")}>
        <Textarea id={id("example")} dir="auto" rows={2} value={value.example} onChange={set("example")} placeholder={f.examplePlaceholder} />
      </Field>
    </div>
  );
}

// Обрезаем пробелы перед сохранением
export const trimWord = (w: WordDraft): WordDraft => ({
  word: w.word.trim(),
  translation: w.translation.trim(),
  partOfSpeech: normalizePos(w.partOfSpeech),
  explanation: w.explanation.trim(),
  example: w.example.trim(),
});
