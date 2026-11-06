import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Sparkles,
  BookOpen,
  Folder,
  FolderOpen,
  FolderPlus,
  Star,
  ArrowLeft,
  GripVertical,
  X,
  Check,
  Layers,
} from "lucide-react";
import { Badge, Button, Card, Field, Heading, IconButton, Input, Modal, Text, cx } from "../../ui";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { courseName } from "../../courses/languages";
import CourseFlag from "../../components/courses/CourseFlag";
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
import { Folder as FolderType, Collection } from "../../types";
import CollectionCard from "../../components/cards/CollectionCard";
import CreateCollectionModal from "../../components/CreateCollectionModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
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
  useDroppable,
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

// Цвет папки выбирает пользователь и он хранится в её данных, поэтому это значения, а не токены
const FOLDER_COLORS = [
  "#FF5A1F",
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
      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? "bg-accent text-on-accent shadow-md shadow-accent/20"
          : "text-muted hover:bg-inset "
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

const CollectionSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="h-44 animate-pulse rounded-4xl border border-line bg-surface p-5">
        <div className="mb-3 h-6 w-3/4 rounded-lg bg-inset" />
        <div className="h-4 w-1/3 rounded-lg bg-inset" />
      </div>
    ))}
  </div>
);

// ── Окно новой папки ──
function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const { t } = useI18n();
  const f = t.words.folderModal;
  const [name, setName] = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[1]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), color);
    setName("");
    setColor(FOLDER_COLORS[1]);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={f.title} size="sm">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label={f.name} htmlFor="folder-name">
          <Input id="folder-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={f.placeholder} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-medium text-fg">{f.color}</legend>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                aria-pressed={color === c}
                style={{ backgroundColor: c }}
                className={cx(
                  "grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-105",
                  color === c && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                )}
              >
                {color === c && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" fullWidth disabled={!name.trim()}>
          {f.create}
        </Button>
      </form>
    </Modal>
  );
}

// ── Сортируемая карточка (dnd-kit): тянуть можно только за ручку ──
function SortableCollectionCard({
  collection,
  onDelete,
  onToggleFavorite,
  folders,
  onMoveToFolder,
  onMoveToCourse,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  folders: FolderType[];
  onMoveToFolder: (folderId: string | undefined) => void;
  onMoveToCourse: (courseId: string) => void;
}) {
  const { t } = useI18n();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: collection.id });

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
    >
      <CollectionCard
        collection={collection}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        folders={folders}
        onMoveToFolder={onMoveToFolder}
        onMoveToCourse={onMoveToCourse}
        dragHandle={
          <span
            {...attributes}
            {...listeners}
            aria-label={t.words.library.drag}
            title={t.words.library.drag}
            className="grid w-8 shrink-0 cursor-grab touch-none place-items-center rounded-full text-faint transition-colors hover:bg-inset hover:text-muted active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </span>
        }
      />
    </div>
  );
}

// ── Плитка папки, как в Finder: клик открывает, на неё можно перетащить набор ──
function FolderTile({
  folder,
  count,
  onOpen,
  onDelete,
}: {
  folder: FolderType;
  count: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });

  return (
    <div
      ref={setNodeRef}
      onClick={onOpen}
      className={cx(
        "group relative flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors",
        isOver ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/30",
      )}
    >
      {/* Цвет — из данных папки */}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: folder.color + "1F", color: folder.color }}>
        {isOver ? <FolderOpen size={20} /> : <Folder size={20} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">{folder.name}</span>
        <span className="block text-xs text-faint">{count}</span>
      </span>
      <span className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <IconButton
          size="sm"
          label={t.words.library.deleteFolder}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X size={15} />
        </IconButton>
      </span>
    </div>
  );
}

function SectionLabel({ children, count, icon }: { children: React.ReactNode; count: number; icon?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="text-sm font-semibold text-fg">{children}</h2>
      <Badge>{count}</Badge>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WordsPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const lib = t.words.library;
  const setsCount = (n: number) => plural(getLanguageInfo(language).htmlLang, n, lib.setsCount);
  const { user } = useAuth();
  const {
    collections,
    collectionsLoading,
    coursesReady,
    setCollections,
    checkAchievements,
    activeCourse,
    folders,
    createFolder,
    deleteFolder,
    moveCollectionToCourse,
  } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  // Finder-style навигация: null = корень "My Library", иначе — id открытой папки
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
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

  useEffect(() => {
    if (!user) return;
    setOrderedCollections(applyCollectionOrder(collections, user.uid));
  }, [collections, user]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateCollection = async (name: string) => {
    if (!activeCourse) return;
    try {
      const newCollection = await createCollection(name, activeCourse.voice, activeCourse.id);
      // Создаём "внутри" открытой папки — как в Finder, новый файл
      // появляется в текущей директории, а не в корне
      if (openFolderId) {
        await updateCollectionMeta(newCollection, { folderId: openFolderId });
        newCollection.folderId = openFolderId;
      }
      // Функциональный апдейт по полному списку: в контексте лежат наборы всех курсов
      setCollections((prev) => [newCollection, ...prev]);
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
    setCollections((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCollection(id);
      success(`"${target.name}" ${t.words.toast.deleteSuccess}`);
    } catch {
      setCollections((prev) => [target, ...prev]);
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
    if (!over) return;

    // Дропнули на плитку папки — файлим коллекцию в неё (как перетаскивание
    // файла в папку в Finder), а не переупорядочиваем список
    const overId = over.id.toString();
    if (overId.startsWith("folder-")) {
      const folderId = overId.replace("folder-", "");
      handleMoveToFolder(active.id as string, folderId);
      return;
    }

    if (active.id === over.id) return;
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
    setIsCreateFolderOpen(false);
    try {
      await createFolder(name, color);
    } catch {
      error(t.words.toast.createError);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
    } catch {
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

  const handleMoveToCourse = async (collectionId: string, courseId: string) => {
    try {
      await moveCollectionToCourse(collectionId, courseId);
      success(t.courses.moved.replace("{name}", courseName(courseId, getLanguageInfo(language).htmlLang)));
    } catch {
      error(t.courses.moveError);
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
  // рендерим оверлей только при живой ссылке. Ищем по полному списку — драг
  // может стартовать и из корня, и из открытой папки
  const draggedCollection = draggedId
    ? (orderedCollections.find((c) => c.id === draggedId) ?? null)
    : null;

  const availableLevels = useMemo(
    () => CEFR_ORDER.filter((lvl) => KOLO_SETS_BY_LEVEL[lvl]?.length > 0),
    [],
  );
  const activeLevel = selectedLevel ?? availableLevels[0] ?? null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Шапка: заголовок и действия. Вкладка Kolo Sets спрятана флагом KOLO_SETS_ENABLED ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        {/* Заголовок — курс: на этой странице только его наборы и папки */}
        <div className="flex min-w-0 items-center gap-3">
          {activeCourse && <CourseFlag code={activeCourse.id} voice={activeCourse.voice} size="lg" />}
          <div className="grid min-w-0 gap-1">
            <Heading size={1} className="break-words">
              {activeCourse ? courseName(activeCourse.id, getLanguageInfo(language).htmlLang) : t.words.title}
            </Heading>
            {!collectionsLoading && collections.length > 0 && (
              <Text size="sm" tone="muted">
                {setsCount(collections.length)}
              </Text>
            )}
          </div>
        </div>

        {KOLO_SETS_ENABLED && (
          <div className="flex w-full items-stretch gap-1 rounded-2xl border border-line bg-surface p-1 sm:w-fit sm:items-center">
            <TabButton active={activeTab === "my"} onClick={() => setActiveTab("my")} icon={<BookOpen size={16} />} label={t.words.tabs.my} />
            <TabButton active={activeTab === "kolo"} onClick={() => setActiveTab("kolo")} icon={<Sparkles size={16} />} label={t.words.tabs.kolo} />
          </div>
        )}

        {activeTab === "my" && (
          <div className="flex items-center gap-2">
            {!openFolderId && (
              <Button variant="secondary" iconLeft={<FolderPlus size={18} />} onClick={() => setIsCreateFolderOpen(true)} aria-label={lib.newFolder}>
                <span className="hidden sm:inline">{lib.newFolder}</span>
              </Button>
            )}
            <Button iconLeft={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
              {t.words.addDeck}
            </Button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="min-h-100">
        {collectionsLoading || !coursesReady ? (
          <CollectionSkeleton />
        ) : activeTab === "my" ? (
          <>
            {collections.length === 0 && folders.length === 0 ? (
              <Card tone="inset" padding="lg" className="grid justify-items-center gap-4 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-accent-ink">
                  <Layers size={26} />
                </span>
                <div className="grid max-w-sm gap-2">
                  <Heading size={3} as="h2">
                    {t.words.empty.title}
                  </Heading>
                  <Text size="sm" tone="muted">
                    {t.words.empty.description}
                  </Text>
                </div>
                <Button iconLeft={<Plus size={18} />} onClick={() => setIsCreateModalOpen(true)}>
                  {t.words.empty.button}
                </Button>
              </Card>
            ) : openFolderId ? (
              /* ── Folder detail view (Finder-style: opened folder) ── */
              (() => {
                const openFolder = folders.find((f) => f.id === openFolderId);
                const folderCollections = orderedCollections.filter(
                  (c) => c.folderId === openFolderId,
                );
                if (!openFolder) return null;
                return (
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <IconButton variant="surface" label={lib.back} onClick={() => setOpenFolderId(null)}>
                        <ArrowLeft size={18} />
                      </IconButton>
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                        style={{ backgroundColor: openFolder.color + "1F", color: openFolder.color }}
                      >
                        <FolderOpen size={20} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-fg">{openFolder.name}</h2>
                        <p className="text-sm text-muted">{setsCount(folderCollections.length)}</p>
                      </div>
                    </div>

                    {folderCollections.length === 0 ? (
                      <Card tone="inset" className="py-12 text-center">
                        <Text size="sm" tone="muted" className="mx-auto max-w-sm">
                          {lib.emptyFolder}
                        </Text>
                      </Card>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={folderCollections.map((c) => c.id)}
                          strategy={rectSortingStrategy}
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {folderCollections.map((col) => (
                              <SortableCollectionCard
                                key={col.id}
                                collection={col}
                                onDelete={handleDeleteCollection}
                                onToggleFavorite={handleToggleFavorite}
                                folders={folders}
                                onMoveToFolder={(folderId) =>
                                  handleMoveToFolder(col.id, folderId)
                                }
                                onMoveToCourse={(courseId) => handleMoveToCourse(col.id, courseId)}
                              />
                            ))}
                          </div>
                        </SortableContext>
                        <DragOverlay
                          dropAnimation={{ duration: 180, easing: "ease" }}
                        >
                          {draggedCollection ? (
                            <div className="pointer-events-none rotate-1 scale-[1.02] transform-gpu rounded-4xl opacity-95 shadow-2xl">
                              <CollectionCard
                                collection={draggedCollection}
                                onDelete={() => {}}
                                onToggleFavorite={() => {}}
                              />
                            </div>
                          ) : null}
                        </DragOverlay>
                      </DndContext>
                    )}
                  </div>
                );
              })()
            ) : (
              /* ── Root view: folders + favorites + regular, one DndContext
                   so dragging a card onto a folder tile files it there ── */
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div>
                  {/* ── Folders (closed tiles — click opens, drag-drop files) ── */}
                  {folders.length > 0 && (
                    <div className="mb-8">
                      <SectionLabel count={folders.length}>{lib.folders}</SectionLabel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {folders.map((folder) => (
                          <FolderTile
                            key={folder.id}
                            folder={folder}
                            count={
                              orderedCollections.filter(
                                (c) => c.folderId === folder.id,
                              ).length
                            }
                            onOpen={() => setOpenFolderId(folder.id)}
                            onDelete={() => handleDeleteFolder(folder.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Favorites (pinned, outside folders) ── */}
                  {favoriteCollections.length > 0 && (
                    <div className="mb-8">
                      <SectionLabel count={favoriteCollections.length} icon={<Star size={16} className="fill-warning text-warning" />}>
                        {lib.favorites}
                      </SectionLabel>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                            onMoveToCourse={(courseId) => handleMoveToCourse(col.id, courseId)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Regular ungrouped (drag-to-reorder, drag-into-folder) ── */}
                  {regularCollections.length > 0 && (
                    <div>
                      {(folders.length > 0 ||
                        favoriteCollections.length > 0) && (
                        <SectionLabel count={regularCollections.length}>{lib.all}</SectionLabel>
                      )}
                      <SortableContext
                        items={regularCollections.map((c) => c.id)}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                              onMoveToCourse={(courseId) => handleMoveToCourse(col.id, courseId)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  )}
                </div>

                <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
                  {draggedCollection ? (
                    // transform-gpu — форсирует композитный слой (translate3d
                    // вместо translate), иначе повёрнутые скруглённые углы
                    // деки рендерятся с "рваными" артефактами по краям
                    <div className="pointer-events-none rotate-1 scale-[1.02] transform-gpu rounded-4xl opacity-95 shadow-2xl">
                      <CollectionCard
                        collection={draggedCollection}
                        onDelete={() => {}}
                        onToggleFavorite={() => {}}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </>
        ) : (
          /* ── Вкладка Kolo Sets (спрятана флагом KOLO_SETS_ENABLED): уровни и заглушка «Скоро» ── */
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  aria-pressed={lvl === activeLevel}
                  onClick={() => setSelectedLevel(lvl === activeLevel ? null : lvl)}
                  className={cx(
                    "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                    lvl === activeLevel ? "bg-accent text-on-accent" : "bg-inset text-muted hover:text-fg",
                  )}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <Card padding="lg" className="grid justify-items-center gap-3 py-12 text-center">
              <span className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent-ink">
                <Sparkles size={28} />
              </span>
              <Heading size={2}>{t.words.soonTitle}</Heading>
              <Text tone="muted" className="max-w-sm">
                {t.words.soon}
              </Text>
            </Card>
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
