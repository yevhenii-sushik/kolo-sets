import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  EllipsisVertical, Pencil, Trash2,
  ChevronRight, ChevronLeft, Zap, BookOpen, Clock, X, Star,
  Folder, Check, Shield, Link2, Timer,
} from "lucide-react";
import { Collection, Folder as FolderType } from "../../types";
import { isDueCard } from "../../utils/storage";
import { useI18n } from "../../contexts/I18nContext";
import { motion, AnimatePresence } from "framer-motion";

type MenuView = 'main' | 'folders';

interface CollectionCardProps {
  collection: Collection;
  onDelete: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  folders?: FolderType[];
  onMoveToFolder?: (folderId: string | undefined) => void;
}

export default function CollectionCard({
  collection, onDelete, onToggleFavorite, folders = [], onMoveToFolder,
}: CollectionCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<MenuView>('main');
  const [showModeModal, setShowModeModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = () => { setIsMenuOpen(false); setMenuView('main'); };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isEmpty = collection.cards.length === 0;
  const tooFewQuiz = collection.cards.length < 4;
  const total = collection.cards.length;

  const dueToday = collection.cards.filter(isDueCard).length;

  return (
    <>
      {/* ── Deck wrapper: pb-3 makes room for the stacked layers ──
          top-0 + bottom-N (а не bottom-N + h-full) — так высота слоя
          считается браузером как разница между явными top/bottom, а не
          через h-full поверх auto-высоты обёртки. Раньше bottom-1.5 + h-full
          сдвигал bottom вверх, а высота оставалась прежней (full) — из-за
          этого верх слоя вылезал НАД карточкой на те же 6px. Теперь top
          всегда точно 0, слой физически не может торчать сверху.
          Небольшой поворот (origin-bottom) + асимметричные left/right —
          лёгкий веер вместо ровной стопки, виден только там, где слои
          выглядывают из-под карточки снизу. */}
      <div className="relative pb-3 group">

        {/* Layer 3 — глубже, сильнее веер и выглядывает больше */}
        <div className="absolute top-0 bottom-0 left-6 right-2 rounded-4xl bg-[#E3E0D9] dark:bg-[#1C1B19] border border-[#CCC7BF] dark:border-[#232120] -rotate-2 origin-bottom transform-gpu" />
        {/* Layer 2 — ближе, веер слабее */}
        <div className="absolute top-0 bottom-1.5 left-4 right-3 rounded-4xl bg-[#EDEAE4] dark:bg-[#242220] border border-[#D8D3CC] dark:border-[#2A2825] -rotate-1 origin-bottom transform-gpu" />

        {/* ── Main card ──
            overflow-hidden обычно нужен для скруглённых углов деки, но пока
            меню открыто — переключаем на visible, иначе выпадашка,
            открывающаяся вверх от нижней кнопки, обрезается по границе
            карточки. */}
        <div className={`relative z-10 bg-white dark:bg-[#1A1917] rounded-4xl border border-[#E0DBD3] dark:border-[#2E2C29] group-hover:border-[#FF5733]/30 transition-all duration-200 shadow-sm flex flex-col ${isMenuOpen ? 'overflow-visible' : 'overflow-hidden'}`}>

          {/* Top section */}
          <div className="p-4 sm:p-5 pb-3 sm:pb-4 flex flex-col flex-1">

            {/* Controls row */}
            <div className="flex items-center justify-between mb-3 sm:mb-5">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#F5F2ED] dark:bg-[#242220] rounded-full text-[#7A756E] dark:text-[#8A867F]">
                {total} {total === 1 ? 'card' : 'cards'}
              </span>

              <div className="flex items-center gap-0.5">
                {onToggleFavorite && (
                  <button
                    onClick={e => { e.stopPropagation(); onToggleFavorite(collection.id); }}
                    className="p-1.5 rounded-xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                  >
                    <Star
                      size={15}
                      className={collection.isFavorite
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-[#D0CBC4] hover:text-amber-400 transition-colors'}
                    />
                  </button>
                )}
              </div>
            </div>

            {/* Collection name — app's signature italic serif style */}
            <h3 className="text-xl sm:text-2xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight leading-[1.1] line-clamp-2 mb-1">
              {collection.name}<span className="text-[#FF5733]">.</span>
            </h3>

            {/* Due indicator — fixed height h-6, always rendered so card doesn't shift */}
            <div className="h-6 flex items-center mt-1">
              {dueToday > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#FF5733]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF5733] shadow-[0_0_6px_#FF5733]" />
                  {dueToday} {t.words.collectionCard.dueToday}
                </div>
              )}
            </div>
          </div>

          {/* Bottom actions — Study + single overflow menu (Edit / Move to
              folder / Delete). Was Study + a separate Edit pencil that
              duplicated the "Edit" entry already in the ⋮ menu up top;
              now there's exactly one way in, and the ⋮ trigger lives here
              instead of the top-right corner. */}
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex gap-2">
            <button
              onClick={() => !isEmpty && setShowModeModal(true)}
              disabled={isEmpty}
              className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-20"
            >
              {t.words.collectionCard.study}
              <ChevronRight size={13} />
            </button>

            <div className="relative shrink-0" ref={menuRef}>
              <button
                onClick={e => { e.stopPropagation(); setIsMenuOpen(v => !v); }}
                className="w-11 sm:w-12 h-full flex items-center justify-center rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
              >
                <EllipsisVertical size={16} />
              </button>
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    key={menuView}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 bottom-full mb-1.5 w-48 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl shadow-xl z-20 overflow-hidden"
                  >
                    {menuView === 'main' ? (
                      <>
                        <button
                          onClick={() => { navigate(`/collection/${collection.id}/edit`); closeMenu(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                        >
                          <Pencil size={13} /> {t.words.collectionCard.edit}
                        </button>

                        {folders.length > 0 && (
                          <button
                            onClick={() => setMenuView('folders')}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                          >
                            <Folder size={13} />
                            <span className="flex-1 text-left">Move to folder</span>
                            <ChevronRight size={12} className="text-[#B5B0A8]" />
                          </button>
                        )}

                        <div className="h-px bg-[#F0EDE8] dark:bg-[#2E2C29] mx-3" />

                        <button
                          onClick={() => { onDelete(collection.id); closeMenu(); }}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                          <Trash2 size={13} /> {t.delete}
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Folder sub-menu header */}
                        <button
                          onClick={() => setMenuView('main')}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] hover:text-[#FF5733] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors border-b border-[#F0EDE8] dark:border-[#2E2C29]"
                        >
                          <ChevronLeft size={13} /> Folders
                        </button>

                        {/* Remove from folder (only if currently in one) */}
                        {collection.folderId && (
                          <button
                            onClick={() => { onMoveToFolder?.(undefined); closeMenu(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors border-b border-[#F0EDE8] dark:border-[#2E2C29]"
                          >
                            <X size={13} /> No folder
                          </button>
                        )}

                        {/* Folder list */}
                        {folders.map(f => (
                          <button
                            key={f.id}
                            onClick={() => { onMoveToFolder?.(f.id); closeMenu(); }}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors"
                          >
                            <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: f.color }} />
                            <span className="flex-1 text-left truncate text-[#1A1714] dark:text-[#F0EDE8]">
                              {f.name}
                            </span>
                            {f.id === collection.folderId && (
                              <Check size={12} className="text-[#FF5733] shrink-0" />
                            )}
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
      </div>

      {/* ── Study Mode Modal ── */}
      <AnimatePresence>
        {showModeModal && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModeModal(false)}
              className="absolute inset-0 bg-[#1A1714]/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-4xl p-5 sm:p-6 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-2xl"
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5733] mb-1">
                    {t.words.collectionCard.modal.chooseMode}
                  </p>
                  <h3 className="text-xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
                    {collection.name}<span className="text-[#FF5733]">.</span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowModeModal(false)}
                  className="p-2 bg-[#F5F2ED] dark:bg-[#242220] rounded-full text-[#7A756E] hover:rotate-90 transition-transform shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                <ModeButton
                  icon={<Zap size={18} />}
                  label={t.words.collectionCard.modal.flashcards}
                  desc={t.words.collectionCard.modal.flashcardsDesc}
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/flashcards`); }}
                />
                <ModeButton
                  icon={<BookOpen size={18} />}
                  label={t.words.collectionCard.modal.quiz}
                  desc={tooFewQuiz ? t.words.collectionCard.modal.quizNeedsMore : t.words.collectionCard.modal.quizDesc}
                  disabled={tooFewQuiz}
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/quiz`); }}
                />
                <ModeButton
                  icon={<Clock size={18} />}
                  label={`${t.words.collectionCard.modal.studyDue}${dueToday > 0 ? ` (${dueToday})` : ''}`}
                  desc={dueToday === 0 ? t.words.collectionCard.modal.noDue : t.words.collectionCard.modal.studyDueDesc}
                  disabled={dueToday === 0}
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/flashcards?due=1`); }}
                />

                <div className="h-px bg-[#F0EDE8] dark:bg-[#2E2C29] my-1" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] px-1">
                  Game modes
                </p>

                <ModeButton
                  icon={<Timer size={18} />}
                  label="Speed Round"
                  desc={tooFewQuiz ? "Need at least 4 cards" : "60 seconds · streak multiplier"}
                  disabled={tooFewQuiz}
                  accent="orange"
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/speed`); }}
                />
                <ModeButton
                  icon={<Shield size={18} />}
                  label="Survival"
                  desc={tooFewQuiz ? "Need at least 4 cards" : "3 lives · how far can you go?"}
                  disabled={tooFewQuiz}
                  accent="red"
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/survival`); }}
                />
                <ModeButton
                  icon={<Link2 size={18} />}
                  label="Match"
                  desc={tooFewQuiz ? "Need at least 4 cards" : "Connect word with translation"}
                  disabled={tooFewQuiz}
                  accent="green"
                  onClick={() => { setShowModeModal(false); navigate(`/collection/${collection.id}/match`); }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

const ACCENT_COLORS = {
  orange: { border: 'hover:border-[#FF5733]', icon: 'text-[#FF5733]' },
  red:    { border: 'hover:border-red-500',   icon: 'text-red-500' },
  green:  { border: 'hover:border-[#22C55E]', icon: 'text-[#22C55E]' },
};

function ModeButton({
  icon, label, desc, onClick, disabled, accent = 'orange',
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: keyof typeof ACCENT_COLORS;
}) {
  const { border, icon: iconColor } = ACCENT_COLORS[accent];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-2xl bg-[#F5F2ED] dark:bg-[#242220] border border-transparent ${border} transition-all group disabled:opacity-30 disabled:grayscale`}
    >
      <div className={`w-11 h-11 bg-white dark:bg-[#1A1917] rounded-xl flex items-center justify-center ${iconColor} shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
        {icon}
      </div>
      <div className="text-left">
        <p className="font-black text-sm text-[#1A1714] dark:text-[#F0EDE8]">{label}</p>
        <p className="text-[10px] font-medium text-[#7A756E]">{desc}</p>
      </div>
    </button>
  );
}
