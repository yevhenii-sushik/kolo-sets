import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "framer-motion";
import { Card, Collection } from "../../types";
import {
  getCollection,
  updateCollection,
  createCard,
  parseImportText,
} from "../../utils/storage";
import { exportCollectionToJSON, downloadJSON } from "../../utils/exportImport";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import {
  Plus,
  Upload,
  Download,
  Edit3,
  BookOpen,
  Layers,
  RefreshCw,
  FileJson,
  ArrowUp,
} from "lucide-react";
import AddCardModal from "../../components/AddCardModal";
import ImportCardsModal from "../../components/ImportCardsModal";
import CardListItem from "../../components/cards/CardListItem";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: "easeOut" as const },
});

export default function CollectionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Collapsing header: большой заголовок плавно сжимается/тает по скроллу
  // и одновременно (та же scroll-позиция, никаких отдельных дискретных
  // toggle-анимаций — от них и была дёрганность) в компактный докнутый
  // бар под хедером NavLayout (fixed h-12). scrollY завёрнут в spring —
  // сглаживает шаг между кадрами скролла, иначе на резких свайпах трансформ
  // "прыгает". Кнопка "наверх" — отдельный, более глубокий порог.
  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, { stiffness: 300, damping: 40, restDelta: 0.5 });
  const headerScale = useTransform(smoothScrollY, [0, 160], [1, 0.85]);
  const headerScrollOpacity = useTransform(smoothScrollY, [0, 140], [1, 0]);
  const dockedOpacity = useTransform(smoothScrollY, [70, 150], [0, 1]);
  const [isDocked, setIsDocked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsDocked(latest > 110);
    setShowScrollTop(latest > 500);
  });

  useEffect(() => {
    const loadCollection = async () => {
      if (id) {
        const loaded = await getCollection(id);
        if (loaded) {
          setCollection(loaded as Collection);
        } else {
          navigate("/");
        }
        setLoading(false);
      }
    };
    loadCollection();
  }, [id, navigate]);

  const learnedCount = useMemo(() => {
    return (
      collection?.cards.filter((c: Card) => c.srsData.interval > 0).length || 0
    );
  }, [collection]);

  const handleAddCard = async (
    cardData: Omit<Card, "id" | "srsData" | "createdAt">,
  ) => {
    if (!collection) return;
    const newCard = createCard(
      cardData.word,
      cardData.translation,
      cardData.explanation,
      cardData.example,
      cardData.partOfSpeech,
    );
    const updated = { ...collection, cards: [...collection.cards, newCard] };
    setCollection(updated);
    await updateCollection(updated);
    setIsAddModalOpen(false);
  };

  const handleImportCards = async (text: string) => {
    if (!collection) return;
    const parsedCards = parseImportText(text);
    const newCards = parsedCards.map((cardData) =>
      createCard(
        cardData.word,
        cardData.translation,
        cardData.explanation,
        cardData.example,
        cardData.partOfSpeech,
      ),
    );
    const updated = {
      ...collection,
      cards: [...collection.cards, ...newCards],
    };
    setCollection(updated);
    await updateCollection(updated);
    setIsImportModalOpen(false);
    success(`${t.words.editCollection.importSuccess}: ${newCards.length}`);
  };

  const handleEditCard = async (
    cardId: string,
    cardData: Omit<Card, "id" | "srsData" | "createdAt">,
  ) => {
    if (!collection) return;
    const updatedCards = collection.cards.map((card: Card) =>
      card.id === cardId ? { ...card, ...cardData } : card,
    );
    const updated = { ...collection, cards: updatedCards };
    setCollection(updated);
    await updateCollection(updated);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!collection) return;
    const isConfirmed = await confirm({
      title: t.delete,
      message: t.words.editCollection.modals.deleteConfirm,
      type: "danger",
    });
    if (isConfirmed) {
      const updatedCards = collection.cards.filter(
        (card: Card) => card.id !== cardId,
      );
      const updated = { ...collection, cards: updatedCards };
      setCollection(updated);
      await updateCollection(updated);
    }
  };

  const handleRenameCollection = () => {
    if (!collection) return;
    setRenameValue(collection.name);
    setShowRenameModal(true);
  };

  const handleRenameSubmit = async () => {
    if (!collection || !renameValue.trim()) return;
    const updated = { ...collection, name: renameValue.trim() };
    setCollection(updated);
    await updateCollection(updated);
    setShowRenameModal(false);
  };

  const handleExport = async () => {
    if (!collection) return;
    setIsExporting(true);
    try {
      const json = exportCollectionToJSON(collection);
      const safeName = collection.name
        .replace(/[^a-zA-Zа-яА-Я0-9]/g, "-")
        .toLowerCase();
      downloadJSON(
        json,
        `kolo-${safeName}-${new Date().toISOString().split("T")[0]}.json`,
      );
      success(t.words.editCollection.exportSuccess);
    } catch {
      error(t.words.editCollection.exportError);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Editorial header — shrinks/fades on scroll (style motion values,
          separate from the mount fadeUp on motion.header itself to avoid
          both fighting over `opacity`) */}
      <motion.header className="mb-12" {...fadeUp(0)}>
        <motion.div
          style={{ scale: headerScale, opacity: headerScrollOpacity }}
          className="origin-top-left"
        >
        <div className="flex items-end gap-4 mb-6 group">
          <h1
            className={`text-5xl md:text-7xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none tracking-tight transition-opacity duration-500 ${loading ? "opacity-20" : "opacity-100"}`}
          >
            {loading ? (
              t.words.editCollection.loading
            ) : (
              <>
                {collection?.name?.split(" ").slice(0, -1).join(" ")}{" "}
                <span className="text-[#FF5733]">
                  {collection?.name?.split(" ").slice(-1)[0]}.
                </span>
              </>
            )}
          </h1>
          {!loading && (
            <button
              onClick={handleRenameCollection}
              className="mb-2 p-2 text-[#B5B0A8] hover:text-[#FF5733] hover:bg-[#FFF0ED] dark:hover:bg-[#2A1A15] rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Edit3 size={20} />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div
          className={`flex flex-wrap gap-3 transition-opacity duration-500 ${loading ? "opacity-0" : "opacity-100"}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-full shadow-sm">
            <Layers size={13} className="text-[#FF5733]" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7A756E]">
              {collection?.cards.length || 0} {t.words.collectionCard.cards}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-full shadow-sm">
            <BookOpen size={13} className="text-[#FF5733]" />
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#7A756E]">
              {learnedCount} {t.words.editCollection.learned}
            </span>
          </div>
        </div>
        </motion.div>
      </motion.header>

      {/* Docked compact bar — collection name fades up into this as you
          scroll, continuously driven by the same scroll value as the big
          header (no discrete mount/exit animation — that's what caused the
          jerkiness). Fixed + solid bg, same as NavLayout's own header, so
          the two visually read as one continuous bar with no seam. */}
      {!loading && (
        <motion.div
          style={{ opacity: dockedOpacity }}
          className={`fixed top-12 left-0 right-0 z-40 bg-[#F5F2ED] dark:bg-[#0F0E0C] ${isDocked ? "" : "pointer-events-none"}`}
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <h2 className="text-xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight truncate">
              {collection?.name?.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="text-[#FF5733]">
                {collection?.name?.split(" ").slice(-1)[0]}.
              </span>
            </h2>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="p-2.5 rounded-xl bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors active:scale-95"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="p-2.5 rounded-xl border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:text-[#FF5733] transition-colors active:scale-95"
              >
                <Upload size={16} />
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting || !collection || collection.cards.length === 0}
                className="p-2.5 rounded-xl border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] hover:border-[#FF5733] hover:text-[#FF5733] transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {isExporting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action buttons — icon-only on mobile so the row never wraps;
          icon+label from md: up, matching WordsPage's action bar */}
      <motion.div className="flex gap-2 sm:gap-3 mb-12" {...fadeUp(0.05)}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex justify-center items-center gap-2 w-12 h-12 md:w-auto md:px-6 md:py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#FF5733] hover:text-white dark:hover:bg-[#FF5733] dark:hover:text-white transition-all active:scale-[0.98] shrink-0"
        >
          <Plus size={18} />
          <span className="hidden md:block">{t.words.editCollection.addCard}</span>
        </button>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex justify-center items-center gap-2 w-12 h-12 md:w-auto md:px-6 md:py-3 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:border-[#FF5733] hover:text-[#FF5733] transition-all active:scale-[0.98] shrink-0"
        >
          <Upload size={18} />
          <span className="hidden md:block">{t.words.editCollection.import}</span>
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || !collection || collection.cards.length === 0}
          className="flex justify-center items-center gap-2 w-12 h-12 md:w-auto md:px-6 md:py-3 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:border-[#FF5733] hover:text-[#FF5733] transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          {isExporting ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          <span className="hidden md:block">{t.words.editCollection.export}</span>
        </button>
      </motion.div>

      {/* Word list */}
      <motion.section {...fadeUp(0.1)}>
        <p className="sub-title mb-6 px-1">{t.words.editCollection.wordList}</p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-[#1A1917] rounded-[2.5rem] animate-pulse border border-[#E0DBD3] dark:border-[#2E2C29]"
              />
            ))}
          </div>
        ) : !collection || collection.cards.length === 0 ? (
          <div
            onClick={() => setIsAddModalOpen(true)}
            className="group cursor-pointer flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border-2 border-dashed border-[#E0DBD3] dark:border-[#2E2C29] hover:border-[#FF5733] dark:hover:border-[#FF5733] transition-all duration-300"
          >
            <div className="w-16 h-16 bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#FFF0ED] dark:group-hover:bg-[#2A1A15] transition-colors">
              <FileJson
                size={28}
                className="text-[#B5B0A8] group-hover:text-[#FF5733] transition-colors"
              />
            </div>
            <h3 className="text-xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] mb-2">
              {t.words.editCollection.noCards}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8]">
              {t.words.editCollection.noCardsDesc}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {collection.cards.map((card: Card, i: number) => (
              <motion.div key={card.id} {...fadeUp(i * 0.03)}>
                <CardListItem
                  card={card}
                  onSave={(cardData) => handleEditCard(card.id, cardData)}
                  onDelete={() => handleDeleteCard(card.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCard}
      />

      <ImportCardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
      />

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />

      {/* Inline rename modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1A1714]/40 dark:bg-black/50 backdrop-blur-xl"
            onClick={() => setShowRenameModal(false)}
          />
          <div className="relative w-block max-w-md w-full p-6 shadow-xl">
            <h3 className="u-title text-xl font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-4">
              {t.words.editCollection.modals.renameTitle}
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              autoFocus
              className="w-full px-4 py-3 border-2 border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl focus:border-[#FF5733] outline-none bg-white dark:bg-[#141312] text-[#1A1714] dark:text-[#F0EDE8] mb-4 transition-colors"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-5 py-2.5 text-[#7A756E] hover:bg-[#EDEAE4] dark:hover:bg-[#242220] rounded-xl font-bold text-sm transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleRenameSubmit}
                disabled={!renameValue.trim()}
                className="px-5 py-2.5 bg-[#FF5733] hover:bg-[#E54D2A] disabled:bg-[#B5B0A8] text-white rounded-xl font-bold text-sm transition-colors disabled:cursor-not-allowed"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll-to-top — appears once you've scrolled deep into the word list */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-5 sm:right-8 z-40 w-12 h-12 rounded-full bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] shadow-xl flex items-center justify-center hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors active:scale-95"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
