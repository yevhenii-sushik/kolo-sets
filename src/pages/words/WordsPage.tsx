import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

import { Collection } from '../../types';
import { KoloSet } from '../../types/kolo-sets';
import { getCollections, createCollection, deleteCollection } from '../../utils/storage';
import { useI18n } from '../../contexts/I18nContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';

import CollectionCard from '../../components/CollectionCard';
import CreateCollectionModal from '../../components/CreateCollectionModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import KoloSetCard from '../../components/KoloSetCard';

import { KOLO_SETS, KOLO_SETS_BY_LEVEL, CEFR_ORDER } from '../../data/kolo-sets';

type Tab = 'my' | 'kolo';

// --- КРАСИВЫЙ СКЕЛЕТ ЗАГРУЗКИ (Блюр + Мерцание) ---
const CollectionSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <div key={i} className="relative overflow-hidden bg-gray-100 dark:bg-gray-800/50 rounded-3xl p-6 h-48 animate-pulse border border-gray-200 dark:border-gray-700">
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

  const [activeTab, setActiveTab] = useState<Tab>('my');
  
  // Инициализация из кэша для мгновенного старта
  const [collections, setCollections] = useState<Collection[]>(() => {
    const cached = localStorage.getItem('collections_cache');
    if (!cached) return [];
    try {
      return JSON.parse(cached);
    } catch { return []; }
  });
  
  // Показываем загрузку только если кэш пуст
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
      // Сохраняем актуальные данные в кэш
      localStorage.setItem('collections_cache', JSON.stringify(loaded));
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (name: string, language: string) => {
    try {
      const newCollection = await createCollection(name, language);
      // Оптимистичное обновление: добавляем в список сразу
      const updated = [newCollection, ...collections];
      setCollections(updated);
      localStorage.setItem('collections_cache', JSON.stringify(updated));
      
      setIsCreateModalOpen(false);
      success(`${t.home.createDeck} "${name}"`);
      navigate(`/collection/${newCollection.id}/edit`);
    } catch (err) {
      error('Error creating collection');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const collectionToDelete = collections.find(c => c.id === id);
    if (!collectionToDelete) return;

    const confirmed = await confirm({
      title: `${t.delete}?`,
      message: t.collectionCard.confirmDelete,
      type: 'danger',
      confirmText: t.delete,
      cancelText: t.cancel,
    });

    if (confirmed) {
      const originalCollections = [...collections];
      // Оптимистичное удаление: убираем из UI мгновенно
      const filtered = collections.filter(c => c.id !== id);
      setCollections(filtered);
      localStorage.setItem('collections_cache', JSON.stringify(filtered));

      try {
        await deleteCollection(id);
        success(`"${collectionToDelete.name}" ${t.delete.toLowerCase()}`);
      } catch (err) {
        // Если ошибка — возвращаем как было
        setCollections(originalCollections);
        localStorage.setItem('collections_cache', JSON.stringify(originalCollections));
        error('Delete failed');
      }
    }
  };

  const availableLevels = useMemo(() => 
    CEFR_ORDER.filter(lvl => KOLO_SETS_BY_LEVEL[lvl]?.length > 0), 
  []);

  const activeLevel = selectedLevel ?? availableLevels[0] ?? null;
  const visibleSets: KoloSet[] = useMemo(() => 
    activeLevel ? (KOLO_SETS_BY_LEVEL[activeLevel] ?? []) : KOLO_SETS,
  [activeLevel]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center h-12 mb-8">
        <h2 className="text-3xl font-black text-gray-900 dark:text-white">
          {activeTab === 'my' ? t.home.myDecks : 'Kolo Sets'}
        </h2>

        {activeTab === 'my' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 active:scale-95 w-12 h-12 md:w-auto md:px-6 md:py-3 rounded-2xl transition-all"
          >
            <Plus size={24} strokeWidth={2.5} />
            <span className="hidden md:block font-bold">{t.home.addDeck}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-2xl w-fit border border-transparent dark:border-gray-700">
        <TabButton
          active={activeTab === 'my'}
          onClick={() => setActiveTab('my')}
          icon={<BookOpen size={18} />}
          label={t.home.myDecks}
        />
        <TabButton
          active={activeTab === 'kolo'}
          onClick={() => setActiveTab('kolo')}
          icon={<Sparkles size={18} />}
          label="Kolo Sets"
        />
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <CollectionSkeleton />
        ) : activeTab === 'my' ? (
          <>
            {collections.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold mb-2">{t.home.noDecks}</h3>
                <p className="text-gray-500 max-w-xs mx-auto mb-8">{t.home.noDecksDescription}</p>
                <button onClick={() => setIsCreateModalOpen(true)} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-2xl">{t.home.createDeck}</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map(collection => (
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
                {availableLevels.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl === activeLevel ? null : lvl)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      lvl === activeLevel
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleSets.map(set => (
                  <KoloSetCard key={set.id} set={set} />
                ))}
              </div>
          </div>
        )}
      </div>

      <CreateCollectionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCollection}
      />
      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-white shadow-md'
          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}