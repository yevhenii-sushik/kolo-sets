import { useMemo } from "react";
import { DiffMark, DiffPart, spellingDiff } from "../../utils/answerCheck";
import { useI18n } from "../../contexts/I18nContext";
import { cx } from "../../ui";

// Где ошибка в письменном ответе: в ответе пользователя отмечены не те, лишние и пропущенные буквы,
// в правильном написании — буквы, которые надо было написать иначе. Цвет дублируется подчёркиванием
// и зачёркиванием, чтобы разница была видна и без различения цветов
const MARK: Record<DiffMark, string> = {
  same: "",
  wrong: "font-semibold text-danger underline decoration-2 underline-offset-4",
  extra: "text-danger line-through decoration-2",
  missing: "font-semibold text-danger",
  fixed: "font-bold text-success underline decoration-2 underline-offset-4",
};

function Letters({ parts }: { parts: DiffPart[] }) {
  return (
    <span dir="auto" className="whitespace-pre-wrap">
      {parts.map((part, i) => (
        <span key={i} className={cx(MARK[part.mark])}>
          {part.text}
        </span>
      ))}
    </span>
  );
}

export default function AnswerDiff({ typed, expected }: { typed: string; expected: string }) {
  const { t } = useI18n();
  const q = t.words.quiz;
  const diff = useMemo(() => spellingDiff(typed, expected), [typed, expected]);
  return (
    <div className="grid gap-1 text-sm text-fg">
      <p>
        <span className="text-muted">{q.yourAnswer}</span> <Letters parts={diff.typed} />
      </p>
      <p>
        <span className="text-muted">{q.correctAnswer}</span>{" "}
        <strong className="font-semibold">
          <Letters parts={diff.fixed} />
        </strong>
      </p>
    </div>
  );
}
