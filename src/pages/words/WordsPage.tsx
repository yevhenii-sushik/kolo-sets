import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  BookOpen,
  Construction,
  Clock,
  Folder,
  FolderOpen,
  FolderPlus,
  Star,
  ChevronDown,
  ChevronRight as ChevRight,
  GripHorizontal,
  X,
  Check,
} from "lucide-react";
import {
  createCollection,
  deleteCollection,
  updateCollectionMeta,
  applyCollectionOrder,
  saveCollectionOrder,
} from "../../utils/storage";
import { useData } from "../../contexts/DataContext";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { saveFolders, getUserFolders } from "../../firebase/firestore";
import { Folder as FolderType, Collection } from "../../types";
import CollectionCard from "../../components/cards/CollectionCard";
import CreateCollectionModal from "../../components/CreateCollectionModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KOLO_SETS_BY_LEVEL, CEFR_ORDER } from "../../data/kolo-sets";

type Tab = "my" | "kolo";

// Kolo Sets (готовые наборы) отложены на неопределённый срок — прячем
// переключатель вкладок целиком, пока фича не готова. Один флаг вместо
// закомментированного JSX: легко включить обратно (true), и ничего не
// ломается из-за "неиспользуемых" импортов/стейта, как было в прошлый раз.
const KOLO_SETS_ENABLED = false;

const FOLDER_COLORS = [
  "#FF5733",
  "#3B82F6",
  "#22C55E",
  "#A855F7",
  "#F59E0B",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

// flex-1 на мобилке — оба таба ровно делят ширину строки (один слева,
// другой справа), sm:flex-initial возвращает компактный wrap-to-content
// на десктопе, где переключатель не обязан быть на всю ширину.
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-[#FF5733] text-white shadow-md shadow-orange-500/20"
          : "text-[#7A756E] dark:text-[#8A867F] hover:bg-[#F5F2ED] dark:hover:bg-[#242220]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const CollectionSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="relative overflow-hidden bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-4 sm:p-6 h-44 sm:h-48 animate-pulse border border-gray-200 dark:border-gray-700"
      >
        <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
        <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8" />
        <div className="flex justify-between items-center mt-auto">
          <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

// ── Create Folder Modal ───────────────────────────────────────────────────────
function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[1]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), color);
    setName("");
    setColor(FOLDER_COLORS[1]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A1714]/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-6 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl"
          >
            <div className="flex justify-between items-center mb-5 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-black text-[#1A1714] dark:text-[#F0EDE8]">
                New folder
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E]"
              >
                <X size={16} />
              </button>
            </div>

            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Folder name…"
              className="w-full px-4 py-3 rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] text-[#1A1714] dark:text-[#F0EDE8] font-bold placeholder-[#B5B0A8] outline-none focus:ring-2 focus:ring-[#FF5733]/30 mb-4 sm:mb-5"
            />

            <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] mb-3">
              Color
            </p>
            <div className="flex gap-2 flex-wrap mb-5 sm:mb-6">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className="w-8 h-8 rounded-xl transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
                >
                  {color === c && (
                    <Check size={14} className="text-white" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!name.trim()}
              className="w-full py-3.5 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-95 disabled:opacity-40"
            >
              Create folder
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ── Sortable collection card (dnd-kit) ───────────────────────────────────────
function SortableCollectionCard({
  collection,
  onDelete,
  onToggleFavorite,
  folders,
  onMoveToFolder,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  folders: FolderType[];
  onMoveToFolder: (folderId: string | undefined) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: collection.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        position: "relative",
        zIndex: isDragging ? 1 : "auto",
      }}
      className="relative group/drag"
    >
      {/* Grip handle — only drag trigger. Центр по горизонтали: там пустой
          зазор между бейджем "N cards" (слева) и избранным/меню (справа),
          поэтому ничего не перекрывает на десктопе. На мобиле всегда
          видимый (opacity-70) — hover, на который раньше был завязан
          показ, на тач-экранах в принципе не срабатывает. */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 opacity-70 sm:opacity-0 sm:group-hover/drag:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1.5 rounded-xl bg-white/80 dark:bg-[#1A1917]/80 text-[#B5B0A8] touch-none"
      >
        <GripHorizontal size={14} />
      </div>
      <CollectionCard
        collection={collection}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        folders={folders}
        onMoveToFolder={onMoveToFolder}
      />
    </div>
  );
}

// ── Folder section ────────────────────────────────────────────────────────────
function FolderSection({
  folder,
  collections,
  folders,
  onDelete,
  onToggleFavorite,
  onDeleteFolder,
  onMoveToFolder,
}: {
  folder: FolderType;
  collections: Collection[];
  folders: FolderType[];
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (collectionId: string, folderId: string | undefined) => void;
}) {
  const [open, setOpen] = useState(true);

  if (collections.length === 0) return null;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-3 mb-3 group">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: folder.color + "22",
              color: folder.color,
            }}
          >
            {open ? <FolderOpen size={14} /> : <Folder size={14} />}
          </div>
          <span
            className="text-[13px] font-black uppercase tracking-widest truncate"
            style={{ color: folder.color }}
          >
            {folder.name}
          </span>
          <span className="text-[10px] font-bold text-[#B5B0A8]">
            {collections.length}
          </span>
          {open ? (
            <ChevronDown
              size={13}
              className="text-[#B5B0A8] ml-auto shrink-0"
            />
          ) : (
            <ChevRight size={13} className="text-[#B5B0A8] ml-auto shrink-0" />
          )}
        </button>
        <button
          onClick={() => onDeleteFolder(folder.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-[#D0CBC4] hover:text-red-400 shrink-0"
          title="Delete folder"
        >
          <X size={14} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pl-2 border-l-2 ml-3"
              style={{ borderColor: folder.color + "44" }}
            >
              {collections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                  folders={folders}
                  onMoveToFolder={(folderId) =>
                    onMoveToFolder(col.id, folderId)
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WordsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user } = useAuth();
  const { collections, collectionsLoading, setCollections, checkAchievements } =
    useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderType[]>([]);
  // Пока папки не загружены, держим скелетон — иначе после сборников
  // рендерится грид БЕЗ заголовка "All collections" (папок ещё нет), а через
  // мгновение, когда Firestore ответит, заголовок резко впрыгивает
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [orderedCollections, setOrderedCollections] = useState<Collection[]>(
    [],
  );
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  // Load folders from Firestore + apply saved order
  useEffect(() => {
    if (!user) {
      setFoldersLoading(false);
      return;
    }
    setFoldersLoading(true);
    getUserFolders(user.uid)
      .then(setFolders)
      .catch(() => {})
      .finally(() => setFoldersLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setOrderedCollections(applyCollectionOrder(collections, user.uid));
  }, [collections, user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateCollection = async (name: string, language: string) => {
    try {
      const newCollection = await createCollection(name, language);
      const updated = [newCollection, ...collections];
      setCollections(updated);
      setIsCreateModalOpen(false);
      success(`${t.words.toast.createSuccess}: "${name}"`);
      checkAchievements();
      navigate(`/collection/${newCollection.id}/edit`);
    } catch {
      error(t.words.toast.createError);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const target = collections.find((c) => c.id === id);
    if (!target) return;
    const confirmed = await confirm({
      title: `${t.delete}?`,
      message: t.words.collectionCard.confirmDelete,
      type: "danger",
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    const rollback = [...collections];
    setCollections(collections.filter((c) => c.id !== id));
    try {
      await deleteCollection(id);
      success(`"${target.name}" ${t.words.toast.deleteSuccess}`);
    } catch {
      setCollections(rollback);
      error(t.words.toast.deleteError);
    }
  };

  const handleToggleFavorite = useCallback(
    async (id: string) => {
      const col = collections.find((c) => c.id === id);
      if (!col) return;
      const next = !col.isFavorite;
      // Функциональные апдейты: и оптимистичное обновление, и откат трогают
      // только эту коллекцию — параллельные изменения других не затираются
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFavorite: next } : c)),
      );
      try {
        await updateCollectionMeta(col, { isFavorite: next });
      } catch {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, isFavorite: col.isFavorite } : c,
          ),
        );
        error(t.words.toast.deleteError);
      }
    },
    [collections, setCollections, error, t],
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggedId(active.id as string);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggedId(null);
    if (!over || active.id === over.id) return;
    // Перемещаем внутри ПОЛНОГО упорядоченного списка: относительный порядок
    // избранных и папочных коллекций сохраняется, ничего не уезжает наверх
    const oldIdx = orderedCollections.findIndex((c) => c.id === active.id);
    const newIdx = orderedCollections.findIndex((c) => c.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = arrayMove(orderedCollections, oldIdx, newIdx);
    setOrderedCollections(newOrder);
    if (user)
      saveCollectionOrder(
        user.uid,
        newOrder.map((c) => c.id),
      );
  };

  const handleCreateFolder = async (name: string, color: string) => {
    if (!user) return;
    const newFolder: FolderType = {
      id: crypto.randomUUID(),
      name,
      color,
      createdAt: new Date(),
    };
    const updated = [...folders, newFolder];
    setFolders(updated);
    setIsCreateFolderOpen(false);
    try {
      await saveFolders(user.uid, updated);
    } catch {
      setFolders(folders);
      error(t.words.toast.createError);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;
    // Move all collections out of this folder
    const affected = collections.filter((c) => c.folderId === folderId);
    setCollections((prev) =>
      prev.map((c) =>
        c.folderId === folderId ? { ...c, folderId: undefined } : c,
      ),
    );
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    setFolders(updatedFolders);
    const results = await Promise.allSettled([
      saveFolders(user.uid, updatedFolders),
      ...affected.map((c) => updateCollectionMeta(c, { folderId: undefined })),
    ]);
    if (results.some((r) => r.status === "rejected")) {
      error(t.words.toast.deleteError);
    }
  };

  const handleMoveToFolder = async (
    collectionId: string,
    folderId: string | undefined,
  ) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, folderId } : c)),
    );
    try {
      await updateCollectionMeta(col, { folderId });
    } catch {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === collectionId ? { ...c, folderId: col.folderId } : c,
        ),
      );
      error(t.words.toast.createError);
    }
  };

  // ── Derived state ────────────────────────────────────────────────────────────

  const ungroupedCollections = useMemo(
    () => orderedCollections.filter((c) => !c.folderId),
    [orderedCollections],
  );

  const favoriteCollections = useMemo(
    () => ungroupedCollections.filter((c) => c.isFavorite),
    [ungroupedCollections],
  );

  const regularCollections = useMemo(
    () => ungroupedCollections.filter((c) => !c.isFavorite),
    [ungroupedCollections],
  );

  // Может стать undefined, если коллекции обновятся посреди перетаскивания —
  // рендерим оверлей только при живой ссылке
  const draggedCollection = draggedId
    ? (regularCollections.find((c) => c.id === draggedId) ?? null)
    : null;

  const availableLevels = useMemo(
    () => CEFR_ORDER.filter((lvl) => KOLO_SETS_BY_LEVEL[lvl]?.length > 0),
    [],
  );
  const activeLevel = selectedLevel ?? availableLevels[0] ?? null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Tab bar + action buttons ──
          Kolo Sets отложены — переключатель вкладок скрыт флагом
          KOLO_SETS_ENABLED, activeTab остаётся на "my" сам по себе (нет
          кнопки, чтобы переключить на "kolo"). На мобилке — колонка:
          переключатель на всю ширину (Words слева, Sets справа, ровно
          пополам), кнопки действий отдельной строкой под ним. На
          десктопе — одна строка. */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 mb-6 sm:mb-8 ${
          KOLO_SETS_ENABLED ? "sm:justify-between" : "sm:justify-end"
        }`}
      >
        {KOLO_SETS_ENABLED && (
          <div className="flex items-stretch sm:items-center gap-1 p-1 w-full sm:w-fit bg-white dark:bg-[#1A1917] rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29]">
            <TabButton
              active={activeTab === "my"}
              onClick={() => setActiveTab("my")}
              icon={<BookOpen size={16} />}
              label={t.words.tabs.my}
            />
            <TabButton
              active={activeTab === "kolo"}
              onClick={() => setActiveTab("kolo")}
              icon={<Sparkles size={16} />}
              label={t.words.tabs.kolo}
            />
          </div>
        )}

        {activeTab === "my" && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsCreateFolderOpen(true)}
              title="New folder"
              className="flex items-center justify-center gap-2 w-12 h-12 md:w-auto md:px-4 md:py-3 rounded-2xl border-2 border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] dark:text-[#8A867F] hover:border-[#FF5733]/40 hover:text-[#FF5733] transition-all"
            >
              <FolderPlus size={20} />
              <span className="hidden md:block font-bold text-sm">
                New folder
              </span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex justify-center items-center gap-2 bg-[#FF5733] dark:bg-[#FF6B47] text-white shadow-lg shadow-orange-500/20 active:scale-95 w-12 h-12 md:w-auto md:px-6 md:py-3 rounded-2xl transition-all"
            >
              <Plus size={24} strokeWidth={2.5} />
              <span className="hidden md:block font-bold">
                {t.words.addDeck}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="min-h-100">
        {collectionsLoading || foldersLoading ? (
          <CollectionSkeleton />
        ) : activeTab === "my" ? (
          <>
            {collections.length === 0 ? (
              <div className="text-center py-12 sm:py-20 px-4 bg-gray-50 dark:bg-gray-800/20 rounded-3xl sm:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-5xl sm:text-6xl mb-4">📚</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  {t.words.empty.title}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-6 sm:mb-8">
                  {t.words.empty.description}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-3 bg-[#FF5733] text-white font-bold rounded-2xl"
                >
                  {t.words.empty.button}
                </button>
              </div>
            ) : (
              <div>
                {/* ── Folder sections ── */}
                {folders.map((folder) => (
                  <FolderSection
                    key={folder.id}
                    folder={folder}
                    collections={orderedCollections.filter(
                      (c) => c.folderId === folder.id,
                    )}
                    folders={folders}
                    onDelete={handleDeleteCollection}
                    onToggleFavorite={handleToggleFavorite}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveToFolder={handleMoveToFolder}
                  />
                ))}

                {/* ── Favorites (pinned, outside folders) ── */}
                {favoriteCollections.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Star
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                      <span className="text-[13px] font-black uppercase tracking-widest text-amber-500">
                        Favorites
                      </span>
                      <span className="text-[10px] font-bold text-[#B5B0A8]">
                        {favoriteCollections.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {favoriteCollections.map((col) => (
                        <CollectionCard
                          key={col.id}
                          collection={col}
                          onDelete={handleDeleteCollection}
                          onToggleFavorite={handleToggleFavorite}
                          folders={folders}
                          onMoveToFolder={(folderId) =>
                            handleMoveToFolder(col.id, folderId)
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Regular ungrouped (drag-to-reorder) ── */}
                {regularCollections.length > 0 && (
                  <div>
                    {(folders.length > 0 || favoriteCollections.length > 0) && (
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="text-[13px] font-black uppercase tracking-widest text-[#B5B0A8]">
                          All collections
                        </span>
                        <span className="text-[10px] font-bold text-[#B5B0A8]">
                          {regularCollections.length}
                        </span>
                      </div>
                    )}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={regularCollections.map((c) => c.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {regularCollections.map((col) => (
                            <SortableCollectionCard
                              key={col.id}
                              collection={col}
                              onDelete={handleDeleteCollection}
                              onToggleFavorite={handleToggleFavorite}
                              folders={folders}
                              onMoveToFolder={(folderId) =>
                                handleMoveToFolder(col.id, folderId)
                              }
                            />
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay
                        dropAnimation={{ duration: 180, easing: "ease" }}
                      >
                        {draggedCollection ? (
                          // transform-gpu — форсирует композитный слой (translate3d
                          // вместо translate), иначе повёрнутые скруглённые углы
                          // деки рендерятся с "рваными" артефактами по краям
                          <div className="rotate-1 scale-105 transform-gpu shadow-2xl shadow-black/20 opacity-95 pointer-events-none">
                            <CollectionCard
                              collection={draggedCollection}
                              onDelete={() => {}}
                              onToggleFavorite={() => {}}
                            />
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Kolo Sets tab (unchanged) ── */
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() =>
                    setSelectedLevel(lvl === activeLevel ? null : lvl)
                  }
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    lvl === activeLevel
                      ? "bg-[#FF5733] dark:bg-[#FF6B47] text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden w-full p-6 sm:p-12 rounded-3xl sm:rounded-4xl bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm flex flex-col items-center text-center group"
            >
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -right-10 w-28 h-28 sm:w-40 sm:h-40 bg-[#FF5733]/5 rounded-full blur-3xl group-hover:bg-[#FF5733]/10 transition-colors duration-700" />
                <div className="absolute -bottom-10 -left-10 w-28 h-28 sm:w-40 sm:h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700" />
              </div>
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.05, 1] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-[#F5F2ED] dark:bg-[#242220] rounded-3xl sm:rounded-4xl flex items-center justify-center text-[#FF5733] mb-5 sm:mb-6 border border-[#E0DBD3] dark:border-[#2E2C29]"
              >
                <Construction size={26} strokeWidth={1.5} className="sm:hidden" />
                <Construction size={32} strokeWidth={1.5} className="hidden sm:block" />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 text-purple-500"
                >
                  <Sparkles size={20} />
                </motion.div>
              </motion.div>
              <div className="relative z-10 space-y-2 sm:space-y-3">
                <h3 className="text-2xl sm:text-3xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
                  Coming <span className="text-[#FF5733]">Soon.</span>
                </h3>
                <p className="text-[#7A756E] dark:text-[#8A867F] max-w-70 mx-auto text-sm font-medium leading-relaxed">
                  {t.words.soon}
                </p>
              </div>
              <div className="relative z-10 mt-6 sm:mt-8 flex items-center gap-2 px-4 py-2 bg-[#F5F2ED] dark:bg-[#242220] rounded-full border border-[#E0DBD3] dark:border-[#2E2C29]">
                <Clock size={14} className="text-[#B5B0A8]" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#B5B0A8]">
                  In Development • 2026
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCollection}
      />
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}
