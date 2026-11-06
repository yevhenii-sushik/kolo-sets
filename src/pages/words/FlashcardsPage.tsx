import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Collection, Card, KnowledgeLevel, FlashcardStats } from "../../types";
import {
  getCollection,
  updateCollection,
  updateSRSData,
  isDueCard,
} from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { playSessionCompleteIfEnabled } from "../../utils/sounds";
import { Shuffle } from "lucide-react";
import { Badge, IconButton } from "../../ui";
import SessionShell from "../../components/session/SessionShell";
import RatingBar from "../../components/session/RatingBar";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Flashcard from "../../components/cards/Flashcard";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dueOnly = searchParams.get("due") === "1";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { reportSession, refreshCollections, voiceForCollection } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [stats, setStats] = useState<FlashcardStats>({
    totalCards: 0,
    dontKnow: 0,
    forgot: 0,
    remember: 0,
    know: 0,
    duration: 0,
  });

  // Swipe tracking
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 0, 160], [-6, 0, 6]);
  const swipedRef = useRef(false);

  const loadData = async () => {
    if (!id) return;
    const loaded = await getCollection(id);
    if (!loaded) { navigate("/"); return; }

    const filtered = dueOnly
      ? loaded.cards.filter(isDueCard)
      : [...loaded.cards];

    if (filtered.length === 0) { navigate(-1); return; }

    setCollection(loaded);
    setCards(filtered);
    setStats({
      totalCards: filtered.length,
      dontKnow: 0,
      forgot: 0,
      remember: 0,
      know: 0,
      duration: 0,
    });
    setCurrentIndex(0);
    setIsFlipped(false);
    setStartTime(Date.now());
    setShowStats(false);
    ratingLockRef.current = false;
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Keyboard shortcuts: Space to flip, 1–4 to rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStats || !collection) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          setIsFlipped(f => !f);
          break;
        case "Digit1": case "Numpad1":
          if (isFlipped) handleRating(KnowledgeLevel.DONT_KNOW);
          break;
        case "Digit2": case "Numpad2":
          if (isFlipped) handleRating(KnowledgeLevel.FORGOT);
          break;
        case "Digit3": case "Numpad3":
          if (isFlipped) handleRating(KnowledgeLevel.REMEMBER);
          break;
        case "Digit4": case "Numpad4":
          if (isFlipped) handleRating(KnowledgeLevel.KNOW);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, showStats, collection]);

  // Одна оценка на карточку: пока сохраняем и переходим дальше, повторные нажатия игнорируем —
  // иначе двойное нажатие на последней карточке завершило бы тренировку дважды
  const ratingLockRef = useRef(false);

  const handleRating = async (level: KnowledgeLevel) => {
    if (!isFlipped || showStats || ratingLockRef.current) return;
    ratingLockRef.current = true;

    const currentCard = cards[currentIndex];
    const updatedCard = updateSRSData(currentCard, level);

    if (collection) {
      const updatedCollection = {
        ...collection,
        cards: collection.cards.map((c) =>
          c.id === updatedCard.id ? updatedCard : c,
        ),
        lastStudied: new Date(),
      };
      await updateCollection(updatedCollection);
    }

    setStats((prev) => ({
      ...prev,
      dontKnow: level === KnowledgeLevel.DONT_KNOW ? prev.dontKnow + 1 : prev.dontKnow,
      forgot: level === KnowledgeLevel.FORGOT ? prev.forgot + 1 : prev.forgot,
      remember: level === KnowledgeLevel.REMEMBER ? prev.remember + 1 : prev.remember,
      know: level === KnowledgeLevel.KNOW ? prev.know + 1 : prev.know,
    }));

    setIsFlipped(false);

    setTimeout(async () => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        ratingLockRef.current = false;
      } else {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const finalKnow = stats.know + (level === KnowledgeLevel.KNOW ? 1 : 0);
        setStats((prev) => ({ ...prev, duration }));

        // Итоги показываем сразу; прогресс уходит на сервер в фоне, празднование — по его ответу
        playSessionCompleteIfEnabled();
        setShowStats(true);

        if (user && collection) {
          // Прогресс, серию и достижения начисляет сервер; празднование — по его ответу
          await reportSession({
            kind: "flashcards",
            collectionIds: [collection.id],
            cards: cards.length,
            allKnow: finalKnow === cards.length,
            durationSec: duration,
          });
          refreshCollections(); // интервалы повторения изменились — счётчики «к повторению» на главной
        }

      }
    }, 200);
  };

  const handleShuffle = async () => {
    const ok = await confirm({
      title: t.words.flashcards.shuffle,
      message: t.words.flashcards.shuffleConfirm,
      type: "warning",
    });
    if (ok) {
      setCards((prev) => [...prev].sort(() => Math.random() - 0.5));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  if (!collection || cards.length === 0) return null;

  const currentCard = cards[currentIndex];

  return (
    <SessionShell
      title={collection.name}
      subtitle={dueOnly ? <Badge tone="accent">{t.words.flashcards.dueOnly}</Badge> : undefined}
      onClose={() => navigate(-1)}
      action={
        <IconButton label={t.words.flashcards.shuffle} onClick={handleShuffle}>
          <Shuffle size={20} />
        </IconButton>
      }
      progress={(currentIndex + 1) / cards.length}
      meta={`${currentIndex + 1} / ${cards.length}`}
    >
      {/* Карточка — свайп: до переворота переворачивает, после — вправо «знаю», влево «не знаю» */}
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4 py-4 sm:px-6">
        <motion.div
          className="w-full max-w-3xl shrink-0 touch-pan-y"
          style={{ x: dragX, rotate: dragRotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          dragMomentum={false}
          onDragStart={() => {
            swipedRef.current = false;
          }}
          onDrag={(_, info) => {
            if (Math.abs(info.offset.x) > 8) swipedRef.current = true;
          }}
          onDragEnd={(_, info) => {
            const didSwipe = swipedRef.current;
            // swipedRef остаётся true чуть дольше — чтобы onClick карточки понял, что это был свайп
            setTimeout(() => {
              swipedRef.current = false;
            }, 80);
            if (!didSwipe || Math.abs(info.offset.x) < 60) return;
            if (!isFlipped) setIsFlipped(true);
            else if (info.offset.x > 0) handleRating(KnowledgeLevel.KNOW);
            else handleRating(KnowledgeLevel.DONT_KNOW);
          }}
        >
          <Flashcard
            card={currentCard}
            language={voiceForCollection(collection)}
            isFlipped={isFlipped}
            onFlip={() => {
              if (!swipedRef.current) setIsFlipped((f) => !f);
            }}
          />
        </motion.div>
      </main>

      <RatingBar isFlipped={isFlipped} onFlip={() => setIsFlipped(true)} onRate={handleRating} />

      <FlashcardStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate(-1)}
        onRestart={loadData}
      />

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </SessionShell>
  );
}
