import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Collection, KnowledgeLevel } from "../../types";
import { getCollection } from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { Shuffle, Undo2 } from "lucide-react";
import { IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import RatingBar from "../../components/session/RatingBar";
import CardStage from "../../components/session/CardStage";
import SessionLoadError from "../../components/session/SessionLoadError";
import SessionLoading from "../../components/session/SessionLoading";
import { useCardSession } from "../../components/session/useCardSession";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import { coachSeen, markCoachSeen } from "../../utils/firstRun";
import { hasRounds, readRoundPos, Round, roundAt, saveRoundPos } from "../../utils/flashRounds";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { profile, reportSession, voiceForCollection } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Большой набор — кругами по 20 по порядку (src/utils/flashRounds.ts); маленький — целиком
  const [round, setRound] = useState<Round | null>(null);

  // Прогресс, серию и достижения начисляет сервер; празднование — по его ответу
  const session = useCardSession((result) => {
    // Круг пройден — следующий начнётся с места, где остановились; весь набор пройден — с начала
    if (collection && round) saveRoundPos(collection.id, round.to >= collection.cards.length ? 0 : round.to);
    if (!user) return;
    reportSession({
      kind: "flashcards",
      collectionIds: result.collectionIds,
      cards: result.cards,
      allKnow: result.allKnow,
      durationSec: result.durationSec,
    });
  });

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
    if (fromStart) saveRoundPos(loaded.id, 0);
    const next = roundAt(loaded.cards.length, readRoundPos(loaded.id));
    const cards = loaded.cards.slice(next.from, next.to);

    setCollection(loaded);
    setRound(next);
    session.start(cards.map((card) => ({ card, collectionId: loaded.id })), [loaded]);
  };

  useEffect(() => {
    loadData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleShuffle = async () => {
    const ok = await confirm({
      title: t.words.flashcards.shuffle,
      message: t.words.flashcards.shuffleConfirm,
      type: "warning",
    });
    if (ok) session.shuffle();
  };

  if (loadError) return <SessionLoadError onRetry={() => loadData()} onExit={() => navigate(-1)} />;
  if (!collection || !session.current || !round) return <SessionLoading onExit={() => navigate(-1)} />;

  const total = collection.cards.length;
  const multi = hasRounds(total);
  const range = t.words.flashcards.range
    .replace("{from}", String(round.from + 1))
    .replace("{to}", String(round.to))
    .replace("{total}", String(total));

  return (
    <SessionShell
      perigee
      title={collection.name}
      subtitle={multi ? range : undefined}
      onClose={() => navigate(-1)}
      action={
        <>
          <IconButton label={t.words.flashcards.undo} onClick={session.undo} disabled={!session.canUndo}>
            <Undo2 size={20} />
          </IconButton>
          <IconButton label={t.words.flashcards.shuffle} onClick={handleShuffle}>
            <Shuffle size={20} />
          </IconButton>
        </>
      }
      progress={(session.index + 1) / session.items.length}
      meta={`${session.index + 1} / ${session.items.length}`}
    >
      <CardStage
        cardKey={`${session.index}:${session.current.card.id}`}
        card={session.current.card}
        language={voiceForCollection(collection)}
        flipped={session.flipped}
        exitTo={session.exitTo}
        onFlip={() => session.flip()}
        onSwipe={(dir) => session.rate(dir === "right" ? KnowledgeLevel.KNOW : KnowledgeLevel.DONT_KNOW)}
      />

      <RatingBar isFlipped={session.flipped} onFlip={() => session.flip(true)} onRate={session.rate} previews={session.previews} coach={!!coach} />

      <FlashcardStatsModal
        isOpen={session.finished}
        stats={session.stats}
        coach={!!coach}
        rounds={multi ? { done: round.to, total, next: round.to >= total ? 0 : roundAt(total, round.to).to - round.to } : undefined}
        onClose={() => navigate(-1)}
        onRestart={() => loadData()}
        onFromStart={() => loadData(true)}
      />

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </SessionShell>
  );
}
