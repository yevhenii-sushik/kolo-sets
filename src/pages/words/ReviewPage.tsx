import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Collection, Card, KnowledgeLevel, FlashcardStats } from "../../types";
import { getCollections, updateCollection, updateSRSData, isDueCard } from "../../utils/storage";
import { updateFlashcardStats } from "../../firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { playSessionCompleteIfEnabled } from "../../utils/sounds";
import SessionShell from "../../components/session/SessionShell";
import RatingBar from "../../components/session/RatingBar";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Flashcard from "../../components/cards/Flashcard";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import { STREAK_CELEBRATION_EVENT } from "../../components/StreakCelebration";

interface ReviewCard {
  card: Card;
  collectionId: string;
  collectionName: string;
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { checkAchievements, profile, refreshProfile, refreshCollections } = useData();

  const [reviewCards, setReviewCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const startTimeRef = useRef(Date.now());
  const [stats, setStats] = useState<FlashcardStats>({
    totalCards: 0, dontKnow: 0, forgot: 0, remember: 0, know: 0, duration: 0,
  });

  // Map of collectionId → Collection for efficient in-memory updates
  const collectionsMapRef = useRef<Map<string, Collection>>(new Map());

  const swipedRef = useRef(false);
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-160, 0, 160], [-6, 0, 6]);

  const loadData = async () => {
    collectionsMapRef.current.clear();
    const allCollections = await getCollections();
    if (allCollections.length === 0) { navigate("/"); return; }

    allCollections.forEach(col => collectionsMapRef.current.set(col.id, col));

    const cards: ReviewCard[] = [];
    for (const col of allCollections) {
      for (const card of col.cards) {
        if (isDueCard(card)) {
          cards.push({ card, collectionId: col.id, collectionName: col.name });
        }
      }
    }

    if (cards.length === 0) { navigate("/"); return; }

    setReviewCards(cards);
    setStats({ totalCards: cards.length, dontKnow: 0, forgot: 0, remember: 0, know: 0, duration: 0 });
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowStats(false);
    startTimeRef.current = Date.now();
    setLoaded(true);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStats || !loaded) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.code) {
        case "Space": e.preventDefault(); setIsFlipped(f => !f); break;
        case "Digit1": case "Numpad1": if (isFlipped) handleRating(KnowledgeLevel.DONT_KNOW); break;
        case "Digit2": case "Numpad2": if (isFlipped) handleRating(KnowledgeLevel.FORGOT); break;
        case "Digit3": case "Numpad3": if (isFlipped) handleRating(KnowledgeLevel.REMEMBER); break;
        case "Digit4": case "Numpad4": if (isFlipped) handleRating(KnowledgeLevel.KNOW); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, showStats, loaded]);

  const handleRating = async (level: KnowledgeLevel) => {
    if (!isFlipped || showStats) return;

    const { card, collectionId } = reviewCards[currentIndex];
    const updatedCard = updateSRSData(card, level);

    const collection = collectionsMapRef.current.get(collectionId);
    if (collection) {
      const updatedCollection = {
        ...collection,
        cards: collection.cards.map(c => c.id === updatedCard.id ? updatedCard : c),
        lastStudied: new Date(),
      };
      collectionsMapRef.current.set(collectionId, updatedCollection);
      await updateCollection(updatedCollection);
    }

    setStats(prev => ({
      ...prev,
      dontKnow: level === KnowledgeLevel.DONT_KNOW ? prev.dontKnow + 1 : prev.dontKnow,
      forgot:   level === KnowledgeLevel.FORGOT     ? prev.forgot + 1   : prev.forgot,
      remember: level === KnowledgeLevel.REMEMBER   ? prev.remember + 1 : prev.remember,
      know:     level === KnowledgeLevel.KNOW       ? prev.know + 1     : prev.know,
    }));

    setIsFlipped(false);

    setTimeout(async () => {
      if (currentIndex < reviewCards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const finalKnow = stats.know + (level === KnowledgeLevel.KNOW ? 1 : 0);
        setStats(prev => ({ ...prev, duration }));

        if (user) {
          const lastStudy = profile?.lastStudyDate
            ? new Date(typeof profile.lastStudyDate.toDate === "function"
                ? profile.lastStudyDate.toDate()
                : profile.lastStudyDate)
            : null;
          const isComeback = lastStudy
            ? Date.now() - lastStudy.getTime() > 7 * 24 * 60 * 60 * 1000
            : false;
          const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
          const lastMidnight = lastStudy ? new Date(lastStudy) : null;
          if (lastMidnight) lastMidnight.setHours(0, 0, 0, 0);
          const diffDays = lastMidnight
            ? Math.floor((todayMidnight.getTime() - lastMidnight.getTime()) / 86400000)
            : null;
          const isFirstStudyToday = diffDays === null || diffDays > 0;

          await updateFlashcardStats(user.uid, reviewCards.length, duration);
          checkAchievements({ duration, allKnow: finalKnow === reviewCards.length, isComeback });
          refreshProfile();
          refreshCollections();

          if (isFirstStudyToday) {
            const prevStreak = profile?.currentStreak ?? 0;
            const newStreak = diffDays === 1 ? prevStreak + 1 : 1;
            window.dispatchEvent(new CustomEvent(STREAK_CELEBRATION_EVENT, { detail: { streak: newStreak } }));
          }
        }

        playSessionCompleteIfEnabled();
        setShowStats(true);
      }
    }, 200);
  };

  if (!loaded || reviewCards.length === 0) return null;

  const currentReview = reviewCards[currentIndex];

  return (
    <SessionShell
      title={t.words.session.review}
      subtitle={currentReview.collectionName}
      onClose={() => navigate("/")}
      progress={(currentIndex + 1) / reviewCards.length}
      meta={`${currentIndex + 1} / ${reviewCards.length}`}
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
            card={currentReview.card}
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
        onClose={() => navigate("/")}
        onRestart={loadData}
      />
    </SessionShell>
  );
}
