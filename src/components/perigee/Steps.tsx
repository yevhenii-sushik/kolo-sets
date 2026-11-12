import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, CheckCheck, Volume2, X } from "lucide-react";
import { Card as CardData, KnowledgeLevel } from "../../types";
import { Badge, Button, Card, IconButton, Input, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { posLabel } from "../../data/partsOfSpeech";
import { isTTSSupported, speak } from "../../utils/tts";
import { playSound, RATING_PITCH } from "../../utils/sounds";
import { makeChoicesFor } from "../../utils/gameUtils";
import { AnswerVerdict, checkAnswer } from "../../utils/answerCheck";
import ChoiceButton, { choiceState } from "../session/ChoiceButton";
import CardStage from "../session/CardStage";
import RatingBar from "../session/RatingBar";

// Шаги сессии Perigee (docs/specs/perigee.md): знакомство, выбор, ввод, флэшкарта наоборот.
// Каждый шаг сам показывает разбор и зовёт onAnswer один раз — когда пользователь готов идти дальше.

const AUTO_NEXT_MS = 650; // верный ответ — короткая пауза, чтобы увидеть зелёный, и дальше

// Enter — «Дальше», когда кнопка видна
function useEnter(active: boolean, onEnter: () => void) {
  const ref = useRef(onEnter);
  ref.current = onEnter;
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      ref.current();
    };
    // Не ловим тот же Enter, которым отправили ответ
    const id = setTimeout(() => window.addEventListener("keydown", handler), 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("keydown", handler);
    };
  }, [active]);
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 py-6 sm:px-6">
      <div className="mx-auto my-auto grid w-full max-w-xl gap-5">{children}</div>
    </main>
  );
}

function Prompt({ label, text, pos }: { label: string; text: string; pos?: string }) {
  const { t } = useI18n();
  return (
    <div className="grid gap-2 text-center">
      <p className="text-sm font-medium text-muted">{label}</p>
      <h2 dir="auto" className="font-display text-3xl font-extrabold leading-tight text-fg wrap-break-word sm:text-4xl">{text}</h2>
      {pos && <p className="text-sm text-faint">{posLabel(pos, t.words.pos)}</p>}
    </div>
  );
}

function SpeakButton({ word, voice }: { word: string; voice?: string }) {
  const { t } = useI18n();
  if (!isTTSSupported()) return null;
  return (
    <IconButton variant="soft" label={t.words.flashcards.speak} onClick={() => speak(word, voice)} className="justify-self-center">
      <Volume2 size={20} />
    </IconButton>
  );
}

// ── Знакомство с новым словом ──
export function IntroStep({ card, voice, onNext }: { card: CardData; voice?: string; onNext: () => void }) {
  const { t } = useI18n();
  const p = t.words.perigee;
  useEnter(true, onNext);
  return (
    <Shell>
      <div className="grid justify-items-center gap-3 text-center">
        <Badge tone="special">{p.newWord}</Badge>
        <h2 dir="auto" className="font-display text-4xl font-extrabold leading-tight text-fg wrap-break-word sm:text-5xl">{card.word}</h2>
        {card.partOfSpeech && <p className="text-sm text-faint">{posLabel(card.partOfSpeech, t.words.pos)}</p>}
        <SpeakButton word={card.word} voice={voice} />
        <p dir="auto" className="text-2xl font-semibold text-accent-ink">{card.translation}</p>
      </div>
      {(card.explanation || card.example) && (
        <Card tone="inset" padding="sm" className="grid gap-1 text-center">
          {card.explanation && <p dir="auto" className="text-sm text-fg">{card.explanation}</p>}
          {card.example && <p dir="auto" className="text-sm italic text-muted">{card.example}</p>}
        </Card>
      )}
      <Button size="lg" fullWidth iconRight={<ArrowRight size={18} />} onClick={onNext}>
        {p.gotIt}
      </Button>
    </Shell>
  );
}

// ── Выбор из четырёх: слово → перевод или перевод → слово ──
export function ChoiceStep({
  card,
  pool,
  reverse,
  onAnswer,
}: {
  card: CardData;
  pool: CardData[];
  reverse: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const { t } = useI18n();
  const p = t.words.perigee;
  const field = reverse ? "word" : "translation";
  const options = useMemo(() => makeChoicesFor(card, pool, field), [card, pool, field]);
  const correct = card[field];
  const [chosen, setChosen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const wrong = chosen !== null && chosen !== correct;
  const pick = (option: string) => {
    if (chosen !== null) return;
    setChosen(option);
    const right = option === correct;
    playSound(right ? "answer-correct" : "answer-wrong");
    if (right) timer.current = setTimeout(() => onAnswer(true), AUTO_NEXT_MS);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const i = ["Digit1", "Digit2", "Digit3", "Digit4"].indexOf(e.code);
      if (i !== -1 && options[i]) pick(options[i]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });
  useEnter(wrong, () => onAnswer(false));

  return (
    <Shell>
      <Prompt label={reverse ? p.pickWord : p.pickTranslation} text={reverse ? card.translation : card.word} pos={card.partOfSpeech} />
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option, i) => (
          <ChoiceButton key={`${option}-${i}`} label={option} hint={String(i + 1)} state={choiceState(option, chosen, correct)} onClick={() => pick(option)} />
        ))}
      </div>
      {wrong && (
        <Button size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={() => onAnswer(false)}>
          {p.continue}
        </Button>
      )}
    </Shell>
  );
}

// ── Ввод слова по переводу: мягкая проверка из src/utils/answerCheck.ts ──
export function TypeStep({
  card,
  others,
  voice,
  onAnswer,
}: {
  card: CardData;
  others: string[];
  voice?: string;
  onAnswer: (result: AnswerVerdict["result"]) => void;
}) {
  const { t } = useI18n();
  const p = t.words.perigee;
  const q = t.words.quiz;
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [overruled, setOverruled] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const result: AnswerVerdict["result"] | null = verdict ? (overruled ? "close" : verdict.result) : null;
  const check = (given: string) => {
    if (verdict) return;
    const v = given.trim() ? checkAnswer(given, card.word, others) : ({ result: "wrong" } as const);
    setVerdict(v);
    playSound(v.result === "wrong" ? "answer-wrong" : "answer-correct");
    if (v.result === "exact") timer.current = setTimeout(() => onAnswer("exact"), AUTO_NEXT_MS);
  };
  useEnter(!!verdict && verdict.result !== "exact", () => result && onAnswer(result));

  const close = verdict?.result === "close" ? verdict.reason : null;
  const right = result !== null && result !== "wrong";

  return (
    <Shell>
      <Prompt label={p.typeWord} text={card.translation} pos={card.partOfSpeech} />
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          check(text);
        }}
      >
        <Input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!!verdict}
          invalid={result === "wrong"}
          placeholder={q.placeholder}
          aria-label={q.placeholder}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
        />
        {!verdict && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" size="lg" onClick={() => check("")}>
              {p.dontRemember}
            </Button>
            <Button type="submit" size="lg" disabled={!text.trim()}>
              {q.check}
            </Button>
          </div>
        )}
      </form>

      {verdict && (
        <div className="grid gap-3">
          <div role="status" className={cx("flex items-start gap-3 rounded-2xl px-4 py-3", right ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>
            {right ? <Check size={20} className="mt-0.5 shrink-0" /> : <X size={20} className="mt-0.5 shrink-0" />}
            <div className="grid gap-0.5">
              <p className="font-semibold">{close && !overruled ? q.almost : right ? q.correct : q.incorrect}</p>
              {close && !overruled && <p className="text-sm text-fg">{q.closeReasons[close]}</p>}
              {verdict.result !== "exact" && (
                <p className="text-sm text-fg">
                  <span className="text-muted">{q.correctAnswer}</span> <strong className="font-semibold">{card.word}</strong>
                </p>
              )}
            </div>
          </div>
          {verdict.result !== "exact" && (
            <>
              {(card.explanation || card.example) && (
                <Card tone="inset" padding="sm" className="grid gap-1 text-left">
                  {card.explanation && <p dir="auto" className="text-sm text-muted">{card.explanation}</p>}
                  {card.example && <p dir="auto" className="text-sm italic text-muted">{card.example}</p>}
                </Card>
              )}
              <div className="flex flex-wrap justify-center gap-2">
                <SpeakButton word={card.word} voice={voice} />
                {verdict.result === "wrong" && text.trim() && !overruled && (
                  <Button variant="ghost" size="sm" iconLeft={<CheckCheck size={16} />} onClick={() => setOverruled(true)}>
                    {q.overrule}
                  </Button>
                )}
              </div>
              <Button size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={() => result && onAnswer(result)}>
                {p.continue}
              </Button>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

// ── Флэшкарта наоборот: перевод → вспомнить слово → оценить ──
export function FlashStep({ card, voice, onRate }: { card: CardData; voice?: string; onRate: (level: KnowledgeLevel) => void }) {
  const [flipped, setFlipped] = useState(false);
  const rated = useRef(false);
  const flip = (next = !flipped) => {
    if (next === flipped) return;
    playSound("card-flip");
    setFlipped(next);
  };
  const rate = (level: KnowledgeLevel) => {
    if (!flipped || rated.current) return;
    rated.current = true;
    playSound("card-next", { rate: RATING_PITCH[level] });
    onRate(level);
  };

  useEffect(() => {
    const keys: Record<string, KnowledgeLevel> = {
      Digit1: KnowledgeLevel.DONT_KNOW,
      Digit2: KnowledgeLevel.FORGOT,
      Digit3: KnowledgeLevel.REMEMBER,
      Digit4: KnowledgeLevel.KNOW,
    };
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (keys[e.code]) rate(keys[e.code]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <>
      <CardStage
        cardKey={card.id}
        card={card}
        language={voice}
        reverse
        flipped={flipped}
        onFlip={() => flip()}
        onSwipe={(dir) => rate(dir === "right" ? KnowledgeLevel.KNOW : KnowledgeLevel.DONT_KNOW)}
      />
      <RatingBar isFlipped={flipped} onFlip={() => flip(true)} onRate={rate} />
    </>
  );
}
