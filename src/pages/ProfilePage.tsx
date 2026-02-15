import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCollections } from '../utils/storage';
import { Collection, UserProfile, AchievementType } from '../types';
import { ALL_ACHIEVEMENTS, getAchievementProgress } from '../utils/achievements';
import {
  getActivityCalendarData,
  formatTime,
  getWeekStats
} from '../utils/progress';
import {
  exportCollectionsToJSON,
  downloadJSON,
  importCollectionsFromJSON,
  readJSONFile
} from '../utils/exportImport';
import { getUserProfile, saveUserCollection } from '../firebase/firestore';
import ActivityCalendar from '../components/ActivityCalendar';
import AchievementCard from '../components/AchievementCard';
import { Download, Upload, Flame, TrendingUp } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileData = await getUserProfile(user.uid) as any;
      const colls = await getCollections();
      
      const total = colls.reduce((sum, coll) => sum + coll.cards.length, 0);
      
      setProfile({
        uid: user.uid,
        displayName: user.displayName || 'User',
        email: user.email || '',
        createdAt: profileData.createdAt?.toDate() || new Date(),
        stats: profileData.stats || {
          totalCards: 0,
          cardsLearned: 0,
          quizzesTaken: 0,
          flashcardSessions: 0,
          totalStudyTime: 0,
          perfectQuizzes: 0
        },
        currentStreak: profileData.currentStreak || 0,
        longestStreak: profileData.longestStreak || 0,
        lastStudyDate: profileData.lastStudyDate?.toDate(),
        achievements: profileData.achievements || [],
        studyHistory: profileData.studyHistory || []
      });
      
      setCollections(colls);
      setTotalCards(total);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = () => {
    const json = exportCollectionsToJSON(collections);
    const filename = `kolo-sets-export-${new Date().toISOString().split('T')[0]}.json`;
    downloadJSON(json, filename);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        const content = await readJSONFile(file);
        const imported = importCollectionsFromJSON(content);
        
        if (!user) return;
        
        for (const coll of imported) {
          await saveUserCollection(user.uid, coll);
        }
        
        alert(`Успешно импортировано ${imported.length} коллекций!`);
        await loadProfile();
      } catch (error: any) {
        alert(`Ошибка импорта: ${error.message}`);
      }
    };
    
    input.click();
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600 dark:text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const weekStats = getWeekStats(profile.studyHistory);
  const calendarData = getActivityCalendarData(profile.studyHistory, 90);

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          Профиль
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {profile.displayName} • {profile.email}
        </p>
      </div>

      {/* Стрик - крупная карточка */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-white/90">
              <Flame size={20} />
              <span className="text-sm font-medium uppercase tracking-wide">Ударный режим</span>
            </div>
            <div className="text-6xl font-bold mb-2">{profile.currentStreak}</div>
            <div className="text-lg text-white/90">дней подряд</div>
            <div className="text-sm text-white/75 mt-2">
              Рекорд: {profile.longestStreak} дней
            </div>
          </div>
          <div className="text-8xl opacity-50">🔥</div>
        </div>
      </div>

      {/* Статистика за неделю */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
          <h2 className="text-2xl font-bold">Статистика за неделю</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Сессий
            </div>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {weekStats.totalSessions}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Карточек изучено
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {weekStats.totalCards}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Время обучения
            </div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400">
              {formatTime(weekStats.totalTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Календарь активности */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">
          Активность (последние 90 дней)
        </h2>
        <ActivityCalendar data={calendarData} />
      </div>

      {/* Общая статистика */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">
          Общая статистика
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {totalCards}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Всего карточек
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {profile.stats.flashcardSessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Сессий флешкарточек
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
              {profile.stats.quizzesTaken}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Пройдено квизов
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {formatTime(profile.stats.totalStudyTime)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Время обучения
            </div>
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Достижения ({profile.achievements.length}/{ALL_ACHIEVEMENTS.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ACHIEVEMENTS.map(achievement => {
            const isUnlocked = profile.achievements.includes(achievement.id);
            const progress = getAchievementProgress(achievement, profile, totalCards);
            
            return (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isUnlocked}
                progress={progress}
              />
            );
          })}
        </div>
      </div>

      {/* Экспорт/Импорт */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">
          Экспорт и импорт
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
          >
            <Download size={20} />
            Экспортировать все коллекции
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
          >
            <Upload size={20} />
            Импортировать коллекции
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
          Экспорт создаст JSON файл со всеми вашими коллекциями. Импорт позволит загрузить коллекции из файла.
        </p>
      </div>
    </div>
  );
}
