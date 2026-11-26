import type { ReactNode, Ref } from "react";
import { Field, Input, Select, Textarea } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { POS_CODES, normalizePos } from "../../data/partsOfSpeech";
import { getLanguageInfo } from "../../locales/languages";
import { courseNameInline } from "../../courses/languages";
import { starterWords } from "../../data/starterWords";

export interface WordDraft {
  word: string;
  translation: string;
  partOfSpeech: string;
  explanation: string;
  example: string;
}

export const emptyWord = (): WordDraft => ({ word: "", translation: "", partOfSpeech: "", explanation: "", example: "" });

// Поля слова — общие для окна «Новое слово» и правки прямо в списке.
// Подписи и примеры — про язык курса: раньше в любом курсе было «Объяснение (на норвежском)» и «например,
// skrive» (docs/specs/06-audit-fixes.md, Л12). Пример слова — «вода» на изучаемом языке из слов первого набора
// (src/data/starterWords.ts); для языка без них пример не показываем
export default function WordFields({
  value,
  onChange,
  idPrefix,
  courseCode,
  autoFocus,
  wordRef,
  wordHint,
}: {
  value: WordDraft;
  onChange: (next: WordDraft) => void;
  idPrefix: string;
  courseCode: string;
  autoFocus?: boolean;
  wordRef?: Ref<HTMLInputElement>; // окно «Новое слово» возвращает фокус в слово после «Добавить»
  wordHint?: ReactNode; // под полем слова — например, «такое слово уже есть в наборе…»
}) {
  const { t, language } = useI18n();
  const f = t.words.editCollection.fields;
  const set = (key: keyof WordDraft) => (e: { target: { value: string } }) => onChange({ ...value, [key]: e.target.value });
  const id = (key: string) => `${idPrefix}-${key}`;
  const lang = courseNameInline(courseCode, getLanguageInfo(language).htmlLang);
  const sample = starterWords(courseCode, t.home.firstSteps.guides.words.starter)?.[4];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* dir="auto" — слова на арабском, иврите и т. п. пишутся справа налево */}
        <Field label={`${f.word} *`} htmlFor={id("word")} hint={wordHint}>
          <Input
            ref={wordRef}
            id={id("word")}
            dir="auto"
            autoFocus={autoFocus}
            value={value.word}
            onChange={set("word")}
            placeholder={sample ? f.wordPlaceholder.replace("{word}", sample.word) : undefined}
            required
          />
        </Field>
        <Field label={`${f.translation} *`} htmlFor={id("translation")}>
          <Input
            id={id("translation")}
            dir="auto"
            value={value.translation}
            onChange={set("translation")}
            placeholder={sample ? f.translationPlaceholder.replace("{translation}", sample.translation) : undefined}
            required
          />
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
      <Field label={f.explanation.replace("{lang}", lang)} htmlFor={id("explanation")}>
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
