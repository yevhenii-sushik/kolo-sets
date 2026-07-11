import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Collection, Card, KnowledgeLevel, FlashcardStats } from "../../types";
import { getCollections, updateCollection, updateSRSData, isDueCard } from "../../utils/storage";
import { updateFlashcardStats } from "../../firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { playSessionCompleteIfEnabled } from "../../utils/sounds";
import { Clock, X } from "lucide-react";
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
    if (!isFlipped) return;

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
  const progress = ((currentIndex + 1) / reviewCards.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-[#F5F2ED] dark:bg-[#0F0E0C] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-white/60 dark:bg-[#1A1917]/60 backdrop-blur-xl p-2 sm:p-3 pr-4 sm:pr-5 rounded-xl sm:rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-xl transition-colors shrink-0 text-[#1A1714] dark:text-[#F0EDE8]"
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="u-title text-lg md:text-xl text-[#1A1714] dark:text-[#F0EDE8] leading-none">
                Review Queue
              </h1>
              <p className="text-[11px] text-[#B5B0A8] font-medium mt-0.5 truncate">
                {currentReview.collectionName}
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black text-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-full shrink-0">
            <Clock size={11} />
            Due today
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="sub-title min-w-10 text-center">{currentIndex + 1} / {reviewCards.length}</div>
          <div className="flex-1 bg-[#EDEAE4] dark:bg-[#242220] rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-[#FF5733] rounded-full h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="uc-title min-w-10 text-center">{Math.round(progress)}%</div>
        </div>
      </div>

      {/* Card */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 overflow-auto">
        <motion.div
          className="w-full max-w-5xl shrink-0 touch-pan-y"
          style={{ x: dragX, rotate: dragRotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          dragMomentum={false}
          onDragStart={() => { swipedRef.current = false; }}
          onDrag={(_, info) => { if (Math.abs(info.offset.x) > 8) swipedRef.current = true; }}
          onDragEnd={(_, info) => {
            const didSwipe = swipedRef.current;
            setTimeout(() => { swipedRef.current = false; }, 80);
            if (!didSwipe || Math.abs(info.offset.x) < 60) return;
            if (!isFlipped) { setIsFlipped(true); return; }
            if (info.offset.x > 0) handleRating(KnowledgeLevel.KNOW);
            else handleRating(KnowledgeLevel.DONT_KNOW);
          }}
        >
          <Flashcard
            card={currentReview.card}
            isFlipped={isFlipped}
            onFlip={() => { if (!swipedRef.current) setIsFlipped(f => !f); }}
          />
        </motion.div>
      </main>

      {/* Rating buttons */}
      <div className="shrink-0 pb-6 sm:pb-8 px-4 sm:px-6">
        <p className="text-center text-[11px] sm:text-[13px] font-medium text-[#B5B0A8] dark:text-[#4A4742] mb-2 sm:mb-4">
          {isFlipped ? t.words.flashcards.hints.rateKnowledge : t.words.flashcards.hints.clickToFlip}
        </p>
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[
            { level: KnowledgeLevel.DONT_KNOW, label: t.words.flashcards.levels.dontKnow, emoji: "😕", color: "bg-red-600 hover:bg-red-700" },
            { level: KnowledgeLevel.FORGOT,    label: t.words.flashcards.levels.forgot,   emoji: "🤔", color: "bg-[#FF5733] hover:bg-[#E54D2A]" },
            { level: KnowledgeLevel.REMEMBER,  label: t.words.flashcards.levels.remember, emoji: "🙂", color: "bg-blue-600 hover:bg-blue-700" },
            { level: KnowledgeLevel.KNOW,      label: t.words.flashcards.levels.know,     emoji: "😊", color: "bg-[#22C55E] hover:bg-[#16A34A]" },
          ].map(btn => (
            <button
              key={btn.level}
              disabled={!isFlipped}
              onClick={() => handleRating(btn.level)}
              className={`flex flex-col items-center justify-center py-3 sm:py-4 rounded-xl sm:rounded-4xl transition-all active:scale-95 ${
                isFlipped
                  ? `${btn.color} text-white scale-100 border border-transparent shadow-lg`
                  : "bg-[#EDEAE4] dark:bg-[#242220] text-[#B5B0A8] opacity-60 scale-95 grayscale cursor-not-allowed border border-[#E0DBD3] dark:border-[#2E2C29]"
              }`}
            >
              <span className="text-lg sm:text-xl md:text-2xl mb-0.5 sm:mb-1">{btn.emoji}</span>
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>
        <p className="hidden md:block text-center sub-title mt-3 opacity-60">
          {t.words.flashcards.keyboardHint}
        </p>
      </div>

      <FlashcardStatsModal
        isOpen={showStats}
        stats={stats}
        onClose={() => navigate("/")}
        onRestart={loadData}
      />
    </motion.div>
  );
}
