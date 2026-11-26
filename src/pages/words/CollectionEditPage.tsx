import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { Card, Collection } from "../../types";
import {
  getCollection,
  updateCollection,
  createCard,
} from "../../utils/storage";
import type { ImportedWord } from "../../utils/importText";
import { exportCollectionToJSON, downloadJSON } from "../../utils/exportImport";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { Plus, Upload, Download, Pencil, ArrowUp, Layers, Play, CloudOff, RotateCw } from "lucide-react";
import { Button, Card as UiCard, Field, Heading, IconButton, Input, Loading, Modal, Skeleton, Text } from "../../ui";
import { getLanguageInfo } from "../../locales/languages";
import { courseCodeFromLanguage, courseNameInline } from "../../courses/languages";
import { plural } from "../../utils/plural";
import AddCardModal from "../../components/AddCardModal";
import ImportCardsModal from "../../components/ImportCardsModal";
import CardListItem from "../../components/cards/CardListItem";
import ShareCardModal from "../../components/cards/ShareCardModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import StudyModeModal from "../../components/cards/StudyModeModal";
import { SetPlanBar, SetPlanLegend } from "../../components/cards/SetPlanView";
import { setPlan } from "../../perigee/setPlan";
import ReportMistakeModal, { type ReportTarget } from "../../components/presets/ReportMistakeModal";
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

  const { allCollections, setCollections } = useData();

  // Набор уже есть в памяти (его загрузил DataContext) — показываем сразу, без скелетона,
  // а свежую версию из базы подтягиваем в фоне: вдруг слова меняли на другом устройстве
  const [collection, setCollectionState] = useState<Collection | null>(() => allCollections.find((c) => c.id === id) ?? null);
  const [loading, setLoading] = useState(() => !allCollections.some((c) => c.id === id));
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Пользователь уже поменял набор — фоновая загрузка не должна вернуть старую версию поверх
  const editedRef = useRef(false);

  // Каждую правку отдаём и в общий список: без этого главная, «Слова» и «Первые шаги»
  // показывали старое число слов до перезагрузки приложения
  const setCollection = (updated: Collection) => {
    editedRef.current = true;
    setCollectionState(updated);
    setCollections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showModes, setShowModes] = useState(false);
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
    if (!id) return;
    let alive = true;
    setLoadError(false);
    getCollection(id)
      .then((loaded) => {
        if (!alive) return;
        if (!loaded) {
          navigate("/");
          return;
        }
        if (editedRef.current) return;
        setCollectionState(loaded);
        setCollections((prev) => prev.map((c) => (c.id === loaded.id ? loaded : c)));
      })
      .catch((err) => {
        console.error("Не удалось загрузить набор", err);
        // Есть копия из памяти — молча остаёмся на ней; нет — экран ошибки с повтором
        if (alive) setLoadError(true);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id, navigate, reloadKey, setCollections]);

  // Пришли из поиска на вкладке «Слова» (?card=<id>): прокручиваем к карточке и ненадолго подсвечиваем.
  // Параметр сразу убираем — при перезагрузке страница не прыгает снова
  const [searchParams, setSearchParams] = useSearchParams();
  const focusCardId = searchParams.get("card");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [sharing, setSharing] = useState<Card | null>(null);
  // Ошибка в карточке из готового набора Kolo (docs/specs/05-ready-sets.md, «Ошибки в наборах»)
  const [reporting, setReporting] = useState<ReportTarget | null>(null);
  const reportCard = (card: Card) => {
    if (!collection?.preset || !card.presetCardId) return;
    setReporting({
      preset: collection.preset,
      voice: collection.language,
      cards: [{ id: card.presetCardId, word: card.word, translation: card.translation }],
    });
  };
  useEffect(() => {
    if (!focusCardId || !collection) return;
    const found = collection.cards.some((c) => c.id === focusCardId);
    if (found) {
      // Мгновенно, а не плавно: длинная плавная прокрутка сбивается, когда набор обновляется из базы
      document.getElementById(`card-${focusCardId}`)?.scrollIntoView({ block: "center" });
      setHighlightId(focusCardId);
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("card");
        return next;
      },
      { replace: true },
    );
  }, [focusCardId, collection, setSearchParams]);
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), 2400);
    return () => clearTimeout(timer);
  }, [highlightId]);

  // Где набор сейчас — по силе памяти, как в окне «Учить» и на карточке набора. Раньше здесь было «Выучено» —
  // любое слово с интервалом больше нуля, то есть после одного верного ответа (docs/specs/06-audit-fixes.md, шаг 1)
  const plan = useMemo(() => (collection ? setPlan(collection.cards) : null), [collection]);

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

  // Слова уже разобраны и очищены от дублей в окне импорта (src/utils/importText.ts). Окно закрывается и тост
  // показывается сразу: без сети запись Firestore не завершится, и окно висело бы (шаг 4 плана — для остального)
  const handleImportCards = async (words: ImportedWord[]) => {
    if (!collection || words.length === 0) return;
    const newCards = words.map((w) => createCard(w.word, w.translation, w.explanation, w.example, w.partOfSpeech));
    const updated = { ...collection, cards: [...collection.cards, ...newCards] };
    setCollection(updated);
    setIsImportModalOpen(false);
    success(plural(getLanguageInfo(language).htmlLang, newCards.length, e.importAdded));
    try {
      await updateCollection(updated);
    } catch (err) {
      console.error("Не удалось сохранить импорт", err);
      error(e.saveError);
    }
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
  // Слова есть — главное действие «Учить», чтобы из редактора не приходилось искать, где начать тренировку.
  // Открывает тот же выбор режима, что и «Учить» на карточке набора: одно слово — одно действие
  const openModes = () => setShowModes(true);
  const actions = (compact: boolean) => (
    <>
      {compact ? (
        <>
          {cardCount > 0 && (
            <IconButton variant="soft" label={e.study} onClick={openModes}>
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
            <Button iconLeft={<Play size={18} />} onClick={openModes}>
              {e.study}
            </Button>
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

  // Набора нет в памяти (открыли по ссылке, перезагрузили страницу) — форма страницы до ответа базы
  if (loading && !collection) {
    return (
      <Loading label={t.loading} className="mx-auto max-w-3xl pb-24">
        <div className="mb-10 grid gap-5">
          <div className="grid gap-3">
            <Skeleton className="h-10 w-2/3 rounded-xl sm:h-12" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 w-40 rounded-full" />
            <Skeleton className="h-11 w-28 rounded-full" />
          </div>
        </div>
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} tone="surface" className="h-36 rounded-3xl" />
          ))}
        </div>
      </Loading>
    );
  }

  // Раньше при сбое сети скелетон висел вечно
  if (loadError && !collection) {
    const le = t.words.session.loadError;
    return (
      <UiCard tone="inset" padding="lg" className="mx-auto grid max-w-3xl justify-items-center gap-4 py-14 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-surface text-muted">
          <CloudOff size={26} />
        </span>
        <div className="grid max-w-sm gap-1">
          <Heading size={3}>{le.title}</Heading>
          <Text tone="muted">{le.text}</Text>
        </div>
        <Button iconLeft={<RotateCw size={18} />} onClick={() => setReloadKey((k) => k + 1)}>
          {le.retry}
        </Button>
      </UiCard>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24">
      {/* ── Шапка набора: тает по прокрутке ── */}
      <motion.header className="mb-10 grid gap-5" {...fadeUp(0)}>
        <motion.div style={{ opacity: headerScrollOpacity }} className="grid gap-2">
          <div className="flex items-start gap-1">
            <Heading size="display">{collection?.name}</Heading>
            {collection && (
              <IconButton label={e.rename} onClick={handleRenameCollection} className="mt-0.5 sm:mt-2">
                <Pencil size={20} />
              </IconButton>
            )}
          </div>
          {collection && (
            <Text tone="muted">{plural(getLanguageInfo(language).htmlLang, cardCount, t.words.collectionCard.words)}</Text>
          )}
          {plan && plan.total > 0 && (
            <div className="grid max-w-sm gap-2">
              <SetPlanBar plan={plan} thin />
              <SetPlanLegend plan={plan} />
            </div>
          )}
        </motion.div>
        <div className="flex flex-wrap gap-2">{actions(false)}</div>
      </motion.header>

      {/* ── Закреплённая полоса: появляется, когда заголовок ушёл вверх ── */}
      {collection && (
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

        {!collection || collection.cards.length === 0 ? (
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
                <CardListItem
                  card={card}
                  highlighted={card.id === highlightId}
                  onSave={(cardData) => handleEditCard(card.id, cardData)}
                  onDelete={() => handleDeleteCard(card.id)}
                  onShare={() => setSharing(card)}
                  onReport={collection.preset && card.presetCardId ? () => reportCard(card) : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      <AddCardModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddCard} />
      <ImportCardsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCards}
        existing={collection?.cards ?? []}
        lang={courseNameInline(collection?.courseId ?? courseCodeFromLanguage(collection?.language), getLanguageInfo(language).htmlLang)}
      />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      {collection && (
        <ShareCardModal
          card={sharing}
          courseId={collection.courseId ?? courseCodeFromLanguage(collection.language)}
          onClose={() => setSharing(null)}
        />
      )}
      {collection && <StudyModeModal collection={collection} open={showModes} onClose={() => setShowModes(false)} />}
      <ReportMistakeModal
        target={reporting}
        onClose={() => setReporting(null)}
        onSent={() => {
          setReporting(null);
          success(t.words.ready.report.sent);
        }}
      />
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
