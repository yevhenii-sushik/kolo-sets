import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Collection, KnowledgeLevel } from "../../types";
import { getCollections, isDueCard } from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { Undo2 } from "lucide-react";
import { IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import RatingBar from "../../components/session/RatingBar";
import CardStage from "../../components/session/CardStage";
import SessionLoadError from "../../components/session/SessionLoadError";
import { SessionItem, useCardSession } from "../../components/session/useCardSession";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import { courseCodeFromLanguage } from "../../courses/languages";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { reportSession, activeCourse, coursesReady, voiceForCollection } = useData();

  const [collections, setCollections] = useState<Map<string, Collection>>(new Map());
  const [loadError, setLoadError] = useState(false);

  const session = useCardSession((result) => {
    if (!user) return;
    reportSession({
      kind: "review",
      collectionIds: result.collectionIds,
      cards: result.cards,
      allKnow: result.allKnow,
      durationSec: result.durationSec,
    });
  });

  // Повторение — только карточки активного курса; набор старой версии без courseId относим к курсу по языку
  const loadData = async () => {
    if (!activeCourse) { navigate("/"); return; }
    setLoadError(false);
    let all: Collection[];
    try {
      all = (await getCollections()).filter(
        (c) => (c.courseId ?? courseCodeFromLanguage(c.language)) === activeCourse.id,
      );
    } catch (err) {
      console.error("Не удалось загрузить наборы", err);
      setLoadError(true);
      return;
    }

    const items: SessionItem[] = all.flatMap((col) =>
      col.cards.filter(isDueCard).map((card) => ({ card, collectionId: col.id })),
    );
    if (items.length === 0) { navigate("/"); return; }

    setCollections(new Map(all.map((c) => [c.id, c])));
    session.start(items, all);
  };

  // Ждём, пока станет известен активный курс; дальше не перезагружаем, чтобы не сбить сессию
  const startedRef = useRef(false);
  useEffect(() => {
    if (!coursesReady || startedRef.current) return;
    startedRef.current = true;
    loadData();
  }, [coursesReady]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loadError) return <SessionLoadError onRetry={loadData} onExit={() => navigate("/")} />;
  const current = session.current;
  if (!current) return null;
  const currentCollection = collections.get(current.collectionId);

  return (
    <SessionShell
      perigee
      title={t.words.session.review}
      subtitle={currentCollection?.name}
      onClose={() => navigate("/")}
      action={
        <IconButton label={t.words.flashcards.undo} onClick={session.undo} disabled={!session.canUndo}>
          <Undo2 size={20} />
        </IconButton>
      }
      progress={(session.index + 1) / session.items.length}
      meta={`${session.index + 1} / ${session.items.length}`}
    >
      <CardStage
        cardKey={`${session.index}:${current.card.id}`}
        card={current.card}
        language={currentCollection ? voiceForCollection(currentCollection) : undefined}
        flipped={session.flipped}
        onFlip={() => session.flip()}
        onSwipe={(dir) => session.rate(dir === "right" ? KnowledgeLevel.KNOW : KnowledgeLevel.DONT_KNOW)}
      />

      <RatingBar isFlipped={session.flipped} onFlip={() => session.flip(true)} onRate={session.rate} />

      <FlashcardStatsModal
        isOpen={session.finished}
        stats={session.stats}
        onClose={() => navigate("/")}
        onRestart={loadData}
      />
    </SessionShell>
  );
}
