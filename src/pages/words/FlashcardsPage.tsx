import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collection, KnowledgeLevel } from "../../types";
import { getCollection } from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { RotateCcw, SlidersHorizontal, Undo2 } from "lucide-react";
import { Badge, IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import RatingBar from "../../components/session/RatingBar";
import CardStage from "../../components/session/CardStage";
import SessionLoadError from "../../components/session/SessionLoadError";
import SessionLoading from "../../components/session/SessionLoading";
import { CarriedRating, SessionItem, useCardSession } from "../../components/session/useCardSession";
import FlashSettingsModal from "../../components/session/FlashSettingsModal";
import LeaveSessionDialog from "../../components/session/LeaveSessionDialog";
import { SWIPE, swipeLabels } from "../../components/session/ratingLabels";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import { coachSeen, markCoachSeen } from "../../utils/firstRun";
import { hasRounds, lastRoundResult, readRoundState, Round, RoundResult, roundAt, saveRoundResult, saveRoundState } from "../../utils/flashRounds";
import { FlashPrefs, pickReverse, readFlashPrefs, saveFlashPrefs } from "../../utils/flashPrefs";
import { memoryStrength } from "../../utils/srs";
import { hasVoiceFor, speakWord } from "../../utils/tts";
import { getSoundEnabled } from "../../utils/sounds";
import { shuffle } from "../../utils/gameUtils";

// Порядок набора — чтобы «По порядку» вернул оставшиеся карточки на свои места
const setOrder = (collection: Collection) => {
  const pos = new Map(collection.cards.map((card, i) => [card.id, i]));
  return (items: SessionItem[]) => [...items].sort((a, b) => (pos.get(a.card.id) ?? 0) - (pos.get(b.card.id) ?? 0));
};

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const f = t.words.flashcards;
  const { profile, reportSession, voiceForCollection } = useData();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Большой набор — кругами по 20 по порядку (src/utils/flashRounds.ts); маленький — целиком
  const [round, setRound] = useState<Round | null>(null);
  // Оценки этого круга, поставленные до перерыва: круг продолжили с места
  const carriedDone = useRef<Record<string, KnowledgeLevel>>({});
  // Направление, порядок, озвучка (src/utils/flashPrefs.ts) — помнятся на устройстве
  const [prefs, setPrefs] = useState<FlashPrefs>(readFlashPrefs);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  // Прошлый проход этого круга — итог сравнит, вспомнилось ли больше
  const [previous, setPrevious] = useState<RoundResult | undefined>();

  // Порядок и направление по настройкам: вперемешку — случайно, в обе стороны — сторона на каждое слово
  const arrange = (items: SessionItem[], p: FlashPrefs = prefs) =>
    (p.shuffle ? shuffle(items) : items).map((item) => ({ ...item, reverse: pickReverse(p.direction) }));

  // Прогресс, серию и достижения начисляет сервер; празднование — по его ответу
  const session = useCardSession((result) => {
    // Круг пройден — следующий начнётся с места, где остановились; весь набор пройден — с начала.
    // Закрепление трудных круг не двигает: он уже засчитан
    if (collection && round && !result.practice) {
      saveRoundState(collection.id, { pos: round.to >= collection.cards.length ? 0 : round.to, done: {} });
      setPrevious(lastRoundResult(collection.id, round));
      saveRoundResult(collection.id, round, { passed: result.passed, total: result.total });
    }
    if (!user) return;
    reportSession({
      kind: "flashcards",
      collectionIds: result.collectionIds,
      cards: result.cards,
      durationSec: result.durationSec,
      ...(result.practice ? { practice: true } : {}),
    });
  });

  // Посреди круга помним каждую оценку: ушёл — вернёшься к оставшимся карточкам этого же круга.
  // Конец круга сохраняет onFinish выше (раньше этого эффекта), поэтому законченный круг не трогаем
  useEffect(() => {
    if (!collection || !round || session.finished || session.practice) return;
    const done = { ...carriedDone.current };
    for (const r of session.firsts) done[r.cardId] = r.level;
    saveRoundState(collection.id, { pos: round.from, done });
  }, [session.firsts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Озвучка при перевороте: слово звучит, когда открываешь ответ — звук и написание запоминаются вместе.
  // Только с голосом языка набора и если звук не выключен: чужой голос учит неправильному произношению
  const voice = collection ? voiceForCollection(collection) : undefined;
  const voiceState = !getSoundEnabled() ? "soundOff" : !hasVoiceFor(voice) ? "noVoice" : "ok";
  useEffect(() => {
    if (session.flipped && session.currentCard && prefs.speak && getSoundEnabled() && hasVoiceFor(voice)) speakWord(session.currentCard.word, voice);
  }, [session.flipped, session.index]); // eslint-disable-line react-hooks/exhaustive-deps

  // Настройки меняют только то, что впереди: круг заново не начинается, оценки не теряются
  const changePrefs = (next: FlashPrefs) => {
    saveFlashPrefs(next);
    const reorder = next.shuffle !== prefs.shuffle && collection ? (next.shuffle ? shuffle : setOrder(collection)) : undefined;
    const map = next.direction !== prefs.direction ? (item: SessionItem) => ({ ...item, reverse: pickReverse(next.direction) }) : undefined;
    setPrefs(next);
    if ((reorder || map) && !session.finished) session.updateRest({ reorder, map });
  };

  // Первая тренировка новичка: подсказки, как вспоминать и оценивать, и что будет дальше. Решаем один раз,
  // когда профиль загружен: после тренировки в нём появится история, а подсказка в итоге должна остаться
  const [coach, setCoach] = useState<boolean | null>(null);
  useEffect(() => {
    if (coach === null && profile) setCoach(!coachSeen("flashcards") && !(profile.studyHistory?.length > 0));
  }, [coach, profile]);
  // Прошёл до конца — больше не подсказываем; ушёл с середины — подскажем в следующий раз
  useEffect(() => {
    if (coach && session.finished) markCoachSeen("flashcards");
  }, [coach, session.finished]);

  const loadData = async (fromStart = false) => {
    if (!id) return;
    setLoadError(false);
    let loaded: Collection | undefined;
    try {
      loaded = await getCollection(id);
    } catch (err) {
      console.error("Не удалось загрузить набор", err);
      setLoadError(true);
      return;
    }
    if (!loaded) { navigate("/"); return; }

    // Слова на сегодня — в сессии Perigee по набору (/learn?set=…); здесь — весь набор, кругами
    if (loaded.cards.length === 0) { navigate(-1); return; }
    const state = fromStart ? { pos: 0, done: {} } : readRoundState(loaded.id);
    const next = roundAt(loaded.cards.length, state.pos);
    const roundCards = loaded.cards.slice(next.from, next.to);

    // Круг брошен посередине — показываем только оставшиеся карточки, а оценки до перерыва войдут в итог.
    // Позиция сдвинулась (из набора удалили слова) или оценено всё (итог не успел сохраниться) — круг заново
    const done: Record<string, KnowledgeLevel> = next.from === state.pos ? state.done : {};
    let rest = roundCards.filter((card) => !done[card.id]);
    let carried: CarriedRating[] = roundCards.filter((card) => done[card.id]).map((card) => ({ card, collectionId: loaded.id, level: done[card.id] }));
    if (rest.length === 0) {
      rest = roundCards;
      carried = [];
    }
    carriedDone.current = Object.fromEntries(carried.map((c) => [c.card.id, c.level]));

    setCollection(loaded);
    setRound(next);
    setPrevious(undefined);
    session.start(arrange(rest.map((card) => ({ card, collectionId: loaded.id }))), [loaded], { carried });
  };

  useEffect(() => {
    loadData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Начал круг — перед выходом спросим: брошенный круг не засчитывается. Закрепление трудных — по желанию,
  // круг уже засчитан, держать в нём незачем
  const exit = () => navigate(-1);
  const requestExit = () => (session.canUndo && !session.practice ? setConfirmLeave(true) : exit());

  if (loadError) return <SessionLoadError onRetry={() => loadData()} onExit={() => navigate(-1)} />;
  if (!collection || !session.current || !session.currentCard || !round) return <SessionLoading onExit={() => navigate(-1)} />;

  const total = collection.cards.length;
  const multi = hasRounds(total);
  const range = f.range
    .replace("{from}", String(round.from + 1))
    .replace("{to}", String(round.to))
    .replace("{total}", String(total));

  return (
    <SessionShell
      perigee={!session.practice}
      title={collection.name}
      subtitle={session.practice ? f.practiceTitle : multi ? range : undefined}
      onClose={requestExit}
      action={
        <>
          <IconButton label={f.undo} onClick={session.undo} disabled={!session.canUndo}>
            <Undo2 size={20} />
          </IconButton>
          <IconButton label={f.settings.title} onClick={() => setShowSettings(true)}>
            <SlidersHorizontal size={20} />
          </IconButton>
        </>
      }
      progress={session.progress}
      meta={
        <>
          {/* Карточка вернулась после «Не знаю»: слов от этого не прибавилось */}
          {session.current.retry && (
            <Badge>
              <RotateCcw size={12} />
              {f.retryBadge}
            </Badge>
          )}
          <span>
            {session.position} / {session.total}
          </span>
        </>
      }
    >
      <CardStage
        cardKey={`${session.index}:${session.current.card.id}:${session.current.reverse ? "r" : "f"}`}
        card={session.currentCard}
        language={voice}
        reverse={!!session.current.reverse}
        strength={memoryStrength(session.currentCard)}
        deck={session.items.length - session.index - 1}
        next={session.nextItem && session.nextCard ? { card: session.nextCard, reverse: !!session.nextItem.reverse, strength: memoryStrength(session.nextCard) } : undefined}
        flipped={session.flipped}
        exitTo={session.exitTo}
        enterFrom={session.enterFrom}
        onFlip={() => session.flip()}
        onSwipe={(dir) => session.rate(SWIPE[dir])}
        swipe={swipeLabels(f, session.previews)}
      />

      <RatingBar isFlipped={session.flipped} onFlip={() => session.flip(true)} onRate={session.rate} previews={session.previews} coach={!!coach} />

      <FlashcardStatsModal
        isOpen={session.finished}
        stats={session.stats}
        hard={session.hard.map((item) => item.card)}
        coach={!!coach}
        rounds={multi ? { done: round.to, total, next: round.to >= total ? 0 : roundAt(total, round.to).to - round.to, first: round.from === 0 } : undefined}
        onClose={() => navigate(-1)}
        onAgain={() => loadData()}
        onPractise={() => session.practise(arrange(session.hard))}
        onFromStart={() => loadData(true)}
        growth={session.practice ? undefined : session.growth}
        previous={session.practice ? undefined : previous}
      />

      <LeaveSessionDialog
        open={confirmLeave && !session.finished}
        done={session.stats.dontKnow + session.stats.forgot + session.stats.remember + session.stats.know}
        total={session.stats.totalCards}
        onStay={() => setConfirmLeave(false)}
        onLeave={exit}
      />

      <FlashSettingsModal open={showSettings} onClose={() => setShowSettings(false)} prefs={prefs} onChange={changePrefs} voice={voiceState} />
    </SessionShell>
  );
}
