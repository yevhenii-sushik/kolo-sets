import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, Plus, Volume2, X } from "lucide-react";
import { Card as CardData, KnowledgeLevel } from "../../types";
import { Button, Card, IconButton, Input, cx } from "../../ui";
import { useI18n } from "../../contexts/I18nContext";
import { posLabel } from "../../data/partsOfSpeech";
import { isTTSSupported, speakWord } from "../../utils/tts";
import { playSound, RATING_PITCH, semitones } from "../../utils/sounds";
import { previewIntervals, Strength } from "../../utils/srs";
import { streakPitch } from "../../quiz/plan";
import { makeChoicesFor } from "../../utils/gameUtils";
import { blankExample } from "../../perigee/cloze";
import { AnswerVerdict, canAddVariant, checkAnswer } from "../../utils/answerCheck";
import ChoiceButton, { choiceState } from "../session/ChoiceButton";
import CardStage from "../session/CardStage";
import RatingBar from "../session/RatingBar";
import { SWIPE, swipeLabels } from "../session/ratingLabels";
import AnswerDiff from "../session/AnswerDiff";
import QuestionCard, { ListenButton, QuestionPrompt, QuestionTag, StreakChip } from "../session/QuestionCard";

// Шаги сессии Perigee (docs/specs/perigee.md): знакомство, выбор, ввод, пропуск в примере, аудирование,
// флэшкарта наоборот. Каждый шаг сам показывает разбор и зовёт onAnswer один раз — когда пользователь готов
// идти дальше. Вид — как в тесте и Блице (docs/specs/perigee.md, «Perigee: понятность и честность»):
// карточка вопроса с силой слова и серией, ответы — под большим пальцем

const AUTO_NEXT_MS = 650; // верный ответ — короткая пауза, чтобы увидеть зелёный, и дальше

/** Общее для шагов: сила слова, серия до этого шага, набор слова и подсказка первой сессии */
export interface StepMeta {
  strength?: Strength;
  streak: number; // верных подряд до этого шага
  setName?: string; // набор слова — когда в сессии слова из нескольких наборов
  coach?: string; // подсказка первой сессии: как она устроена
}

// Звук «верно» поднимается вместе с серией — как в тесте
const rightSound = (meta: StepMeta) => playSound("answer-correct", { rate: semitones(streakPitch(meta.streak + 1)) });

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

// На телефоне карточка занимает свободное место, ответы — внизу; на широком экране всё по центру
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pb-6 pt-3 sm:px-6 sm:py-6">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 sm:my-auto sm:flex-none">{children}</div>
    </main>
  );
}

// Карточка вопроса шага: что сделать, сила слова, серия с трёх, набор слова
function StepCard({ label, meta, children }: { label: React.ReactNode; meta: StepMeta; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <QuestionCard
      label={label}
      strength={meta.strength}
      badge={meta.streak >= 3 ? <StreakChip value={meta.streak}>{t.words.quiz.streak.replace("{n}", String(meta.streak))}</StreakChip> : undefined}
      note={meta.setName}
    >
      {children}
    </QuestionCard>
  );
}

function Coach({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <div className="flex gap-2.5 rounded-2xl bg-inset p-3 text-left text-sm text-muted">
      <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent-ink" />
      <p className="leading-snug">{text}</p>
    </div>
  );
}

function SpeakButton({ word, voice }: { word: string; voice?: string }) {
  const { t } = useI18n();
  if (!isTTSSupported()) return null;
  return (
    <IconButton variant="soft" label={t.words.flashcards.speak} onClick={() => speakWord(word, voice)} className="relative justify-self-center">
      <Volume2 size={20} />
    </IconButton>
  );
}

const PosTag = ({ pos }: { pos?: string }) => {
  const { t } = useI18n();
  return pos ? <QuestionTag>{posLabel(pos, t.words.pos)}</QuestionTag> : null;
};

// ── Знакомство с новым словом: тёплая карточка, как лицо флэшкарты ──
export function IntroStep({ card, voice, meta, onNext }: { card: CardData; voice?: string; meta: StepMeta; onNext: () => void }) {
  const { t } = useI18n();
  const p = t.words.perigee;
  useEnter(true, onNext);
  return (
    <Shell>
      <StepCard label={p.newWord} meta={{ ...meta, strength: undefined }}>
        <QuestionPrompt>{card.word}</QuestionPrompt>
        <PosTag pos={card.partOfSpeech} />
        <SpeakButton word={card.word} voice={voice} />
        <p dir="auto" className="relative text-2xl font-semibold text-accent-ink">
          {card.translation}
        </p>
      </StepCard>
      {(card.explanation || card.example) && (
        <Card tone="inset" padding="sm" className="grid gap-1 text-center">
          {card.explanation && <p dir="auto" className="text-sm text-fg">{card.explanation}</p>}
          {card.example && <p dir="auto" className="text-sm italic text-muted">{card.example}</p>}
        </Card>
      )}
      <Coach text={meta.coach} />
      <Button size="lg" fullWidth iconRight={<ArrowRight size={18} />} onClick={onNext}>
        {p.gotIt}
      </Button>
    </Shell>
  );
}

// ── Выбор из четырёх: общая основа для выбора, пропуска в примере и аудирования ──
function ChoiceBase({
  card,
  pool,
  field,
  label,
  meta,
  prompt,
  reveal,
  onAnswer,
}: {
  card: CardData;
  pool: CardData[];
  field: "word" | "translation";
  label: string;
  meta: StepMeta;
  prompt: (answered: boolean, right: boolean) => React.ReactNode;
  reveal?: React.ReactNode; // что показать после ответа под вариантами
  onAnswer: (correct: boolean) => void;
}) {
  const { t } = useI18n();
  const p = t.words.perigee;
  const options = useMemo(() => makeChoicesFor(card, pool, field), [card, pool, field]);
  const correct = card[field];
  const [chosen, setChosen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const wrong = chosen !== null && chosen !== correct;
  // "" — «Не знаю»: честная ошибка вместо угадывания (удачная догадка записалась бы как «Помню»)
  const pick = (option: string) => {
    if (chosen !== null) return;
    setChosen(option);
    const right = option === correct;
    if (right) rightSound(meta);
    else playSound("answer-wrong");
    if (right) timer.current = setTimeout(() => onAnswer(true), reveal ? AUTO_NEXT_MS * 2 : AUTO_NEXT_MS);
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
      <StepCard label={label} meta={meta}>
        {prompt(chosen !== null, chosen === correct)}
      </StepCard>
      {chosen === null && <Coach text={meta.coach} />}
      <div className="grid gap-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((option, i) => (
            <ChoiceButton key={`${option}-${i}`} label={option} hint={String(i + 1)} state={choiceState(option, chosen, correct)} onClick={() => pick(option)} />
          ))}
        </div>
        {chosen === null && (
          <Button variant="ghost" size="sm" onClick={() => pick("")} className="justify-self-center">
            {t.words.quiz.dontKnow}
          </Button>
        )}
        {chosen !== null && reveal}
        {wrong && (
          <Button size="lg" variant="inverse" fullWidth iconRight={<ArrowRight size={18} />} onClick={() => onAnswer(false)}>
            {p.continue}
          </Button>
        )}
      </div>
    </Shell>
  );
}

// Слово → выбрать перевод (forward) или перевод → выбрать слово (reverse)
export function ChoiceStep({ card, pool, reverse, meta, onAnswer }: { card: CardData; pool: CardData[]; reverse: boolean; meta: StepMeta; onAnswer: (correct: boolean) => void }) {
  const { t } = useI18n();
  const p = t.words.perigee;
  return (
    <ChoiceBase
      card={card}
      pool={pool}
      field={reverse ? "word" : "translation"}
      label={reverse ? p.pickWord : p.pickTranslation}
      meta={meta}
      prompt={() => (
        <>
          <QuestionPrompt>{reverse ? card.translation : card.word}</QuestionPrompt>
          <PosTag pos={card.partOfSpeech} />
        </>
      )}
      onAnswer={onAnswer}
    />
  );
}

// Пропуск в примере: какое слово пропущено (src/perigee/cloze.ts)
export function ClozeStep({ card, pool, meta, onAnswer }: { card: CardData; pool: CardData[]; meta: StepMeta; onAnswer: (correct: boolean) => void }) {
  const { t } = useI18n();
  const blank = useMemo(() => blankExample(card), [card]);
  if (!blank) return <ChoiceStep card={card} pool={pool} reverse meta={meta} onAnswer={onAnswer} />;
  return (
    <ChoiceBase
      card={card}
      pool={pool}
      field="word"
      label={t.words.perigee.fillGap}
      meta={meta}
      prompt={(answered, right) => (
        <p dir="auto" className="relative text-2xl font-semibold leading-snug text-fg sm:text-3xl">
          {blank.before}
          {answered ? (
            <span className={cx("rounded-md px-1", right ? "bg-success-soft text-success" : "bg-danger-soft text-danger")}>{blank.answer}</span>
          ) : (
            <span className="mx-1 inline-block min-w-16 border-b-2 border-accent align-baseline">&nbsp;</span>
          )}
          {blank.after}
        </p>
      )}
      reveal={<p className="text-center text-sm text-muted">{card.word} — <span className="text-accent-ink">{card.translation}</span></p>}
      onAnswer={onAnswer}
    />
  );
}

// Аудирование: слово звучит само (и по кнопке), выбрать перевод; после ответа на карточке видно, что прозвучало
export function ListenStep({ card, pool, voice, meta, onAnswer }: { card: CardData; pool: CardData[]; voice?: string; meta: StepMeta; onAnswer: (correct: boolean) => void }) {
  const { t } = useI18n();
  const p = t.words.perigee;
  useEffect(() => {
    speakWord(card.word, voice);
  }, [card.word, voice]);
  return (
    <ChoiceBase
      card={card}
      pool={pool}
      field="translation"
      label={p.listen}
      meta={meta}
      prompt={(answered) => (answered ? <QuestionPrompt>{card.word}</QuestionPrompt> : <ListenButton label={p.listenAgain} onClick={() => speakWord(card.word, voice)} />)}
      onAnswer={onAnswer}
    />
  );
}

// ── Ввод слова по переводу: мягкая проверка из src/utils/answerCheck.ts ──
// Вместо «Мой ответ верный» — «Добавить в карточку»: ответ остаётся ошибкой (засчитать «на слово» значило
// открыть +1 опыта и «Знаю всё!» одним нажатием), а вариант дописывается в карточку и со следующего раза
// принимается сам (docs/specs/perigee.md, «Тест: честный ответ и карточка вопроса»)
export function TypeStep({
  card,
  others,
  voice,
  meta,
  onAnswer,
  onAddVariant,
}: {
  card: CardData;
  others: string[];
  voice?: string;
  meta: StepMeta;
  onAnswer: (result: AnswerVerdict["result"]) => void;
  onAddVariant?: (answer: string) => void;
}) {
  const { t } = useI18n();
  const p = t.words.perigee;
  const q = t.words.quiz;
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<AnswerVerdict | null>(null);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const result: AnswerVerdict["result"] | null = verdict ? verdict.result : null;
  const check = (given: string) => {
    if (verdict) return;
    const v = given.trim() ? checkAnswer(given, card.word, others) : ({ result: "wrong" } as const);
    setVerdict(v);
    if (v.result === "wrong") playSound("answer-wrong");
    else rightSound(meta);
    if (v.result === "exact") timer.current = setTimeout(() => onAnswer("exact"), AUTO_NEXT_MS);
  };
  useEnter(!!verdict && verdict.result !== "exact", () => result && onAnswer(result));

  const close = verdict?.result === "close" ? verdict.reason : null;
  const right = result !== null && result !== "wrong";
  // Побуквенный разбор — для «почти» и небольшого промаха: видно, где именно опечатка
  const diffTarget = verdict && verdict.result !== "exact" && text.trim() ? verdict.expected : undefined;

  return (
    <Shell>
      <StepCard label={p.typeWord} meta={meta}>
        <QuestionPrompt>{card.translation}</QuestionPrompt>
        <PosTag pos={card.partOfSpeech} />
      </StepCard>
      {!verdict && <Coach text={meta.coach} />}
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
              <p className="font-semibold">{close ? q.almost : right ? q.correct : q.incorrect}</p>
              {close && <p className="text-sm text-fg">{q.closeReasons[close]}</p>}
              {diffTarget ? (
                <AnswerDiff typed={text} expected={diffTarget} />
              ) : (
                verdict.result !== "exact" && (
                  <p className="text-sm text-fg">
                    <span className="text-muted">{q.correctAnswer}</span> <strong className="font-semibold">{card.word}</strong>
                  </p>
                )
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
                {onAddVariant && canAddVariant(text, verdict, others) && !added && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconLeft={<Plus size={16} />}
                    onClick={() => {
                      onAddVariant(text.trim());
                      setAdded(true);
                    }}
                  >
                    {q.addVariant.replace("{answer}", text.trim())}
                  </Button>
                )}
              </div>
              {added ? (
                <p role="status" className="text-center text-sm text-success">
                  {q.variantAdded.replace("{answer}", text.trim())}
                </p>
              ) : (
                onAddVariant && canAddVariant(text, verdict, others) && <p className="-mt-1 text-center text-xs text-faint">{q.addVariantHint}</p>
              )}
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
export function FlashStep({ card, voice, graded = true, onRate }: { card: CardData; voice?: string; graded?: boolean; onRate: (level: KnowledgeLevel) => void }) {
  const { t } = useI18n();
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

  // Интервалы на кнопках и в подписи свайпа — только когда оценка пойдёт в расписание, а не на повторе после ошибки
  const previews = flipped && graded ? { ...previewIntervals(card), [KnowledgeLevel.DONT_KNOW]: 0 } : undefined;

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
        onSwipe={(dir) => rate(SWIPE[dir])}
        swipe={swipeLabels(t.words.flashcards, previews)}
      />
      <RatingBar isFlipped={flipped} onFlip={() => flip(true)} onRate={rate} previews={previews} />
    </>
  );
}
