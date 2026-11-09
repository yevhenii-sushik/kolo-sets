import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
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
import { Plus, Upload, Download, Pencil, ArrowUp, Layers, Play } from "lucide-react";
import { Button, ButtonLink, Card as UiCard, Field, Heading, IconButton, Input, Modal, Text } from "../../ui";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
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
  const { t, language } = useI18n();
  const e = t.words.editCollection;
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Большой заголовок тает по прокрутке, и в то же время (одна и та же позиция прокрутки, без
  // отдельных анимаций — от них была дёрганность) проявляется закреплённая полоса под шапкой
  // NavLayout. Кнопка «наверх» — на более глубоком пороге.
  const { scrollY } = useScroll();
  const headerScrollOpacity = useTransform(scrollY, [0, 140], [1, 0]);
  const dockedOpacity = useTransform(scrollY, [90, 150], [0, 1]);
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

  const cardCount = collection?.cards.length ?? 0;
  // Слова есть — главное действие «Учить», чтобы из редактора не приходилось искать, где начать тренировку
  const studyTo = `/collection/${id}/flashcards`;
  const actions = (compact: boolean) => (
    <>
      {compact ? (
        <>
          {cardCount > 0 && (
            <IconButton variant="soft" label={e.study} onClick={() => navigate(studyTo)}>
              <Play size={18} />
            </IconButton>
          )}
          <IconButton variant={cardCount > 0 ? "surface" : "soft"} label={e.addCard} onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} />
          </IconButton>
          <IconButton variant="surface" label={e.import} onClick={() => setIsImportModalOpen(true)}>
            <Upload size={18} />
          </IconButton>
          <IconButton variant="surface" label={e.export} onClick={handleExport} disabled={isExporting || cardCount === 0}>
            <Download size={18} />
          </IconButton>
        </>
      ) : (
        <>
          {cardCount > 0 && (
            <ButtonLink to={studyTo} iconLeft={<Play size={18} />}>
              {e.study}
            </ButtonLink>
          )}
          <Button variant={cardCount > 0 ? "secondary" : "primary"} iconLeft={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
            {e.addCard}
          </Button>
          <Button variant="secondary" iconLeft={<Upload size={18} />} onClick={() => setIsImportModalOpen(true)}>
            {e.import}
          </Button>
          <Button variant="secondary" iconLeft={<Download size={18} />} loading={isExporting} disabled={cardCount === 0} onClick={handleExport}>
            {e.export}
          </Button>
        </>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* ── Шапка набора: тает по прокрутке ── */}
      <motion.header className="mb-10 grid gap-5" {...fadeUp(0)}>
        <motion.div style={{ opacity: headerScrollOpacity }} className="grid gap-2">
          <div className="flex items-start gap-1">
            <Heading size="display" className={loading ? "opacity-20" : undefined}>
              {loading ? e.loading : collection?.name}
            </Heading>
            {!loading && (
              <IconButton label={e.rename} onClick={handleRenameCollection} className="mt-0.5 sm:mt-2">
                <Pencil size={20} />
              </IconButton>
            )}
          </div>
          {!loading && (
            <Text tone="muted">
              {plural(getLanguageInfo(language).htmlLang, cardCount, t.words.collectionCard.words)} · {e.learned}: {learnedCount}
            </Text>
          )}
        </motion.div>
        <div className="flex flex-wrap gap-2">{actions(false)}</div>
      </motion.header>

      {/* ── Закреплённая полоса: появляется, когда заголовок ушёл вверх ── */}
      {!loading && (
        <motion.div
          style={{ opacity: dockedOpacity }}
          className={`fixed inset-x-0 top-14 z-40 border-b border-line bg-bg/90 backdrop-blur-xl ${isDocked ? "" : "pointer-events-none"}`}
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-2.5 sm:px-6 lg:px-8">
            <p className="truncate font-display text-lg font-extrabold text-fg">{collection?.name}</p>
            <div className="flex shrink-0 gap-1.5">{actions(true)}</div>
          </div>
        </motion.div>
      )}

      {/* ── Список слов ── */}
      <motion.section {...fadeUp(0.05)}>
        <h2 className="mb-4 text-sm font-semibold text-fg">{e.wordList}</h2>

        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-3xl border border-line bg-surface" />
            ))}
          </div>
        ) : !collection || collection.cards.length === 0 ? (
          <UiCard tone="inset" padding="lg" className="grid justify-items-center gap-4 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-accent-ink">
              <Layers size={26} />
            </span>
            <div className="grid max-w-md gap-2">
              <Heading size={3} as="h3">
                {e.noCards}
              </Heading>
              <Text size="sm" tone="muted">
                {e.noCardsDesc}
              </Text>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button iconLeft={<Plus size={18} />} onClick={() => setIsAddModalOpen(true)}>
                {e.addCard}
              </Button>
              <Button variant="secondary" iconLeft={<Upload size={18} />} onClick={() => setIsImportModalOpen(true)}>
                {e.import}
              </Button>
            </div>
          </UiCard>
        ) : (
          <div className="grid gap-3">
            {collection.cards.map((card: Card, i: number) => (
              <motion.div key={card.id} {...fadeUp(Math.min(i, 10) * 0.03)}>
                <CardListItem card={card} onSave={(cardData) => handleEditCard(card.id, cardData)} onDelete={() => handleDeleteCard(card.id)} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddCard} />
      <ImportCardsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImportCards} />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />

      {/* ── Переименование ── */}
      <Modal
        open={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title={e.modals.renameTitle}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!renameValue.trim()}>
              {t.save}
            </Button>
          </>
        }
      >
        <Field label={t.words.createModal.nameLabel} htmlFor="rename-collection">
          <Input
            id="rename-collection"
            autoFocus
            value={renameValue}
            onChange={(ev) => setRenameValue(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && handleRenameSubmit()}
          />
        </Field>
      </Modal>

      {/* ── Наверх: когда ушли глубоко в список ── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={e.scrollTop}
            title={e.scrollTop}
            className="fixed bottom-6 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-fg text-on-inverse shadow-xl transition-opacity hover:opacity-90 sm:right-8"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
