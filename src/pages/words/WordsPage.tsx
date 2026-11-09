import { useState, useMemo, useCallback, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  Check,
  ChevronRight,
  Layers,
  Pencil,
  Trash2,
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
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
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

// Цвет папки выбирает пользователь и он хранится в её данных, поэтому это значения, а не токены.
// id — ключ названия цвета для скринридера (folderModal.colors)
const FOLDER_COLORS = [
  { id: "orange", hex: "#FF5A1F" },
  { id: "blue", hex: "#3B82F6" },
  { id: "green", hex: "#22C55E" },
  { id: "purple", hex: "#A855F7" },
  { id: "amber", hex: "#F59E0B" },
  { id: "pink", hex: "#EC4899" },
  { id: "teal", hex: "#14B8A6" },
  { id: "indigo", hex: "#6366F1" },
] as const;
const DEFAULT_FOLDER_COLOR = FOLDER_COLORS[1].hex;

// Цель «убрать из папки» — шапка открытой папки
const ROOT_DROP = "root";

// Сначала — цель прямо под пальцем (плитка папки, шапка папки): closestCenter по центрам промахивается
// мимо широкой шапки. Иначе — ближайшая карточка, чтобы поменять порядок
const collisionDetection: CollisionDetection = (args) => {
  const targets = pointerWithin(args).filter((c) => String(c.id).startsWith("folder-") || c.id === ROOT_DROP);
  return targets.length > 0 ? targets : closestCenter(args);
};

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

// ── Окно папки: новая (folder = null) или изменить название и цвет ──
function FolderModal({
  open,
  folder,
  onClose,
  onSave,
}: {
  open: boolean;
  folder: FolderType | null;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}) {
  const { t } = useI18n();
  const f = t.words.folderModal;
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_FOLDER_COLOR);

  // Каждое открытие — с данными этой папки или с чистого листа
  useEffect(() => {
    if (!open) return;
    setName(folder?.name ?? "");
    setColor(folder?.color ?? DEFAULT_FOLDER_COLOR);
  }, [open, folder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color);
  };

  return (
    <Modal open={open} onClose={onClose} title={folder ? f.editTitle : f.title} size="sm">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <Field label={f.name} htmlFor="folder-name">
          <Input id="folder-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={f.placeholder} />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-medium text-fg">{f.color}</legend>
          <div className="flex flex-wrap gap-2">
            {FOLDER_COLORS.map(({ id, hex }) => (
              <button
                key={id}
                type="button"
                onClick={() => setColor(hex)}
                aria-label={f.colors[id]}
                aria-pressed={color === hex}
                style={{ backgroundColor: hex }}
                className={cx(
                  "grid h-9 w-9 place-items-center rounded-xl transition-transform hover:scale-105",
                  color === hex && "ring-2 ring-fg ring-offset-2 ring-offset-surface",
                )}
              >
                {color === hex && <Check size={16} className="text-white" strokeWidth={3} />}
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" fullWidth disabled={!name.trim()}>
          {folder ? f.save : f.create}
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
  onNewFolder,
  onMoveToCourse,
}: {
  collection: Collection;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  folders: FolderType[];
  onMoveToFolder: (folderId: string | undefined) => void;
  onNewFolder: () => void;
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
        onNewFolder={onNewFolder}
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

// ── Плитка папки, как в Finder: открывает папку по своему адресу (работают «Назад» и возврат после
// тренировки), на неё можно перетащить набор. Изменить и удалить — внутри папки, чтобы не задеть случайно ──
function FolderTile({ folder, count }: { folder: FolderType; count: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });

  return (
    <Link
      ref={setNodeRef}
      to={{ search: `?folder=${folder.id}` }}
      state={{ fromRoot: true }}
      className={cx(
        "flex items-center gap-3 rounded-2xl border p-3 transition-colors focus-visible:outline-2 focus-visible:outline-accent",
        isOver ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/30",
      )}
    >
      {/* Цвет — из данных папки */}
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: folder.color + "1F", color: folder.color }}>
        {isOver ? <FolderOpen size={20} /> : <Folder size={20} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-fg">{folder.name}</span>
        <span className="block text-xs text-muted">{count}</span>
      </span>
      <ChevronRight aria-hidden size={16} className="shrink-0 text-faint" />
    </Link>
  );
}

// ── Шапка открытой папки. Пока тянут набор, она же — цель «убрать из папки», как путь в окне Finder ──
function FolderHeader({
  folder,
  count,
  dragging,
  onBack,
  onEdit,
  onDelete,
}: {
  folder: FolderType;
  count: string;
  dragging: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const lib = t.words.library;
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROP });

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "mb-5 flex items-center gap-3 rounded-2xl outline-offset-4 transition-colors",
        dragging && "outline-2 outline-dashed",
        dragging && (isOver ? "bg-accent-soft outline-accent" : "outline-line"),
      )}
    >
      <IconButton variant="surface" label={lib.back} onClick={onBack}>
        <ArrowLeft size={18} />
      </IconButton>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: folder.color + "1F", color: folder.color }}>
        <FolderOpen size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-lg font-semibold text-fg">{folder.name}</h2>
        <p className="text-sm text-muted">{dragging ? lib.dropOut : count}</p>
      </div>
      {!dragging && (
        <div className="flex shrink-0 items-center">
          <IconButton label={lib.editFolder} onClick={onEdit}>
            <Pencil size={18} />
          </IconButton>
          <IconButton label={lib.deleteFolder} onClick={onDelete}>
            <Trash2 size={18} />
          </IconButton>
        </div>
      )}
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
    updateFolder,
    deleteFolder,
    moveCollectionToCourse,
  } = useData();
  const location = useLocation();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // /words?new=1 — сразу создать набор: из вступления и «Первых шагов» на главной
  const [searchParams, setSearchParams] = useSearchParams();
  const dropParam = useCallback(
    (key: string) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(key);
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;
    setIsCreateModalOpen(true);
    dropParam("new");
  }, [searchParams, dropParam]);
  // Окно папки: новая (folder: null; moveId — сразу положить в неё набор из его меню) или изменить
  const [folderModal, setFolderModal] = useState<{ open: boolean; folder: FolderType | null; moveId?: string }>({
    open: false,
    folder: null,
  });
  // Открытая папка — в адресе (/words?folder=id), как в Finder: «Назад» закрывает её,
  // а из тренировки (navigate(-1)) возвращаешься в неё же
  const openFolderId = searchParams.get("folder");
  const openFolder = openFolderId ? folders.find((f) => f.id === openFolderId) : undefined;
  // Папки нет в этом курсе (переключили курс, удалили папку) — к корню, а не пустой экран
  useEffect(() => {
    if (openFolderId && coursesReady && !openFolder) dropParam("folder");
  }, [openFolderId, openFolder, coursesReady, dropParam]);
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
      if (openFolder) {
        await updateCollectionMeta(newCollection, { folderId: openFolder.id });
        newCollection.folderId = openFolder.id;
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
    // Дропнули на шапку открытой папки — достаём набор из неё
    if (overId === ROOT_DROP) {
      handleMoveToFolder(active.id as string, undefined);
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

  // Вернуться к корню: если папку открыли из корня — шагом назад по истории, иначе заменой адреса,
  // чтобы системная «Назад» потом не открыла папку снова
  const closeFolder = () => {
    if ((location.state as { fromRoot?: boolean } | null)?.fromRoot) navigate(-1);
    else dropParam("folder");
  };

  const handleSaveFolder = async (name: string, color: string) => {
    const target = folderModal;
    setFolderModal((m) => ({ ...m, open: false }));
    try {
      if (target.folder) {
        await updateFolder(target.folder.id, { name, color });
        return;
      }
      const id = await createFolder(name, color);
      if (id && target.moveId) await handleMoveToFolder(target.moveId, id, name);
    } catch {
      error(t.words.toast.createError);
    }
  };

  // Наборы из удалённой папки не пропадают — возвращаются в общий список; об этом и спрашиваем
  const handleDeleteFolder = async (folder: FolderType) => {
    const confirmed = await confirm({
      title: lib.deleteFolderTitle.replace("{name}", folder.name),
      message: lib.deleteFolderText,
      type: "danger",
      confirmText: t.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    closeFolder();
    try {
      await deleteFolder(folder.id);
    } catch {
      error(t.words.toast.deleteError);
    }
  };

  // folderName — для только что созданной папки: её ещё нет в folders этого рендера
  const handleMoveToFolder = async (
    collectionId: string,
    folderId: string | undefined,
    folderName = folders.find((f) => f.id === folderId)?.name,
  ) => {
    const col = collections.find((c) => c.id === collectionId);
    if (!col || col.folderId === folderId) return;
    setCollections((prev) =>
      prev.map((c) => (c.id === collectionId ? { ...c, folderId } : c)),
    );
    try {
      await updateCollectionMeta(col, { folderId });
      // Карточка исчезает с экрана — скажем, куда она делась
      success(folderName ? lib.movedTo.replace("{name}", folderName) : lib.movedOut);
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

  // Избранное — быстрый доступ из корня ко всем наборам со звёздочкой, в том числе лежащим в папках
  const favoriteCollections = useMemo(
    () => orderedCollections.filter((c) => c.isFavorite),
    [orderedCollections],
  );

  const regularCollections = useMemo(
    () => orderedCollections.filter((c) => !c.folderId && !c.isFavorite),
    [orderedCollections],
  );

  const folderCollections = useMemo(
    () => (openFolder ? orderedCollections.filter((c) => c.folderId === openFolder.id) : []),
    [orderedCollections, openFolder],
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

  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of orderedCollections) if (c.folderId) counts.set(c.folderId, (counts.get(c.folderId) ?? 0) + 1);
    return counts;
  }, [orderedCollections]);

  // Одна и та же карточка в корне и в папке: сортируется, переносится в папку, курс или в новую папку
  const renderCard = (col: Collection) => (
    <SortableCollectionCard
      key={col.id}
      collection={col}
      onDelete={handleDeleteCollection}
      onToggleFavorite={handleToggleFavorite}
      folders={folders}
      onMoveToFolder={(folderId) => handleMoveToFolder(col.id, folderId)}
      onNewFolder={() => setFolderModal({ open: true, folder: null, moveId: col.id })}
      onMoveToCourse={(courseId) => handleMoveToCourse(col.id, courseId)}
    />
  );

  const dragOverlay = (
    <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
      {draggedCollection ? (
        // transform-gpu — форсирует композитный слой (translate3d
        // вместо translate), иначе повёрнутые скруглённые углы
        // деки рендерятся с "рваными" артефактами по краям
        <div className="pointer-events-none rotate-1 scale-[1.02] transform-gpu rounded-4xl opacity-95 shadow-2xl">
          <CollectionCard collection={draggedCollection} onDelete={() => {}} onToggleFavorite={() => {}} />
        </div>
      ) : null}
    </DragOverlay>
  );

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
            {!openFolder && (
              <Button variant="secondary" iconLeft={<FolderPlus size={18} />} onClick={() => setFolderModal({ open: true, folder: null })}>
                {lib.newFolder}
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
            ) : openFolder ? (
              /* ── Открытая папка (как в Finder). Шапка — цель «убрать из папки» при перетаскивании ── */
              <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <FolderHeader
                  folder={openFolder}
                  count={setsCount(folderCollections.length)}
                  dragging={draggedId !== null}
                  onBack={closeFolder}
                  onEdit={() => setFolderModal({ open: true, folder: openFolder })}
                  onDelete={() => handleDeleteFolder(openFolder)}
                />
                {folderCollections.length === 0 ? (
                  <Card tone="inset" className="py-12 text-center">
                    <Text size="sm" tone="muted" className="mx-auto max-w-sm">
                      {lib.emptyFolder}
                    </Text>
                  </Card>
                ) : (
                  <SortableContext items={folderCollections.map((c) => c.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{folderCollections.map(renderCard)}</div>
                  </SortableContext>
                )}
                {dragOverlay}
              </DndContext>
            ) : (
              /* ── Корень: папки, избранное и наборы без папки в одном DndContext —
                   карточку можно перетащить на плитку папки ── */
              <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                {folders.length > 0 && (
                  <div className="mb-8">
                    <SectionLabel count={folders.length}>{lib.folders}</SectionLabel>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {folders.map((folder) => (
                        <FolderTile key={folder.id} folder={folder} count={setsCount(folderCounts.get(folder.id) ?? 0)} />
                      ))}
                    </div>
                  </div>
                )}

                {favoriteCollections.length > 0 && (
                  <div className="mb-8">
                    <SectionLabel count={favoriteCollections.length} icon={<Star size={16} className="fill-warning text-warning" />}>
                      {lib.favorites}
                    </SectionLabel>
                    <SortableContext items={favoriteCollections.map((c) => c.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{favoriteCollections.map(renderCard)}</div>
                    </SortableContext>
                  </div>
                )}

                {regularCollections.length > 0 && (
                  <div>
                    {(folders.length > 0 || favoriteCollections.length > 0) && (
                      <SectionLabel count={regularCollections.length}>{lib.all}</SectionLabel>
                    )}
                    <SortableContext items={regularCollections.map((c) => c.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{regularCollections.map(renderCard)}</div>
                    </SortableContext>
                  </div>
                )}
                {dragOverlay}
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
      <FolderModal
        open={folderModal.open}
        folder={folderModal.folder}
        onClose={() => setFolderModal((m) => ({ ...m, open: false }))}
        onSave={handleSaveFolder}
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
