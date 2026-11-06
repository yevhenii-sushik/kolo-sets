import { useState, useRef, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  EllipsisVertical,
  Folder,
  Link2,
  Pencil,
  Shield,
  Star,
  Timer,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Collection, Folder as FolderType } from "../../types";
import { isDueCard } from "../../utils/storage";
import { useI18n } from "../../contexts/I18nContext";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Button, IconButton, Modal, cx } from "../../ui";

type MenuView = "main" | "folders";

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  folders?: FolderType[];
  onMoveToFolder?: (folderId: string | undefined) => void;
  dragHandle?: ReactNode; // ручка перетаскивания — слева от «Учить» (передаёт сортируемая обёртка)
}

const MENU_ITEM = "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors";

export default function CollectionCard({ collection, onDelete, onToggleFavorite, folders = [], onMoveToFolder, dragHandle }: CollectionCardProps) {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const c = t.words.collectionCard;
  const m = c.modal;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>("main");
  const [showModeModal, setShowModeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setMenuView("main");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const total = collection.cards.length;
  const isEmpty = total === 0;
  const tooFewQuiz = total < 4;
  const dueToday = collection.cards.filter(isDueCard).length;

  const start = (path: string) => {
    setShowModeModal(false);
    navigate(`/collection/${collection.id}/${path}`);
  };

  return (
    <>
      {/* Пока меню открыто, карточка не обрезает содержимое — выпадашка вверх не режется по краю */}
      <div
        className={cx(
          "flex h-full flex-col gap-5 rounded-4xl border border-line bg-surface p-5 transition-colors hover:border-accent/30",
          isMenuOpen ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold leading-tight text-fg line-clamp-2">{collection.name}</h3>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              {plural(getLanguageInfo(language).htmlLang, total, c.words)}
              {dueToday > 0 && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-accent-ink">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {dueToday} {c.dueToday}
                </span>
              )}
            </p>
          </div>
          {onToggleFavorite && (
            <IconButton
              size="sm"
              label={collection.isFavorite ? c.favoriteRemove : c.favoriteAdd}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(collection.id);
              }}
              className="-mr-1.5 -mt-1.5"
            >
              <Star size={17} className={collection.isFavorite ? "fill-warning text-warning" : ""} />
            </IconButton>
          )}
        </div>

        {/* Учить + меню (изменить / переместить в папку / удалить) */}
        <div className="mt-auto flex gap-2">
          {dragHandle}
          <Button variant="inverse" fullWidth disabled={isEmpty} onClick={() => setShowModeModal(true)} iconRight={<ChevronRight size={16} />}>
            {c.study}
          </Button>

          <div className="relative shrink-0" ref={menuRef}>
            <IconButton
              variant="surface"
              label={c.actions}
              aria-expanded={isMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen((v) => !v);
              }}
            >
              <EllipsisVertical size={18} />
            </IconButton>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key={menuView}
                  initial={{ opacity: 0, scale: 0.96, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-xl"
                >
                  {menuView === "main" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/collection/${collection.id}/edit`);
                          closeMenu();
                        }}
                        className={cx(MENU_ITEM, "text-fg hover:bg-inset")}
                      >
                        <Pencil size={16} className="text-muted" /> {c.edit}
                      </button>
                      {folders.length > 0 && (
                        <button type="button" onClick={() => setMenuView("folders")} className={cx(MENU_ITEM, "text-fg hover:bg-inset")}>
                          <Folder size={16} className="text-muted" />
                          <span className="flex-1 text-left">{c.moveTo}</span>
                          <ChevronRight size={14} className="text-faint" />
                        </button>
                      )}
                      <div className="mx-3 my-1 h-px bg-line" />
                      <button
                        type="button"
                        onClick={() => {
                          onDelete(collection.id);
                          closeMenu();
                        }}
                        className={cx(MENU_ITEM, "text-danger hover:bg-danger-soft")}
                      >
                        <Trash2 size={16} /> {t.delete}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setMenuView("main")}
                        className={cx(MENU_ITEM, "border-b border-line pb-3 text-muted hover:text-fg")}
                      >
                        <ChevronLeft size={16} /> {c.moveTo}
                      </button>
                      {collection.folderId && (
                        <button
                          type="button"
                          onClick={() => {
                            onMoveToFolder?.(undefined);
                            closeMenu();
                          }}
                          className={cx(MENU_ITEM, "text-fg hover:bg-inset")}
                        >
                          <X size={16} className="text-muted" /> {c.noFolder}
                        </button>
                      )}
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            onMoveToFolder?.(f.id);
                            closeMenu();
                          }}
                          className={cx(MENU_ITEM, "text-fg hover:bg-inset")}
                        >
                          {/* Цвет папки выбирает пользователь — он хранится в данных, не в токенах */}
                          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: f.color }} />
                          <span className="flex-1 truncate text-left">{f.name}</span>
                          {f.id === collection.folderId && <Check size={15} className="shrink-0 text-accent-ink" />}
                        </button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Выбор режима ── */}
      <Modal open={showModeModal} onClose={() => setShowModeModal(false)} title={collection.name} size="sm">
        <p className="-mt-2 mb-4 text-sm text-muted">{m.chooseMode}</p>
        <div className="grid gap-2">
          <ModeButton icon={<Zap size={18} />} label={m.flashcards} desc={m.flashcardsDesc} onClick={() => start("flashcards")} />
          <ModeButton
            icon={<BookOpen size={18} />}
            label={m.quiz}
            desc={tooFewQuiz ? m.quizNeedsMore : m.quizDesc}
            disabled={tooFewQuiz}
            onClick={() => start("quiz")}
          />
          <ModeButton
            icon={<Clock size={18} />}
            label={dueToday > 0 ? `${m.studyDue} · ${dueToday}` : m.studyDue}
            desc={dueToday === 0 ? m.noDue : m.studyDueDesc}
            disabled={dueToday === 0}
            onClick={() => start("flashcards?due=1")}
          />

          <p className="mt-3 px-1 text-sm font-semibold text-fg">{m.games}</p>
          <ModeButton
            icon={<Timer size={18} />}
            label={m.speed}
            desc={tooFewQuiz ? m.needMore : m.speedDesc}
            disabled={tooFewQuiz}
            onClick={() => start("speed")}
          />
          <ModeButton
            icon={<Shield size={18} />}
            label={m.survival}
            desc={tooFewQuiz ? m.needMore : m.survivalDesc}
            disabled={tooFewQuiz}
            onClick={() => start("survival")}
          />
          <ModeButton
            icon={<Link2 size={18} />}
            label={m.match}
            desc={tooFewQuiz ? m.needMore : m.matchDesc}
            disabled={tooFewQuiz}
            onClick={() => start("match")}
          />
        </div>
      </Modal>
    </>
  );
}

function ModeButton({ icon, label, desc, onClick, disabled }: { icon: ReactNode; label: string; desc: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-inset p-3 text-left transition-colors hover:border-accent/40 disabled:pointer-events-none disabled:opacity-45"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-accent-ink">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{label}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </button>
  );
}
