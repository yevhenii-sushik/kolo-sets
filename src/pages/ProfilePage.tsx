import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getCollections } from '../utils/storage';
import { UserProfile } from '../types';
import { ALL_ACHIEVEMENTS, getAchievementProgress } from '../utils/achievements';
import {
  getActivityCalendarData,
  formatTime,
  getWeekStats
} from '../utils/progress';
// import {
//   exportCollectionsToJSON,
//   downloadJSON,
//   importCollectionsFromJSON,
//   readJSONFile
// } from '../utils/exportImport';
import { getUserProfile, updateUserProfile } from '../firebase/firestore';
import { updateProfile } from 'firebase/auth';
import ActivityCalendar from '../components/ActivityCalendar';
import AchievementCard from '../components/AchievementCard';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { Flame, TrendingUp, Edit2, LogOut, Camera } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // const [ setCollections] = useState<Collection[]>([]);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    photoURL: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const profileData = await getUserProfile(user.uid) as any;
      const colls = await getCollections();
      
      const total = colls.reduce((sum, coll) => sum + coll.cards.length, 0);
      
      const loadedProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || profileData.displayName || 'User',
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
        lastStudyDate: profileData.lastStudyDate?.toDate?.(),
        achievements: profileData.achievements || [],
        studyHistory: profileData.studyHistory || []
      };
      
      setProfile(loadedProfile);
      // setCollections(colls);
      setTotalCards(total);
      
      setEditForm({
        displayName: loadedProfile.displayName,
        username: profileData.username || '',
        photoURL: user.photoURL || profileData.photoURL || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    try {
      // Обновляем Firebase Auth profile
      await updateProfile(user, {
        displayName: editForm.displayName,
        photoURL: editForm.photoURL || null
      });

      // Обновляем Firestore profile
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        username: editForm.username,
        photoURL: editForm.photoURL
      });

      setProfile({
        ...profile,
        displayName: editForm.displayName
      });

      setIsEditing(false);
      success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      error('Error updating profile');
    }
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      type: 'warning',
      confirmText: 'Logout',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      await logout();
      navigate('/login');
    }
  };

  // const handleExportAll = () => {
  //   const json = exportCollectionsToJSON(collections);
  //   const filename = `kolo-sets-export-${new Date().toISOString().split('T')[0]}.json`;
  //   downloadJSON(json, filename);
  // };

  // const handleImport = async () => {
  //   const input = document.createElement('input');
  //   input.type = 'file';
  //   input.accept = '.json';
    
  //   input.onchange = async (e: any) => {
  //     const file = e.target?.files?.[0];
  //     if (!file) return;

  //     try {
  //       const content = await readJSONFile(file);
  //       const imported = importCollectionsFromJSON(content);
        
  //       if (!user) return;
        
  //       for (const coll of imported) {
  //         await saveUserCollection(user.uid, coll);
  //       }
        
  //       success(`Successfully imported ${imported.length} collections!`);
  //       await loadProfile();
  //     } catch (err: any) {
  //       error(`Import error: ${err.message}`);
  //     }
  //   };
    
  //   input.click();
  // };

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
    <div className="max-w-5xl mx-auto py-6 space-y-6 md:space-y-8">
      {/* Заголовок и профиль */}
      <div className="bg-white dark:bg-gray-800 rounded-4xl p-4 md:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:justify-between gap-4 py-2">
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {editForm.photoURL ? (
                <img 
                  src={editForm.photoURL} 
                  alt="Profile" 
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-purple-200 dark:border-purple-800"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl md:text-3xl font-bold border-4 border-purple-200 dark:border-purple-800">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <button 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700"
                  onClick={() => {
                    const url = prompt('Введите URL изображения:', editForm.photoURL);
                    if (url !== null) {
                      setEditForm({ ...editForm, photoURL: url });
                    }
                  }}
                >
                  <Camera size={16} />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="text-xl md:text-2xl font-bold bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg border-2 border-purple-300 dark:border-purple-700 w-full"
                    placeholder="Имя"
                  />
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="text-lg bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
                    placeholder="@username"
                  />
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold mb-1">{profile.displayName}</h1>
                  {editForm.username && (
                    <p className="text-gray-600 dark:text-gray-400 mb-1">@{editForm.username}</p>
                  )}
                  <p className="text-gray-600 dark:text-gray-400">{profile.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors font-medium"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      displayName: profile.displayName,
                      username: editForm.username,
                      photoURL: user?.photoURL || ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl transition-colors"
                >
                  Отмена
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-xl transition-colors font-medium"
              >
                <Edit2 size={18} />
                Редактировать
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-xl transition-colors font-medium"
            >
              <LogOut size={18} />
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Стрик - крупная карточка */}
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-4xl p-8 text-white relative overflow-hidden">
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
          <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Сессий
            </div>
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              {weekStats.totalSessions}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Карточек изучено
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {weekStats.totalCards}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
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
      <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">
          Активность (последние 90 дней)
        </h2>
        <ActivityCalendar data={calendarData} />
      </div>

      {/* Общая статистика */}
      <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
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
      {/* <div className="bg-white dark:bg-gray-800 rounded-4xl p-6 border border-gray-200 dark:border-gray-700">
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
      </div> */}

      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Toast уведомления */}
      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />
    </div>
  );
}
