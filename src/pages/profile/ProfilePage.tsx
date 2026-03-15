import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { getCollections } from '../../utils/storage';
import { UserProfile } from '../../types';
import { ALL_ACHIEVEMENTS, getAchievementProgress } from '../../utils/achievements';
import { getActivityCalendarData, formatTime, getWeekStats} from '../../utils/progress';
import { getUserProfile, updateUserProfile } from '../../firebase/firestore';
import { updateProfile } from 'firebase/auth';
import ActivityCalendar from '../../components/ActivityCalendar';
import AchievementCard from '../../components/AchievementCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/Toast';
import { Flame, Edit2, LogOut, Camera, Calendar, Award, Zap } from 'lucide-react';
import { motion} from 'framer-motion';

export default function ProfilePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  // 1. Smart Load: Инициализация из кэша
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (!user?.uid) return null;
    const saved = localStorage.getItem(`profile_cache_${user.uid}`);
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });

  const [totalCards, setTotalCards] = useState(() => {
    if (!user?.uid) return 0;
    const saved = localStorage.getItem(`total_cards_cache_${user.uid}`);
    return saved ? parseInt(saved) : 0;
  });

  const [loading, setLoading] = useState(!profile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    photoURL: ''
  });

  useEffect(() => { loadProfile(); }, [user?.uid]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const profileData = await getUserProfile(user.uid) as any;
      const colls = await getCollections();
      const total = colls.reduce((sum, coll) => sum + coll.cards.length, 0);
      const lastStudyDate = profileData.lastStudyDate?.toDate?.() || null;
      let currentStreak = profileData.currentStreak || 0;

      if (lastStudyDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = new Date(lastStudyDate);
        lastDate.setHours(0, 0, 0, 0);
        if (Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) > 1) {
          currentStreak = 0;
        }
      }

      const loadedProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || profileData.displayName || 'User',
        email: user.email || '',
        createdAt: profileData.createdAt?.toDate() || new Date(),
        stats: profileData.stats || { totalCards: 0, cardsLearned: 0, quizzesTaken: 0, flashcardSessions: 0, totalStudyTime: 0, perfectQuizzes: 0 },
        currentStreak: currentStreak,
        longestStreak: profileData.longestStreak || 0,
        lastStudyDate: lastStudyDate,
        achievements: profileData.achievements || [],
        studyHistory: profileData.studyHistory || []
      };
      
      setProfile(loadedProfile);
      setTotalCards(total);
      
      // Сохраняем в кэш
      localStorage.setItem(`profile_cache_${user.uid}`, JSON.stringify(loadedProfile));
      localStorage.setItem(`total_cards_cache_${user.uid}`, total.toString());

      setEditForm({
        displayName: loadedProfile.displayName,
        username: profileData.username || '',
        photoURL: user.photoURL || profileData.photoURL || ''
      });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const isTodayActive = profile?.lastStudyDate && 
    new Date(profile.lastStudyDate).toDateString() === new Date().toDateString();

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    try {
      await updateProfile(user, { displayName: editForm.displayName, photoURL: editForm.photoURL || null });
      await updateUserProfile(user.uid, { displayName: editForm.displayName, username: editForm.username, photoURL: editForm.photoURL });
      setProfile({ ...profile, displayName: editForm.displayName });
      setIsEditing(false);
      success('Профиль обновлен!');
    } catch (err) { error('Ошибка обновления'); }
  };

  const handleLogout = async () => {
    if (await confirm({ title: 'Выход', message: 'Вы уверены?', type: 'warning' })) {
      await logout(); navigate('/login');
    }
  };

  // Стейты прогресса (вычисляются только когда есть профиль)
  const weekStats = useMemo(() => profile ? getWeekStats(profile.studyHistory) : null, [profile]);
  const calendarData = useMemo(() => profile ? getActivityCalendarData(profile.studyHistory, 90) : [], [profile]);

  // --- SKELETON COMPONENT ---
  if (loading && !profile) return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 pt-4 px-4 animate-pulse">
      <div className="h-48 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7 h-80 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
        <div className="col-span-12 md:col-span-5 h-80 bg-[#EDEAE4] dark:bg-[#242220] rounded-[2.5rem]" />
        <div className="col-span-12 lg:col-span-4 h-96 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
        <div className="col-span-12 lg:col-span-8 h-96 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
      </div>
    </div>
  );

  if (!profile) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* 1. HERO SECTION */}
      <section className="bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] p-8 md:p-10">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-[3rem] bg-[#EDEAE4] dark:bg-[#242220] overflow-hidden border-4 border-white dark:border-[#1A1917] shadow-xl">
              {editForm.photoURL ? (
                <img src={editForm.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#1A1714] dark:text-[#F0EDE8] text-5xl font-serif italic">
                  {profile.displayName.charAt(0)}
                </div>
              )}
            </div>
            {isEditing && (
              <button 
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#FF5733] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                onClick={() => {
                  const url = prompt(t.profile.pictureUrl, editForm.photoURL);
                  if (url !== null) setEditForm({ ...editForm, photoURL: url });
                }}
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <p className="text-[10px] font-bold text-[#FF5733] uppercase tracking-[0.3em]">Личный кабинет</p>
            {isEditing ? (
              <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="text-3xl font-serif italic bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-4 py-2 rounded-2xl w-full focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="text-sm font-bold bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-4 py-2 rounded-xl w-full"
                  placeholder="@username"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-4xl my-6 md:text-5xl font-serif italic tracking-tight text-[#1A1714] dark:text-[#F0EDE8]">{profile.displayName}</h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                   {editForm.username && <span className="text-sm font-bold text-[#7A756E]">@{editForm.username}</span>}
                   <span className="text-sm text-[#B5B0A8] font-medium">{profile.email}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button onClick={handleSaveProfile} className="px-6 py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] rounded-2xl font-bold text-xs uppercase tracking-widest transition-all">Сохранить</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 bg-[#EDEAE4] dark:bg-[#242220] rounded-2xl font-bold text-xs uppercase tracking-widest">Отмена</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-all">
                <Edit2 size={20} className="text-[#7A756E]" />
              </button>
            )}
            <button onClick={handleLogout} className="p-4 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/10 rounded-2xl text-[#FF5733] hover:bg-[#FF5733] hover:text-white transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* 2. STREAK CARD */}
        <section className={`col-span-12 md:col-span-7 relative overflow-hidden rounded-[2.5rem] p-10 transition-all duration-700 ${
          isTodayActive 
            ? 'bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714]' 
            : 'bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29]'
        }`}>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 pointer-events-none">
             <Zap size={180} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTodayActive ? 'bg-[#FF5733]' : 'bg-[#EDEAE4] dark:bg-[#242220]'}`}>
                <Flame size={20} className={isTodayActive ? 'text-white' : 'text-[#B5B0A8]'} fill={isTodayActive ? "currentColor" : "none"} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {isTodayActive ? 'Цель на сегодня достигнута' : 'Ударный режим'}
              </span>
            </div>
            <div className="flex items-end gap-4">
              <span className="text-8xl font-serif italic leading-none">{profile.currentStreak}</span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">дней подряд</span>
            </div>
            <div className="pt-6 border-t border-white/10 dark:border-black/10 flex gap-10">
               <div>
                  <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Рекорд</p>
                  <p className="text-2xl font-serif italic">{profile.longestStreak} дн.</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold uppercase opacity-50 mb-1">Статус</p>
                  <p className="text-2xl font-serif italic">{isTodayActive ? 'Активен' : 'В ожидании'}</p>
               </div>
            </div>
          </div>
        </section>

        {/* 3. QUICK STATS */}
        <section className="col-span-12 md:col-span-5 bg-[#EDEAE4] dark:bg-[#242220] rounded-[2.5rem] p-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Всего слов', val: totalCards, icon: Award },
                { label: 'Сессий', val: profile.stats.flashcardSessions, icon: Zap },
                { label: 'Тестов', val: profile.stats.quizzesTaken, icon: Award },
                { label: 'В обучении', val: formatTime(profile.stats.totalStudyTime), icon: Calendar },
              ].map((s, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-3xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8]">{s.val}</p>
                  <p className="text-[9px] font-bold text-[#7A756E] uppercase tracking-widest leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-[#D6D0C5] dark:border-[#2E2C29]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#B5B0A8]">Дата регистрации</p>
              <p className="text-sm font-medium mt-1">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
        </section>

        {/* 4. WEEK STATS */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-8 min-h-[280px]">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8] mb-4">{t.profile.stats.weekTitle}</h2>
            <div className="space-y-6">
              {weekStats && [
                { label: t.profile.stats.sessions, value: weekStats.totalSessions, color: 'text-blue-500' },
                { label: t.profile.stats.cardsStudied, value: weekStats.totalCards, color: 'text-green-500' },
                { label: t.profile.stats.studyTime, value: formatTime(weekStats.totalTime), color: 'text-[#FF5733]' }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-end border-b border-[#F5F2ED] dark:border-[#242220] pb-3 last:border-0 last:pb-0">
                  <span className="text-[10px] font-bold text-[#7A756E] uppercase">{stat.label}</span>
                  <span className={`text-3xl font-serif italic ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. CALENDAR */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-8 min-h-[280px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">Матрица активности</h2>
            <Calendar size={16} className="text-[#B5B0A8]" />
          </div>
          <ActivityCalendar data={calendarData} />
        </div>
      </div>

      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FF5733]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">Альбом</h2>
          </div>
        </div>
      </section>

      {/* 6. ACHIEVEMENTS */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FF5733]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">Достижения ({profile.achievements.length}/{ALL_ACHIEVEMENTS.length})</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ACHIEVEMENTS.map(achievement => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={profile.achievements.includes(achievement.id)}
              progress={getAchievementProgress(achievement, profile, totalCards)}
            />
          ))}
        </div>
      </section>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </motion.div>
  );
}