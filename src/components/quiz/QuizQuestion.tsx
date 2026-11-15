import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Info, Lightbulb, Plus, Volume2, X, Zap } from "lucide-react";
import { TaskType } from "../../types";
import { QuizQuestion, isTyping } from "../../quiz/plan";
import { speakWord } from "../../utils/tts";
import { Strength } from "../../utils/srs";
import { AnswerVerdict } from "../../utils/answerCheck";
import { useI18n } from "../../contexts/I18nContext";
import { Button, Card, IconButton, Input, cx } from "../../ui";
import ChoiceButton, { choiceState } from "../session/ChoiceButton";
import { StrengthChip } from "../cards/Flashcard";
import { posLabel } from "../../data/partsOfSpeech";
import AnswerDiff from "../session/AnswerDiff";

export interface QuizFeedback {
  answer: string; // "" — «Не знаю» / «Не помню»
  verdict: AnswerVerdict;
  correct: boolean;
  auto?: boolean; // верно с первого взгляда — разбор не нужен, тест сам идёт дальше
  canAddVariant?: boolean; // ответ — другое слово: можно дописать его в карточку как вариант
}

interface QuizQuestionProps {
  question: QuizQuestion;
  feedback: QuizFeedback | null;
  synonym?: { word: string; translation: string } | null; // ввели другое слово набора с тем же переводом
  voice?: string; // язык озвучки набора
  speakable?: boolean; // есть голос для языка: чужим голосом слово лучше не читать
  strength?: Strength; // сила памяти слова — на карточке вопроса, как во флэшкартах
  streak?: number; // верных подряд — значок на карточке с трёх
  coach?: boolean; // первый тест: строка о том, как он устроен
  onAnswer: (answer: string) => void;
  onAddVariant?: () => void; // «Добавить в карточку» после неверного письменного ответа
  onNext: () => void;
}

const KEYS = ["Digit1", "Digit2", "Digit3", "Digit4"];

// Вопрос теста (docs/specs/perigee.md, «Тест: честный ответ и карточка вопроса»). Сверху — карточка вопроса
// в тёплых тонах лица флэшкарты: что сделать, слово, часть речи, сила слова, серия. Снизу — ответы: на
// телефоне карточка занимает свободное место, а варианты оказываются под большим пальцем.
// Верный ответ — вспышка зелёного, дальше тест идёт сам. Ошибка или «почти» — разбор и «Дальше» (или Enter).
// «Не знаю» и «Не помню» — честный ответ вместо угадывания
export default function QuizQuestionComponent({
  question,
  feedback,
  synonym,
  voice,
  speakable,
  strength,
  streak = 0,
  coach,
  onAnswer,
  onAddVariant,
  onNext,
}: QuizQuestionProps) {
  const { t } = useI18n();
  const q = t.words.quiz;
  const [textInput, setTextInput] = useState("");
  const [added, setAdded] = useState(false);
  const lastSubmitTimeRef = useRef(0);
  const nextButton = useRef<HTMLButtonElement>(null);
  const typing = isTyping(question.type);
  const listening = question.type === TaskType.LISTEN;
  const described = question.type === TaskType.WORD_BY_EXPLANATION || question.type === TaskType.WRITE_WORD_BY_EXPLANATION;

  // Вопрос на слух: слово звучит сразу, повторить — кнопкой
  useEffect(() => {
    if (listening) speakWord(question.card.word, voice);
  }, [listening, question, voice]);

  useEffect(() => {
    setTextInput("");
    setAdded(false);
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
  const diffTarget = typing && verdict && verdict.result !== "exact" && feedback?.answer ? verdict.expected : undefined;
  const showDetails = !!feedback && !feedback.auto;

  // Разбор на телефоне не помещается целиком — подкручиваем к «Дальше», чтобы не искать кнопку
  useEffect(() => {
    if (showDetails) nextButton.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [showDetails]);

  const submit = (text: string) => {
    lastSubmitTimeRef.current = Date.now();
    onAnswer(text);
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 sm:my-auto sm:flex-none">
      {/* Карточка вопроса */}
      <div className="relative flex min-h-44 flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-4xl border border-accent/15 bg-accent-soft px-6 pb-8 pt-14 text-center text-fg sm:min-h-64 sm:flex-none">
        {/* Кольцо «Орбиты», как на лице флэшкарты, но без спутника: на короткой карточке он налезал на слово */}
        <svg viewBox="0 0 200 200" aria-hidden className="pointer-events-none absolute -bottom-28 -right-28 h-64 w-64 text-accent/20">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          {strength !== undefined ? <StrengthChip strength={strength} /> : <span />}
          {/* Серия с трёх подряд; каждое новое верное — короткий «щелчок» значка */}
          {streak >= 3 && (
            <motion.span
              key={streak}
              initial={{ scale: 1.25 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 18 }}
              className="inline-flex items-center gap-1 rounded-full bg-surface/70 px-3 py-1 text-xs font-semibold text-accent-ink"
            >
              <Zap size={12} />
              {q.streak.replace("{n}", String(streak))}
            </motion.span>
          )}
        </div>

        <p className="relative text-base font-semibold text-accent-ink">{q.prompts[question.type as keyof typeof q.prompts]}</p>
        {listening && !feedback ? (
          <div className="relative grid justify-items-center gap-2">
            <button
              type="button"
              aria-label={q.listenAgain}
              onClick={() => speakWord(question.card.word, voice)}
              className="grid h-20 w-20 place-items-center rounded-full bg-surface text-accent-ink shadow-sm transition-colors hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Volume2 size={36} />
            </button>
            <p className="text-xs text-muted">{q.listenAgain}</p>
          </div>
        ) : (
          <h2
            dir="auto"
            className={cx(
              "relative wrap-break-word",
              described ? "text-xl font-semibold leading-snug sm:text-2xl" : "font-display text-3xl font-extrabold leading-tight sm:text-4xl",
            )}
          >
            {question.prompt}
          </h2>
        )}
        {question.card.partOfSpeech && (
          <span className="relative rounded-full bg-surface/70 px-3 py-1 text-sm font-medium text-muted">{posLabel(question.card.partOfSpeech, t.words.pos)}</span>
        )}
      </div>

      {coach && !feedback && (
        <div className="flex gap-2.5 rounded-2xl bg-inset p-3 text-left text-sm text-muted">
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent-ink" />
          <p className="leading-snug">{q.coach}</p>
        </div>
      )}

      {/* Ответы */}
      <div className="grid gap-3">
        {question.options && !typing && (
          <>
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
            {!feedback && (
              <Button variant="ghost" size="sm" onClick={() => onAnswer("")} className="justify-self-center">
                {q.dontKnow}
              </Button>
            )}
          </>
        )}

        {typing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!feedback && textInput.trim()) submit(textInput.trim());
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
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" size="lg" onClick={() => submit("")}>
                  {q.dontRemember}
                </Button>
                <Button type="submit" size="lg" disabled={!textInput.trim()}>
                  {q.check}
                </Button>
              </div>
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
                <p className="font-semibold">{close ? q.almost : correct ? q.correct : q.incorrect}</p>
                {close && <p className="text-sm text-fg">{q.closeReasons[close]}</p>}
                {diffTarget && (!correct || close) ? (
                  <AnswerDiff typed={feedback.answer} expected={diffTarget} />
                ) : (
                  <>
                    {(!correct || close) && (
                      <p className="text-sm text-fg">
                        <span className="text-muted">{q.correctAnswer}</span> <strong className="font-semibold">{question.correctAnswer}</strong>
                      </p>
                    )}
                    {!correct && typing && feedback.answer && (
                      <p className="text-sm text-fg">
                        <span className="text-muted">{q.yourAnswer}</span> {feedback.answer}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Проверка не знала такого варианта? Дописать его в карточку — честно: сейчас это ошибка,
                а со следующего раза ответ примется сам. Засчитать «на слово» больше нельзя */}
            {feedback.canAddVariant && onAddVariant && (
              added ? (
                <p role="status" className="flex items-start justify-center gap-2 text-center text-sm text-success">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {q.variantAdded.replace("{answer}", feedback.answer)}
                </p>
              ) : (
                <div className="grid justify-items-center gap-1 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Plus size={16} />}
                    onClick={() => {
                      onAddVariant();
                      setAdded(true);
                    }}
                  >
                    {q.addVariant.replace("{answer}", feedback.answer)}
                  </Button>
                  <p className="text-xs text-faint">{q.addVariantHint}</p>
                </div>
              )
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
                  <IconButton variant="soft" size="sm" label={q.speak} onClick={() => speakWord(question.card.word, voice)} className="-my-1 shrink-0">
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

            <Button ref={nextButton} size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={onNext}>
              {q.next}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
