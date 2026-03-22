import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Sparkles, Construction, Clock } from "lucide-react";
import { Collection } from "../../types";
// import { KoloSet } from "../../types/kolo-sets";
import {
  getCollections,
  createCollection,
  deleteCollection,
} from "../../utils/storage";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import CollectionCard from "../../components/cards/CollectionCard";
import CreateCollectionModal from "../../components/CreateCollectionModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
// import KoloSetCard from "../../components/KoloSetCard";
import { motion } from "framer-motion";
import {
  // KOLO_SETS,
  KOLO_SETS_BY_LEVEL,
  CEFR_ORDER,
} from "../../data/kolo-sets";

type Tab = "my" | "kolo";

// --- КРАСИВЫЙ СКЕЛЕТ ЗАГРУЗКИ (Блюр + Мерцание) ---

const CollectionSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div
        key={i}
        className="relative overflow-hidden bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-6 h-48 animate-pulse border border-gray-200 dark:border-gray-700"
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

export default function WordsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("my");
  const [collections, setCollections] = useState<Collection[]>(() => {
    const cached = localStorage.getItem("collections_cache");
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(collections.length === 0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const loaded = await getCollections();
      setCollections(loaded);
      localStorage.setItem("collections_cache", JSON.stringify(loaded));
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (name: string, language: string) => {
    try {
      const newCollection = await createCollection(name, language);
      const updated = [newCollection, ...collections];
      setCollections(updated);
      localStorage.setItem("collections_cache", JSON.stringify(updated));

      setIsCreateModalOpen(false);
      success(`${t.words.toast.createSuccess}: "${name}"`); // Изменено
      navigate(`/collection/${newCollection.id}/edit`);
    } catch (err) {
      error(t.words.toast.createError); // Изменено
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const collectionToDelete = collections.find((c) => c.id === id);
    if (!collectionToDelete) return;

    const confirmed = await confirm({
      title: `${t.delete}?`, // Из common.json
      message: t.words.collectionCard.confirmDelete,
      type: "danger",
      confirmText: t.delete,
      cancelText: t.cancel,
    });

    if (confirmed) {
      const originalCollections = [...collections];
      const filtered = collections.filter((c) => c.id !== id);
      setCollections(filtered);
      localStorage.setItem("collections_cache", JSON.stringify(filtered));

      try {
        await deleteCollection(id);
        success(`"${collectionToDelete.name}" ${t.words.toast.deleteSuccess}`); // Изменено
      } catch (err) {
        setCollections(originalCollections);
        localStorage.setItem(
          "collections_cache",
          JSON.stringify(originalCollections),
        );
        error(t.words.toast.deleteError); // Изменено
      }
    }
  };

  const availableLevels = useMemo(
    () => CEFR_ORDER.filter((lvl) => KOLO_SETS_BY_LEVEL[lvl]?.length > 0),
    [],
  );

  const activeLevel = selectedLevel ?? availableLevels[0] ?? null;
  // const visibleSets: KoloSet[] = useMemo(
  //   () => (activeLevel ? (KOLO_SETS_BY_LEVEL[activeLevel] ?? []) : KOLO_SETS),
  //   [activeLevel],
  // );

  return (
    <div>
      {/* Header */}
      {/* <div className="flex justify-between items-center h-12 mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white">
          {activeTab === "my" ? t.words.title : t.words.koloSets}
        </h2>

        {activeTab === "my" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 active:scale-95 w-12 h-12 md:w-auto md:px-6 md:py-3 rounded-2xl transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span className="hidden md:block font-bold">{t.words.addDeck}</span>
          </button>
        )}
      </div> */}

      <div className="flex justify-between items-center mb-8">
        {/* Tabs */}
        <div
          className="flex justify-center items-center gap-2 p-1 bg-white dark:bg-[#1A1917] rounded-2xl w-fit border 
                     border-transparent border-[#E0DBD3] dark:border-[#2E2C29]"
        >
          <TabButton
            active={activeTab === "my"}
            onClick={() => setActiveTab("my")}
            icon={<BookOpen size={18} />}
            label={t.words.tabs.my}
          />
          <TabButton
            active={activeTab === "kolo"}
            onClick={() => setActiveTab("kolo")}
            icon={<Sparkles size={18} />}
            label={t.words.tabs.kolo}
          />
        </div>
        {activeTab === "my" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex justify-center items-center gap-2 bg-[#FF5733] dark:bg-[#FF6B47] 
                        text-white shadow-lg shadow-orange-500/20 active:scale-95 w-12 h-12 md:w-auto md:px-6 md:py-3 
                        rounded-2xl transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span className="hidden md:block font-bold">{t.words.addDeck}</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <CollectionSkeleton />
        ) : activeTab === "my" ? (
          <>
            {collections.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold mb-2">
                  {t.words.empty.title}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-8">
                  {t.words.empty.description}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-8 py-3 bg-[#FF5733] dark:bg-[#FF6B47] text-white font-bold rounded-2xl"
                >
                  {t.words.empty.button}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onDelete={handleDeleteCollection}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
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
            {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSets.map((set) => (
                <KoloSetCard key={set.id} set={set} />
              ))}
            </div> */}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden w-full p-12 rounded-[2.5rem] bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm flex flex-col items-center text-center group"
            >
              {/* Декоративный фон (размытые круги) */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#FF5733]/5 rounded-full blur-3xl group-hover:bg-[#FF5733]/10 transition-colors duration-700" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors duration-700" />
              </div>

              {/* Иконка с анимацией */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10 w-20 h-20 bg-[#F5F2ED] dark:bg-[#242220] rounded-[2rem] flex items-center justify-center text-[#FF5733] mb-6 border border-[#E0DBD3] dark:border-[#2E2C29]"
              >
                <Construction size={32} strokeWidth={1.5} />
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 text-purple-500"
                >
                  <Sparkles size={20} />
                </motion.div>
              </motion.div>

              {/* Текст */}
              <div className="relative z-10 space-y-3">
                <h3 className="text-3xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
                  Coming <span className="text-[#FF5733]">Soon.</span>
                </h3>

                <p className="text-[#7A756E] dark:text-[#8A867F] max-w-[280px] mx-auto text-sm font-medium leading-relaxed">
                  {/* Можно заменить на ключ из i18n, если он есть */}
                  {t.words.soon}
                </p>
              </div>

              {/* Индикатор прогресса (визуальный) */}
              <div className="relative z-10 mt-8 flex items-center gap-2 px-4 py-2 bg-[#F5F2ED] dark:bg-[#242220] rounded-full border border-[#E0DBD3] dark:border-[#2E2C29]">
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
      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-white shadow-md"
          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {icon}

      {label}
    </button>
  );
}
