import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");

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
    cardData: Omit<Card, "id" | "srsData" | "createdAt">,
  ) => {
    if (!editingCard || !collection) return;
    const updatedCards = collection.cards.map((card: Card) =>
      card.id === editingCard.id ? { ...card, ...cardData } : card,
    );
    const updated = { ...collection, cards: updatedCards };
    setCollection(updated);
    await updateCollection(updated);
    setEditingCard(null);
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
      {/* Editorial header */}
      <motion.header className="mb-12" {...fadeUp(0)}>
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
      </motion.header>

      {/* Action buttons */}
      <motion.div className="flex flex-wrap gap-3 mb-12" {...fadeUp(0.05)}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#FF5733] hover:text-white dark:hover:bg-[#FF5733] dark:hover:text-white transition-all active:scale-[0.98]"
        >
          <Plus size={16} />
          {t.words.editCollection.addCard}
        </button>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:border-[#FF5733] hover:text-[#FF5733] transition-all active:scale-[0.98]"
        >
          <Upload size={16} />
          {t.words.editCollection.import}
        </button>

        <button
          onClick={handleExport}
          disabled={isExporting || !collection || collection.cards.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] text-[#1A1714] dark:text-[#F0EDE8] rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:border-[#FF5733] hover:text-[#FF5733] transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
        >
          {isExporting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          {t.words.editCollection.export}
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
                  onEdit={() => setEditingCard(card)}
                  onDelete={() => handleDeleteCard(card.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Modals */}
      <AddCardModal
        isOpen={isAddModalOpen || editingCard !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCard(null);
        }}
        onSave={editingCard ? handleEditCard : handleAddCard}
        initialData={editingCard || undefined}
        title={
          editingCard
            ? t.words.editCollection.modals.editWord
            : t.words.editCollection.modals.newWord
        }
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
    </div>
  );
}
