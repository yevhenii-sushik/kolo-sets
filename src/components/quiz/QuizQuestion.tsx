import { useState, useEffect, useRef } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { TaskType } from "../../types";
import { QuizQuestion } from "../../utils/quizGenerator";
import { useI18n } from "../../contexts/I18nContext";
import { Button, Card, Input, cx } from "../../ui";
import ChoiceButton, { choiceState } from "../session/ChoiceButton";
import MatchingExercise from "./MatchingExercise";

interface QuizQuestionProps {
  question: QuizQuestion;
  userAnswer: string;
  showFeedback: boolean;
  isCorrect: boolean;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}

// Вопрос теста: выбор из вариантов или ввод слова; после ответа — разбор карточки и «Дальше» (или Enter)
export default function QuizQuestionComponent({ question, userAnswer, showFeedback, isCorrect, onAnswer, onNext }: QuizQuestionProps) {
  const { t } = useI18n();
  const q = t.words.quiz;
  const [textInput, setTextInput] = useState("");
  const lastSubmitTimeRef = useRef(0);

  useEffect(() => {
    setTextInput("");
  }, [question]);

  // Enter после ответа — к следующему вопросу (кроме Enter, которым только что отправили ответ)
  useEffect(() => {
    if (!showFeedback) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || Date.now() - lastSubmitTimeRef.current < 300) return;
      e.preventDefault();
      onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showFeedback, onNext]);

  if (question.type === TaskType.MATCHING) {
    return (
      <MatchingExercise
        pairs={question.pairs!}
        onComplete={() => {
          onAnswer("matched");
          onNext();
        }}
      />
    );
  }

  const isWriteType = question.type === TaskType.WRITE_WORD_BY_TRANSLATION || question.type === TaskType.WRITE_WORD_BY_EXPLANATION;

  const submitText = () => {
    if (!textInput.trim()) return;
    lastSubmitTimeRef.current = Date.now();
    onAnswer(textInput.trim());
  };

  return (
    <div className="mx-auto grid max-w-2xl gap-5">
      <div className="grid gap-2 text-center">
        <p className="text-sm font-medium text-muted">{q.settings.types[question.type as keyof typeof q.settings.types]}</p>
        <h2 className="font-display text-2xl font-semibold text-fg sm:text-3xl">{question.question}</h2>
      </div>

      {question.options && !isWriteType && (
        <div className="grid gap-2 sm:grid-cols-2">
          {question.options.map((option, i) => (
            <ChoiceButton
              key={option}
              label={option}
              hint={String.fromCharCode(65 + i)}
              state={choiceState(option, showFeedback ? userAnswer : null, question.correctAnswer)}
              onClick={() => onAnswer(option)}
            />
          ))}
        </div>
      )}

      {isWriteType && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!showFeedback) submitText();
          }}
          className="grid gap-3"
        >
          <Input
            autoFocus
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={showFeedback}
            placeholder={q.placeholder}
            invalid={showFeedback && !isCorrect}
            aria-label={q.placeholder}
          />
          {!showFeedback && (
            <Button type="submit" size="lg" fullWidth disabled={!textInput.trim()}>
              {q.check}
            </Button>
          )}
        </form>
      )}

      {showFeedback && (
        <div className="grid gap-3">
          <div
            role="status"
            className={cx(
              "flex items-start gap-3 rounded-2xl px-4 py-3",
              isCorrect ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
            )}
          >
            {isCorrect ? <Check size={20} className="mt-0.5 shrink-0" /> : <X size={20} className="mt-0.5 shrink-0" />}
            <div className="grid gap-0.5">
              <p className="font-semibold">{isCorrect ? q.correct : q.incorrect}</p>
              {!isCorrect && (
                <p className="text-sm text-fg">
                  <span className="text-muted">{q.correctAnswer}</span> <strong className="font-semibold">{question.correctAnswer}</strong>
                </p>
              )}
              {!isCorrect && isWriteType && (
                <p className="text-sm text-fg">
                  <span className="text-muted">{q.yourAnswer}</span> {userAnswer}
                </p>
              )}
            </div>
          </div>

          {/* Разбор карточки: слово, перевод, объяснение, пример */}
          <Card tone="inset" padding="sm" className="grid gap-1 text-left">
            <p className="text-xs font-semibold text-muted">{q.moreInfo}</p>
            <p className="font-semibold text-fg">
              {question.card.word}
              {question.card.partOfSpeech && <span className="ml-2 text-sm font-normal text-faint">{question.card.partOfSpeech}</span>}
            </p>
            <p className="text-sm text-accent-ink">{question.card.translation}</p>
            {question.card.explanation && <p className="text-sm text-muted">{question.card.explanation}</p>}
            {question.card.example && <p className="text-sm italic text-muted">{question.card.example}</p>}
          </Card>

          <Button size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={onNext}>
            {q.next.replace("→", "").trim()}
          </Button>
        </div>
      )}
    </div>
  );
}
