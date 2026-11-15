import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, CheckCheck, Info, Volume2, X } from "lucide-react";
import { TaskType } from "../../types";
import { QuizQuestion, isTyping } from "../../quiz/plan";
import { speak } from "../../utils/tts";
import { AnswerVerdict } from "../../utils/answerCheck";
import { useI18n } from "../../contexts/I18nContext";
import { Button, Card, IconButton, Input, cx } from "../../ui";
import ChoiceButton, { choiceState } from "../session/ChoiceButton";
import { posLabel } from "../../data/partsOfSpeech";
import AnswerDiff from "../session/AnswerDiff";

export interface QuizFeedback {
  answer: string;
  verdict: AnswerVerdict;
  correct: boolean;
  overruled?: boolean; // засчитан кнопкой «Мой ответ верный»
  auto?: boolean; // верно с первого взгляда — разбор не нужен, тест сам идёт дальше
}

interface QuizQuestionProps {
  question: QuizQuestion;
  feedback: QuizFeedback | null;
  synonym?: { word: string; translation: string } | null; // ввели другое слово набора с тем же переводом
  voice?: string; // язык озвучки набора
  speakable?: boolean; // есть голос для языка: чужим голосом слово лучше не читать
  onAnswer: (answer: string) => void;
  onOverride?: () => void; // «Мой ответ верный» после письменного ответа
  onNext: () => void;
}

const KEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];

// Вопрос теста: выбор из вариантов (клавиши 1–4) или ввод слова. Верный ответ — короткая вспышка
// зелёного, дальше тест идёт сам (как в Perigee). Ошибка или «почти» — разбор карточки и «Дальше» (или Enter)
export default function QuizQuestionComponent({ question, feedback, synonym, voice, speakable, onAnswer, onOverride, onNext }: QuizQuestionProps) {
  const { t } = useI18n();
  const q = t.words.quiz;
  const [textInput, setTextInput] = useState("");
  const lastSubmitTimeRef = useRef(0);
  const typing = isTyping(question.type);
  const listening = question.type === TaskType.LISTEN;

  // Вопрос на слух: слово звучит сразу, повторить — кнопкой
  useEffect(() => {
    if (listening) speak(question.card.word, voice);
  }, [listening, question, voice]);

  useEffect(() => {
    setTextInput("");
  }, [question]);

  // Клавиши 1–4 — выбрать вариант
  useEffect(() => {
    if (feedback || !question.options) return;
    const options = question.options;
    const handler = (e: KeyboardEvent) => {
      const i = KEYS.indexOf(e.code);
      if (i !== -1 && options[i]) onAnswer(options[i]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedback, question, onAnswer]);

  // Enter после ответа — к следующему вопросу (кроме Enter, которым только что отправили ответ)
  useEffect(() => {
    if (!feedback) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || Date.now() - lastSubmitTimeRef.current < 300) return;
      e.preventDefault();
      onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [feedback, onNext]);

  const verdict = feedback?.verdict;
  const correct = !!feedback?.correct;
  const close = correct && verdict?.result === "close" ? verdict.reason : null;
  // Побуквенный разбор — для «почти» и небольшого промаха: видно, где именно опечатка
  const diffTarget = typing && verdict && verdict.result !== "exact" ? verdict.expected : undefined;
  const showDetails = !!feedback && !feedback.auto;

  const submitText = () => {
    if (!textInput.trim()) return;
    lastSubmitTimeRef.current = Date.now();
    onAnswer(textInput.trim());
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="grid gap-2 text-center">
        <p className="text-sm font-medium text-muted">{q.prompts[question.type as keyof typeof q.prompts]}</p>
        {listening && !feedback ? (
          <div className="grid justify-items-center gap-2 py-1">
            <button
              type="button"
              aria-label={q.listenAgain}
              onClick={() => speak(question.card.word, voice)}
              className="grid h-20 w-20 place-items-center rounded-full bg-accent-soft text-accent-ink transition-colors hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Volume2 size={36} />
            </button>
            <p className="text-xs text-faint">{q.listenAgain}</p>
          </div>
        ) : (
          <h2 dir="auto" className="font-display text-2xl font-extrabold text-fg sm:text-3xl">
            {question.prompt}
          </h2>
        )}
      </div>

      {question.options && !typing && (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option, i) => (
            <ChoiceButton
              key={option}
              label={option}
              hint={String(i + 1)}
              state={choiceState(option, feedback ? feedback.answer : null, question.correctAnswer)}
              onClick={() => onAnswer(option)}
            />
          ))}
        </div>
      )}

      {typing && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!feedback) submitText();
          }}
          className="grid gap-3"
        >
          <Input
            autoFocus
            dir="auto"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={!!feedback}
            placeholder={q.placeholder}
            invalid={!!feedback && !correct}
            aria-label={q.placeholder}
            // Иначе телефон «исправляет» иностранное слово на слово своего языка и ставит заглавную
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
          />
          {/* Синоним из набора — не ошибка, но спрашиваем другое слово: поле остаётся открытым */}
          {synonym && !feedback && (
            <p role="status" className="flex items-start gap-2 rounded-2xl bg-info-soft px-4 py-3 text-sm text-info">
              <Info size={16} className="mt-0.5 shrink-0" />
              <span>{q.synonym.replace("{word}", synonym.word).replace("{translation}", synonym.translation)}</span>
            </p>
          )}
          {!feedback && (
            <Button type="submit" size="lg" fullWidth disabled={!textInput.trim()}>
              {q.check}
            </Button>
          )}
          {feedback?.auto && (
            <p role="status" className="flex items-center justify-center gap-2 font-semibold text-success">
              <Check size={20} />
              {q.correct}
            </p>
          )}
        </form>
      )}

      {showDetails && feedback && (
        <div className="grid gap-3">
          <div
            role="status"
            className={cx("flex items-start gap-3 rounded-2xl px-4 py-3", correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}
          >
            {correct ? <Check size={20} className="mt-0.5 shrink-0" /> : <X size={20} className="mt-0.5 shrink-0" />}
            <div className="grid gap-0.5">
              <p className="font-semibold">{feedback.overruled ? q.overruled : close ? q.almost : correct ? q.correct : q.incorrect}</p>
              {close && <p className="text-sm text-fg">{q.closeReasons[close]}</p>}
              {!feedback.overruled &&
                (diffTarget && (!correct || close) ? (
                  <AnswerDiff typed={feedback.answer} expected={diffTarget} />
                ) : (
                  <>
                    {(!correct || close) && (
                      <p className="text-sm text-fg">
                        <span className="text-muted">{q.correctAnswer}</span> <strong className="font-semibold">{question.correctAnswer}</strong>
                      </p>
                    )}
                    {!correct && typing && (
                      <p className="text-sm text-fg">
                        <span className="text-muted">{q.yourAnswer}</span> {feedback.answer}
                      </p>
                    )}
                  </>
                ))}
            </div>
          </div>

          {!correct && typing && onOverride && (
            <Button variant="ghost" size="sm" iconLeft={<CheckCheck size={16} />} onClick={onOverride} className="justify-self-center">
              {q.overrule}
            </Button>
          )}

          {/* Разбор карточки: слово, перевод, объяснение, пример */}
          <Card tone="inset" padding="sm" className="grid gap-1 text-left">
            <p className="text-xs font-semibold text-muted">{q.moreInfo}</p>
            <div className="flex items-start justify-between gap-2">
              <p dir="auto" className="font-semibold text-fg">
                {question.card.word}
                {question.card.partOfSpeech && <span className="ml-2 text-sm font-normal text-faint">{posLabel(question.card.partOfSpeech, t.words.pos)}</span>}
              </p>
              {/* Услышать правильное слово после ошибки — так оно запоминается и на слух */}
              {speakable && (
                <IconButton variant="soft" size="sm" label={q.speak} onClick={() => speak(question.card.word, voice)} className="-my-1 shrink-0">
                  <Volume2 size={16} />
                </IconButton>
              )}
            </div>
            <p dir="auto" className="text-sm text-accent-ink">
              {question.card.translation}
            </p>
            {question.card.explanation && (
              <p dir="auto" className="text-sm text-muted">
                {question.card.explanation}
              </p>
            )}
            {question.card.example && (
              <p dir="auto" className="text-sm italic text-muted">
                {question.card.example}
              </p>
            )}
          </Card>

          <Button size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={onNext}>
            {q.next}
          </Button>
        </div>
      )}
    </div>
  );
}
