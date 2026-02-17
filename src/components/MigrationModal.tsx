import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCollections } from '../utils/storage';
import { syncCollectionsToFirestore } from '../firebase/firestore';
import { Collection } from '../types';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MigrationModal({ isOpen, onClose }: MigrationModalProps) {
  const { user } = useAuth();
  const [localCollections, setLocalCollections] = useState<Collection[] | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLocalCollections();
    }
  }, [isOpen]);

  const loadLocalCollections = async () => {
    try {
      const collections = await getCollections();
      setLocalCollections(collections);
    } catch (err) {
      console.error('Error loading local collections:', err);
      setError('Failed to load local collections');
    }
  };

  const handleSync = async () => {
    if (!user || !localCollections || localCollections.length === 0) return;

    setIsSyncing(true);
    setError(null);

    try {
      await syncCollectionsToFirestore(user.uid, localCollections);
      onClose();
    } catch (err) {
      console.error('Error syncing collections:', err);
      setError('Failed to sync collections. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  if (localCollections === null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-xl text-gray-600 dark:text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (localCollections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No Local Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any local collections to sync.
          </p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Sync Local Data
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Found {localCollections.length} local collection{localCollections.length !== 1 ? 's' : ''}.
          Would you like to sync them to the cloud?
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <ul className="space-y-2">
            {localCollections.map((collection) => (
              <li key={collection.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="font-medium">{collection.name}</span>
                <span className="text-gray-500">({collection.cards.length} cards)</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors shadow-md disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
