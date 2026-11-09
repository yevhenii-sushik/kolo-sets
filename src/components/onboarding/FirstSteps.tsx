import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ChevronRight, PartyPopper, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseName } from "../../courses/languages";
import { getFirstSteps, setFirstSteps } from "../../utils/firstRun";
import { Button, Card, Heading, IconButton, Text, cx } from "../../ui";
import { OrbitGoalModal } from "../progress/OrbitGoalModal";
import { SetGuide, TrainGuide, WordsGuide, WORDS_GOAL } from "./Guides";

type StepId = "language" | "set" | "words" | "train" | "goal";
type Guide = "set" | "words" | "train" | "goal";
const GUIDES: readonly Guide[] = ["set", "words", "train", "goal"];

interface Step {
  id: StepId;
  done: boolean;
  to?: string;
  onClick?: () => void;
  progress?: [number, number];
}

// «Первые шаги» новичка на главной: настоящие действия по порядку. Каждый пункт открывает свой сценарий
// (Guides.tsx) с подсказками и действием прямо в окне и отмечается сам, когда сделан.
// hidden — список не нужен (всё сделано раньше или его закрыли). /?guide=set — сразу открыть сценарий
export function useFirstSteps() {
  const { user } = useAuth();
  const { profile, collections, totalCards, activeCourse, coursesReady, progression } = useData();
  const uid = user?.uid ?? "";
  const [mark, setMark] = useState(() => (uid ? getFirstSteps(uid) : null));
  const [guide, setGuide] = useState<Guide | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const requested = searchParams.get("guide") as Guide | null;
    if (!requested || !GUIDES.includes(requested)) return;
    setGuide(requested);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  // Шаги «слова» и «тренировка» ведут в самый наполненный набор активного курса
  const main = collections.reduce<(typeof collections)[number] | undefined>((best, c) => (!best || c.cards.length > best.cards.length ? c : best), undefined);
  const studied = (profile?.studyHistory?.length ?? 0) > 0;

  // Шаг не по порядку ведёт в первый недостающий: без набора слова добавлять некуда, без слов — нечего учить
  const open = (g: Guide) => () => setGuide(!main && g !== "goal" ? "set" : g === "train" && main && main.cards.length === 0 ? "words" : g);

  const steps: Step[] = [
    { id: "language", done: !!activeCourse, to: "/courses" },
    { id: "set", done: collections.length > 0, onClick: open("set") },
    { id: "words", done: totalCards >= WORDS_GOAL, onClick: open("words"), progress: [Math.min(totalCards, WORDS_GOAL), WORDS_GOAL] },
    { id: "train", done: studied, onClick: open("train") },
    { id: "goal", done: !!progression?.orbit.goalSet, onClick: open("goal") },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  // Пока профиль, курсы и прогресс не загрузились, не решаем — иначе список мигнёт у тех, кому он не нужен
  const ready = !!uid && !!profile && coursesReady && !!progression;
  // Тем, кто уже занимается, а не выбрал только цель недели (её спросят отдельно), список не показываем
  const onlyGoalLeft = steps.every((s) => s.done || s.id === "goal");

  const mode: "hidden" | "checklist" | "complete" =
    !ready || mark === "done"
      ? "hidden"
      : allDone
        ? mark === "active"
          ? "complete"
          : "hidden"
        : mark === "active" || !onlyGoalLeft
          ? "checklist"
          : "hidden";

  useEffect(() => {
    if (mode === "checklist" && mark !== "active") {
      setFirstSteps(uid, "active");
      setMark("active");
    }
  }, [mode, mark, uid]);

  const close = () => {
    setFirstSteps(uid, "done");
    setMark("done");
  };

  return { mode, steps, doneCount, next: steps.find((s) => !s.done)?.id, close, guide, setGuide, mainId: main?.id, courseCode: activeCourse?.id };
}

type FirstStepsModel = ReturnType<typeof useFirstSteps>;

export function FirstSteps({ model }: { model: FirstStepsModel }) {
  const { t, language } = useI18n();
  const f = t.home.firstSteps;
  const locale = getLanguageInfo(language).htmlLang;
  const { mode, steps, doneCount, next, close, courseCode } = model;

  if (mode === "hidden") return null;

  if (mode === "complete") {
    return (
      <Card tone="inverse" padding="lg" className="grid justify-items-start gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent">
          <PartyPopper size={24} />
        </span>
        <Heading size={2} as="h2" tone="inverse">
          {f.doneTitle}
        </Heading>
        <Text tone="inverse">{f.doneText}</Text>
        <Button onClick={close} className="mt-1">
          {f.doneButton}
        </Button>
      </Card>
    );
  }

  const title = (id: StepId) =>
    id === "language" && courseCode ? f.steps.language.titleDone.replace("{lang}", courseName(courseCode, locale)) : f.steps[id].title;

  return (
    <Card padding="lg" className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <Heading size={2} as="h2">
            {f.title}
          </Heading>
          <Text size="sm" tone="muted">
            {f.subtitle}
          </Text>
        </div>
        <IconButton size="sm" label={f.hide} onClick={close}>
          <X size={18} />
        </IconButton>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-track">
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-muted">
          {f.progress.replace("{n}", String(doneCount)).replace("{total}", String(steps.length))}
        </span>
      </div>

      <ol className="grid gap-1">
        {steps.map((step, i) => {
          const isNext = step.id === next;
          const body = (
            <>
              <span
                aria-hidden
                className={cx(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums",
                  step.done ? "bg-success-soft text-success" : isNext ? "bg-accent text-on-accent" : "bg-inset text-muted",
                )}
              >
                {step.done ? <Check size={16} strokeWidth={3} /> : i + 1}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5 text-left">
                <span className={cx("font-semibold", step.done ? "text-muted" : "text-fg")}>
                  {title(step.id)}
                  {step.done && <span className="sr-only"> — {f.doneLabel}</span>}
                </span>
                {isNext && <span className="text-sm leading-snug text-muted">{f.steps[step.id].text}</span>}
              </span>
              {!step.done && step.progress && (
                <span className="shrink-0 text-sm font-semibold tabular-nums text-muted">
                  {step.progress[0]} / {step.progress[1]}
                </span>
              )}
              {!step.done && <ChevronRight aria-hidden size={18} className="shrink-0 text-faint" />}
            </>
          );
          const row = cx(
            "flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 py-2.5",
            isNext && "bg-accent-soft",
            !step.done && "transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-accent",
          );
          return (
            <li key={step.id}>
              {step.done ? (
                <div className={row}>{body}</div>
              ) : step.to ? (
                <Link to={step.to} className={row}>
                  {body}
                </Link>
              ) : (
                <button type="button" onClick={step.onClick} className={row}>
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// Окна сценариев — отдельно от списка: их можно открыть и когда список скрыт (из вступления — /?guide=set)
export function FirstStepsGuides({ model }: { model: FirstStepsModel }) {
  const { guide, setGuide, mainId } = model;
  const close = () => setGuide(null);
  return (
    <>
      <SetGuide open={guide === "set"} onClose={close} onNext={() => setGuide("words")} />
      <WordsGuide open={guide === "words"} onClose={close} onNext={() => setGuide("train")} collectionId={mainId} />
      <TrainGuide open={guide === "train"} onClose={close} collectionId={mainId} />
      <OrbitGoalModal open={guide === "goal"} onClose={close} />
    </>
  );
}
