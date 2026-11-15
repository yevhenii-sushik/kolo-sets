import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Card, Collection } from "../../types";
import { getCollections } from "../../utils/storage";
import { AnswerOutcome } from "../../utils/srs";
import { canMakeChoices } from "../../utils/gameUtils";
import { plural } from "../../utils/plural";
import { getSoundEnabled, playSound } from "../../utils/sounds";
import { hasVoiceFor, isTTSSupported } from "../../utils/tts";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { courseCodeFromLanguage } from "../../courses/languages";
import { PerigeeMark } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import LeaveSessionDialog from "../../components/session/LeaveSessionDialog";
import SessionResult from "../../components/session/SessionResult";
import SessionLoadError from "../../components/session/SessionLoadError";
import SessionLoading from "../../components/session/SessionLoading";
import { withVariant } from "../../utils/answerCheck";
import { useSrsWriter } from "../../components/session/useSrsWriter";
import AnswerSheet, { SHEET_MAX } from "../../components/session/AnswerSheet";
import { ChoiceStep, ClozeStep, FlashStep, IntroStep, ListenStep, TypeStep } from "../../components/perigee/Steps";
import { answer, dueTomorrow, isFinished, pickCards, SessionState, SessionSummary, startSession, summarize, answerSheet } from "../../perigee/plan";
import { readDailyNew } from "../../perigee/prefs";

// Сессия Perigee — главная тренировка: до 20 слов из всех наборов курса, формат по силе памяти,
// ошибки возвращаются в той же сессии (docs/specs/perigee.md). Логика — в src/perigee/plan.ts.
// ?set=<id> — та же сессия по одному набору (кнопка «Учить» в наборе)
interface Outcome {
  summary: SessionSummary;
  tomorrow: number;
  next: "again" | "extra" | "sets";
}

export default function PerigeeSessionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const p = t.words.perigee;
  const { reportSession, activeCourse, coursesReady, voiceForCollection } = useData();
  const writer = useSrsWriter();
  const setId = params.get("set") ?? undefined;
  const leave = () => (setId ? navigate(-1) : navigate("/"));

  const [state, setState] = useState<SessionState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [round, setRound] = useState(0); // номер сессии на странице — ключи шагов не совпадут со «Ещё сессией»
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [pool, setPool] = useState<Card[]>([]);
  const [collections, setCollections] = useState<Map<string, Collection>>(new Map());
  // Ответ читает актуальное состояние из ref: шаги зовут onAnswer из таймера, а запись в расписание
  // не должна выполняться дважды (апдейтер setState в StrictMode вызывается два раза)
  const stateRef = useRef<SessionState | null>(null);
  const startedAt = useRef(Date.now());

  const begin = (all: Collection[], extra: boolean) => {
    // Темп новых слов — выбор человека (5 / 12 / 20 в день)
    let cards = pickCards(all, new Date(), extra, setId, readDailyNew());
    // В набор пришли сознательно: если новые слова не влезают в дневной лимит — берём их сверх лимита
    if (cards.length === 0 && setId && !extra) cards = pickCards(all, new Date(), true, setId);
    if (cards.length === 0) {
      leave();
      return;
    }
    writer.load(all);
    const everyCard = all.flatMap((c) => c.cards);
    setPool(everyCard);
    setCollections(new Map(all.map((c) => [c.id, c])));
    const byId = new Map(all.map((c) => [c.id, c]));
    // Аудирование — только если звук не выключен и у браузера есть голос языка курса
    const canListen = (pc: { collectionId: string }) => {
      const col = byId.get(pc.collectionId);
      return getSoundEnabled() && !!col && hasVoiceFor(voiceForCollection(col));
    };
    const fresh = startSession(cards, Math.random, {
      canChoose: canMakeChoices(everyCard, "translation") && canMakeChoices(everyCard, "word"),
      canListen,
    });
    stateRef.current = fresh;
    setState(fresh);
    setOutcome(null);
    setRound((r) => r + 1);
    startedAt.current = Date.now();
  };

  // Наборы одного курса: активного или того, к которому относится набор из «Учить». Набор старой
  // версии без courseId относим к курсу по языку
  const load = async () => {
    setLoadError(false);
    try {
      const every = await getCollections();
      const courseOf = (c: Collection) => c.courseId ?? courseCodeFromLanguage(c.language);
      const set = setId ? every.find((c) => c.id === setId) : undefined;
      const course = set ? courseOf(set) : setId ? undefined : activeCourse?.id;
      if (!course) {
        navigate(setId ? "/words" : "/");
        return;
      }
      begin(every.filter((c) => courseOf(c) === course), params.get("extra") === "1");
    } catch (err) {
      console.error("Не удалось загрузить наборы", err);
      setLoadError(true);
    }
  };

  // Голоса браузер грузит не сразу — просим список заранее, к началу сессии он будет готов
  useEffect(() => {
    if (isTTSSupported()) window.speechSynthesis.getVoices();
  }, []);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!coursesReady || startedRef.current) return;
    startedRef.current = true;
    load();
  }, [coursesReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (s: SessionState) => {
    writer.commit();
    playSound("session-complete");
    const summary = summarize(s);
    const latest = writer.collections();
    const now = new Date();
    const scope = latest.filter((c) => !setId || c.id === setId);
    const hasNew = scope.some((c) => c.cards.some((card) => !card.srsData || card.srsData.interval === 0));
    setOutcome({
      summary,
      tomorrow: dueTomorrow(scope, now),
      next: pickCards(latest, now, false, setId, readDailyNew()).length > 0 ? "again" : hasNew ? "extra" : "sets",
    });
    if (!user) return;
    reportSession({
      kind: "perigee",
      collectionIds: [...new Set(Object.values(s.cards).map((c) => c.collectionId))],
      cards: summary.cards,
      correct: summary.correctFirst,
      allKnow: summary.correctFirst === summary.cards,
      durationSec: Math.max(1, Math.floor((Date.now() - startedAt.current) / 1000)),
    });
  };

  const onAnswer = (result: AnswerOutcome | null) => {
    const current = stateRef.current;
    if (!current || isFinished(current)) return;
    const { state: next, effect } = answer(current, result);
    if (effect) writer.record(effect.collectionId, effect.cardId, effect.level);
    stateRef.current = next;
    setState(next);
    if (isFinished(next)) finish(next);
  };

  // «Добавить в карточку» после неверного ввода: ответ остаётся ошибкой, а вариант дописывается в слово
  // карточки (в расписании Perigee карточка та же) — со следующего раза проверка примет его сама
  const addVariant = (key: string, answer: string) => {
    const current = stateRef.current;
    const pc = current?.cards[key];
    if (!current || !pc) return;
    const latest = writer.card(pc.collectionId, pc.card.id) ?? pc.card;
    const word = withVariant(latest.word, answer);
    writer.restore(pc.collectionId, { ...latest, word });
    const next = { ...current, cards: { ...current.cards, [key]: { ...pc, card: { ...pc.card, word } } } };
    stateRef.current = next;
    setState(next);
    setPool((prev) => prev.map((c) => (c.id === pc.card.id ? { ...c, word } : c)));
  };

  const others = useMemo(() => pool.map((c) => c.word), [pool]);

  if (loadError) return <SessionLoadError onRetry={load} onExit={leave} />;
  if (!state) return <SessionLoading onExit={leave} />;

  const step = state.queue[Math.min(state.pos, state.queue.length - 1)];
  const item = state.cards[step.key];
  const collection = collections.get(item.collectionId);
  const voice = collection ? voiceForCollection(collection) : undefined;
  const total = Object.keys(state.cards).length;
  const done = Object.values(state.progress).filter((x) => x.done).length;
  const locale = getLanguageInfo(language).htmlLang;
  // Начал сессию — перед выходом спросим: брошенная сессия не засчитывается (LeaveSessionDialog)
  const requestExit = () => (state.pos > 0 && !outcome ? setConfirmLeave(true) : leave());
  const accuracy = outcome && outcome.summary.cards > 0 ? Math.round((outcome.summary.correctFirst / outcome.summary.cards) * 100) : 0;

  const again = {
    again: { label: p.result.again, run: () => begin(writer.collections(), false) },
    extra: { label: p.result.extra, run: () => begin(writer.collections(), true) },
    sets: { label: p.result.toSets, run: () => navigate("/words") },
  }[outcome?.next ?? "sets"];

  return (
    <SessionShell
      title={p.title}
      subtitle={collection?.name}
      onClose={requestExit}
      progress={state.pos / state.queue.length}
      // Лист ответов, как в тесте и флэшкартах: клетка на слово, зелёная — верно с первого раза
      bar={
        total <= SHEET_MAX ? (
          <AnswerSheet marks={answerSheet(state).map((right) => (right ? "success" : "danger"))} total={total} current={done} label={`${done} / ${total}`} />
        ) : undefined
      }
      meta={`${done} / ${total}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${round}:${step.id}`}
          className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.16 }}
        >
          {step.kind === "intro" && <IntroStep card={item.card} voice={voice} onNext={() => onAnswer(null)} />}
          {step.kind === "choice" && (
            <ChoiceStep card={item.card} pool={pool} reverse={step.reverse} onAnswer={(correct) => onAnswer({ kind: "choice", correct })} />
          )}
          {step.kind === "type" && (
            <TypeStep
              card={item.card}
              others={others}
              voice={voice}
              onAnswer={(result) => onAnswer({ kind: "type", result })}
              onAddVariant={(answer) => addVariant(step.key, answer)}
            />
          )}
          {step.kind === "flash" && (
            <FlashStep card={item.card} voice={voice} graded={step.graded} onRate={(level) => onAnswer({ kind: "self", level })} />
          )}
          {step.kind === "cloze" && <ClozeStep card={item.card} pool={pool} onAnswer={(correct) => onAnswer({ kind: "choice", correct })} />}
          {step.kind === "listen" && (
            <ListenStep card={item.card} pool={pool} voice={voice} onAnswer={(correct) => onAnswer({ kind: "choice", correct })} />
          )}
        </motion.div>
      </AnimatePresence>

      <SessionResult
        open={!!outcome}
        icon={<PerigeeMark size={26} tone="mono" />}
        title={p.result.title}
        subtitle={outcome && (outcome.tomorrow > 0 ? plural(locale, outcome.tomorrow, p.result.tomorrow) : p.result.tomorrowNone)}
        metrics={[
          { label: p.result.reviewed, value: outcome?.summary.reviewed ?? 0 },
          { label: p.result.learned, value: outcome?.summary.learned ?? 0, tone: "accent" },
          { label: p.result.accuracy, value: `${accuracy}%`, tone: "success" },
        ]}
        againLabel={again.label}
        exitLabel={t.words.session.exit}
        onAgain={again.run}
        onExit={leave}
      />

      <LeaveSessionDialog open={confirmLeave && !outcome} done={done} total={total} onStay={() => setConfirmLeave(false)} onLeave={leave} />
    </SessionShell>
  );
}
