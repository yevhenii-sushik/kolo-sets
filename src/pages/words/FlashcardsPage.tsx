import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Collection, Card, KnowledgeLevel, FlashcardStats } from "../../types";
import {
  getCollection,
  updateCollection,
  updateSRSData,
  isDueCard,
} from "../../utils/storage";
import { updateFlashcardStats } from "../../firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { playSessionCompleteIfEnabled } from "../../utils/sounds";
import { Shuffle, X, Clock } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Flashcard from "../../components/cards/Flashcard";
import FlashcardStatsModal from "../../components/FlashcardStatsModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import { STREAK_CELEBRATION_EVENT } from "../../components/StreakCelebration";

export default function FlashcardsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const dueOnly = searchParams.get("due") === "1";
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const { checkAchievements, profile, refreshProfile, refreshCollections } = useData();
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

  const handleRating = async (level: KnowledgeLevel) => {
    if (!isFlipped) return;

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
      } else {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        const finalKnow = stats.know + (level === KnowledgeLevel.KNOW ? 1 : 0);
        setStats((prev) => ({ ...prev, duration }));

        if (user) {
          const lastStudy = profile?.lastStudyDate
            ? new Date(
                typeof profile.lastStudyDate.toDate === "function"
                  ? profile.lastStudyDate.toDate()
                  : profile.lastStudyDate,
              )
            : null;
          const isComeback = lastStudy
            ? Date.now() - lastStudy.getTime() > 7 * 24 * 60 * 60 * 1000
            : false;

          // Calculate if this is the first study of the day and what the new streak will be
          const todayMidnight = new Date();
          todayMidnight.setHours(0, 0, 0, 0);
          const lastMidnight = lastStudy ? new Date(lastStudy) : null;
          if (lastMidnight) lastMidnight.setHours(0, 0, 0, 0);
          const diffDays = lastMidnight
            ? Math.floor((todayMidnight.getTime() - lastMidnight.getTime()) / 86400000)
            : null;
          const isFirstStudyToday = diffDays === null || diffDays > 0;

          // Write to Firebase first
          await updateFlashcardStats(user.uid, cards.length, duration);
          checkAchievements({ duration, allKnow: finalKnow === cards.length, isComeback });
          refreshProfile(); // sync DataContext so streak counter in header updates
          refreshCollections(); // sync SRS changes so due-counters (HomePage banner) don't go stale

          // Fire animation only after successful write, with correct streak value
          if (isFirstStudyToday) {
            const prevStreak = profile?.currentStreak ?? 0;
            const newStreak = diffDays === 1 ? prevStreak + 1 : 1;
            window.dispatchEvent(
              new CustomEvent(STREAK_CELEBRATION_EVENT, { detail: { streak: newStreak } })
            );
          }
        }

        playSessionCompleteIfEnabled();
        setShowStats(true);
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
  const progress = ((currentIndex + 1) / cards.length) * 100;

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
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-xl transition-colors shrink-0 text-[#1A1714] dark:text-[#F0EDE8]"
              title={t.back}
            >
              <X size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="u-title text-lg md:text-xl text-[#1A1714] dark:text-[#F0EDE8] truncate">
                {collection.name}
              </h1>
            </div>
            {dueOnly && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-black text-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-full shrink-0">
                <Clock size={10} />
                {t.words.flashcards.dueOnly}
              </span>
            )}
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] hover:bg-[#FF5733] hover:text-white transition-colors"
          >
            <Shuffle size={18} />
            <span className="hidden md:inline text-[13px] font-bold">
              {t.words.flashcards.shuffle}
            </span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 px-3 sm:px-4 md:px-6 py-2 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="sub-title min-w-10 text-center">
            {currentIndex + 1} / {cards.length}
          </div>
          <div className="flex-1 bg-[#EDEAE4] dark:bg-[#242220] rounded-full h-3.5 overflow-hidden">
            <div
              className="bg-[#FF5733] rounded-full h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="uc-title min-w-10 text-center">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* Main Card Area — swipeable */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 overflow-auto">
        <motion.div
          className="w-full max-w-5xl shrink-0 touch-pan-y"
          style={{ x: dragX, rotate: dragRotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          dragMomentum={false}
          onDragStart={() => { swipedRef.current = false; }}
          onDrag={(_, info) => {
            if (Math.abs(info.offset.x) > 8) swipedRef.current = true;
          }}
          onDragEnd={(_, info) => {
            const didSwipe = swipedRef.current;
            // keep swipedRef true briefly so the onClick in Flashcard can check it
            setTimeout(() => { swipedRef.current = false; }, 80);

            if (!didSwipe || Math.abs(info.offset.x) < 60) return;

            if (!isFlipped) {
              setIsFlipped(true);
            } else {
              // swipe right = know, swipe left = don't know
              if (info.offset.x > 0) handleRating(KnowledgeLevel.KNOW);
              else handleRating(KnowledgeLevel.DONT_KNOW);
            }
          }}
        >
          <Flashcard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={() => {
              if (!swipedRef.current) setIsFlipped(f => !f);
            }}
          />
        </motion.div>
      </main>

      {/* Rating Buttons */}
      <div className="shrink-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-8 px-4 sm:px-6">
        <p className="text-center text-[11px] sm:text-[13px] font-medium text-[#B5B0A8] dark:text-[#4A4742] mb-2 sm:mb-4">
          {isFlipped
            ? t.words.flashcards.hints.rateKnowledge
            : t.words.flashcards.hints.clickToFlip}
        </p>

        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {[
            {
              level: KnowledgeLevel.DONT_KNOW,
              label: t.words.flashcards.levels.dontKnow,
              emoji: "😕",
              color: "bg-red-600 hover:bg-red-700",
            },
            {
              level: KnowledgeLevel.FORGOT,
              label: t.words.flashcards.levels.forgot,
              emoji: "🤔",
              color: "bg-[#FF5733] hover:bg-[#E54D2A]",
            },
            {
              level: KnowledgeLevel.REMEMBER,
              label: t.words.flashcards.levels.remember,
              emoji: "🙂",
              color: "bg-blue-600 hover:bg-blue-700",
            },
            {
              level: KnowledgeLevel.KNOW,
              label: t.words.flashcards.levels.know,
              emoji: "😊",
              color: "bg-[#22C55E] hover:bg-[#16A34A]",
            },
          ].map((btn) => (
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
              <span className="text-[10px] sm:text-xs md:text-sm font-semibold leading-tight">
                {btn.label}
              </span>
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
        onClose={() => navigate(-1)}
        onRestart={loadData}
      />

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </motion.div>
  );
}
