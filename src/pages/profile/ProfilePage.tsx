import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { UserProfile } from "../../types";
import {
  ALL_ACHIEVEMENTS,
  getAchievementProgress,
} from "../../utils/achievements";
import {
  getActivityCalendarData,
  formatTime,
  getWeekStats,
} from "../../utils/progress";
import { updateUserProfile } from "../../firebase/firestore";
import { updateProfile } from "firebase/auth";
import ActivityCalendar from "../../components/ActivityCalendar";
import AchievementCard from "../../components/AchievementCard";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import {
  Flame,
  Edit2,
  LogOut,
  Camera,
  Calendar,
  Award,
  Zap,
  User,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_RESTART_EVENT,
} from "../../components/OnboardingModal";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    profile: rawProfile,
    totalCards,
    collections,
    profileLoading,
    refreshProfile,
  } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  // Приводим сырые данные из контекста к типу UserProfile для компонента
  const profile = useMemo<UserProfile | null>(() => {
    if (!rawProfile || !user) return null;
    const lastStudyDate =
      typeof rawProfile.lastStudyDate?.toDate === 'function'
        ? rawProfile.lastStudyDate.toDate()
        : rawProfile.lastStudyDate
        ? new Date(rawProfile.lastStudyDate)
        : null;
    return {
      uid: user.uid,
      displayName: user.displayName || rawProfile.displayName || 'User',
      email: user.email || '',
      createdAt: rawProfile.createdAt?.toDate?.() ?? new Date(rawProfile.createdAt ?? Date.now()),
      stats: rawProfile.stats ?? {
        totalCards: 0, cardsLearned: 0, quizzesTaken: 0,
        flashcardSessions: 0, totalStudyTime: 0, perfectQuizzes: 0,
      },
      currentStreak: rawProfile.currentStreak ?? 0,
      longestStreak: rawProfile.longestStreak ?? 0,
      lastStudyDate,
      achievements: rawProfile.achievements ?? [],
      studyHistory: rawProfile.studyHistory ?? [],
    };
  }, [rawProfile, user]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    photoURL: '',
  });

  // Синхронизируем editForm когда данные профиля появляются
  useEffect(() => {
    if (rawProfile && user) {
      setEditForm({
        displayName: user.displayName || rawProfile.displayName || '',
        username: rawProfile.username || '',
        photoURL: user.photoURL || rawProfile.photoURL || '',
      });
    }
  }, [rawProfile, user]);

  const isTodayActive =
    profile?.lastStudyDate &&
    new Date(profile.lastStudyDate).toDateString() === new Date().toDateString();

  const handleAvatarEasterEgg = (e: React.DragEvent) => {
    e.preventDefault();
    success("Так называемый 'секретный' контент загружается...");
    setTimeout(() => {
      window.open("https://youtu.be/3MyecXEKBlo?si=Xj8Ih-GwndYy0Zok&t=27s", "_blank");
    }, 2000);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    try {
      await updateProfile(user, {
        displayName: editForm.displayName,
        photoURL: editForm.photoURL || null,
      });
      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        username: editForm.username,
        photoURL: editForm.photoURL,
      });
      await refreshProfile();
      setIsEditing(false);
      success(t.profile.toast.success);
    } catch (err) {
      error(t.profile.toast.error);
    }
  };

  const handleLogout = async () => {
    if (
      await confirm({
        title: t.profile.logoutTitle,
        message: t.profile.logoutConfirm,
        type: "warning",
      })
    ) {
      await logout();
      navigate("/login");
    }
  };

  const weekStats = useMemo(
    () => (profile ? getWeekStats(profile.studyHistory) : null),
    [profile],
  );
  const calendarData = useMemo(
    () => (profile ? getActivityCalendarData(profile.studyHistory, 90) : []),
    [profile],
  );

  if (profileLoading && !profile)
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-32 pt-4 px-4 animate-pulse">
        <div className="h-48 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-7 h-80 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]" />
          <div className="col-span-12 md:col-span-5 h-80 bg-[#EDEAE4] dark:bg-[#242220] rounded-[2.5rem]" />
        </div>
      </div>
    );

  // Заглушка когда профиль не загрузился
  if (!profile && !profileLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-5 pb-32"
      >
        <section className="bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] p-8 md:p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#EDEAE4] dark:bg-[#242220] flex items-center justify-center">
            <User size={36} className="text-[#B5B0A8]" />
          </div>
          <h2 className="text-2xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8] mb-3">
            {t.profile.guestStub.title}
          </h2>
          <p className="text-sm text-[#7A756E] dark:text-[#B5B0A8] mb-8 max-w-sm mx-auto">
            {t.profile.guestStub.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={refreshProfile}
              className="px-6 py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              {t.profile.guestStub.retry}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-3 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/20 text-[#FF5733] rounded-2xl font-bold text-xs uppercase tracking-widest"
            >
              {t.profile.guestStub.toLogin}
            </button>
          </div>
        </section>
      </motion.div>
    );
  }

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
                <img
                  src={editForm.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                  onDragStart={handleAvatarEasterEgg} // ВОТ ОНА, ТВОЯ ПАСХАЛКА
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[#1A1714] dark:text-[#F0EDE8] text-5xl font-serif italic cursor-help"
                  onDragStart={handleAvatarEasterEgg} // И здесь тоже, если фото нет
                  draggable // Делаем div перетаскиваемым для срабатывания
                >
                  {profile.displayName.charAt(0)}
                </div>
              )}
            </div>
            {/* ... остальной код кнопки Camera */}

            {isEditing && (
              <button
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#FF5733] text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                onClick={() => {
                  const url = prompt(
                    t.profile.enterImageUrl,
                    editForm.photoURL,
                  );
                  if (url !== null) setEditForm({ ...editForm, photoURL: url });
                }}
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-2">
            <p className="text-[10px] font-bold text-[#FF5733] uppercase tracking-[0.3em]">
              {t.profile.cabinet}
            </p>
            {isEditing ? (
              <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  className="text-3xl font-serif italic bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-4 py-2 rounded-2xl w-full focus:outline-none"
                />
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="text-sm font-bold bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-4 py-2 rounded-xl w-full"
                  placeholder={t.profile.usernamePlaceholder}
                />
              </div>
            ) : (
              <div>
                <h1 className="text-4xl my-6 md:text-5xl font-serif italic tracking-tight text-[#1A1714] dark:text-[#F0EDE8]">
                  {profile.displayName}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                  {editForm.username && (
                    <span className="text-sm font-bold text-[#7A756E]">
                      @{editForm.username}
                    </span>
                  )}
                  <span className="text-sm text-[#B5B0A8] font-medium">
                    {profile.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-3 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  {t.profile.save}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 bg-[#EDEAE4] dark:bg-[#242220] rounded-2xl font-bold text-xs uppercase tracking-widest"
                >
                  {t.profile.cancel}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-all"
              >
                <Edit2 size={20} className="text-[#7A756E]" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-4 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/10 rounded-2xl text-[#FF5733] hover:bg-[#FF5733] hover:text-white transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        {/* 2. STREAK CARD */}
        <section
          className={`col-span-12 md:col-span-7 relative overflow-hidden rounded-[2.5rem] p-10 transition-all duration-700 ${
            isTodayActive
              ? "bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714]"
              : "bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29]"
          }`}
        >
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 pointer-events-none">
            <Zap size={180} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTodayActive ? "bg-[#FF5733]" : "bg-[#EDEAE4] dark:bg-[#242220]"}`}
              >
                <Flame
                  size={20}
                  className={isTodayActive ? "text-white" : "text-[#B5B0A8]"}
                  fill={isTodayActive ? "currentColor" : "none"}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {isTodayActive
                  ? t.profile.streak.goalReached
                  : t.profile.streak.title}
              </span>
            </div>
            <div className="flex items-end gap-4">
              <span className="text-8xl font-serif italic leading-none">
                {profile.currentStreak}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                {t.profile.streak.daysInRow}
              </span>
            </div>
            <div className="pt-6 border-t border-white/10 dark:border-black/10 flex gap-10">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50 mb-1">
                  {t.profile.streak.record}
                </p>
                <p className="text-2xl font-serif italic">
                  {profile.longestStreak} {t.profile.streak.daysShort}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50 mb-1">
                  {t.profile.streak.status}
                </p>
                <p className="text-2xl font-serif italic">
                  {isTodayActive
                    ? t.profile.streak.active
                    : t.profile.streak.waiting}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. QUICK STATS */}
        <section className="col-span-12 md:col-span-5 bg-[#EDEAE4] dark:bg-[#242220] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] p-8 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                label: t.profile.stats.totalWords,
                val: totalCards,
                icon: Award,
              },
              {
                label: t.profile.stats.sessions,
                val: profile.stats.flashcardSessions,
                icon: Zap,
              },
              {
                label: t.profile.stats.quizzes,
                val: profile.stats.quizzesTaken,
                icon: Award,
              },
              {
                label: t.profile.stats.inLearning,
                val: formatTime(profile.stats.totalStudyTime),
                icon: Calendar,
              },
            ].map((s, i) => (
              <div key={i} className="space-y-1">
                <p className="text-3xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8]">
                  {s.val}
                </p>
                <p className="text-[9px] font-bold text-[#7A756E] uppercase tracking-widest leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-6 border-t border-[#D6D0C5] dark:border-[#2E2C29]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#B5B0A8]">
              {t.profile.stats.regDate}
            </p>
            <p className="text-sm font-medium mt-1">
              {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </section>

        {/* 4. WEEK STATS */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-8 min-h-[280px]">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8] mb-4">
              {t.profile.stats.weekTitle}
            </h2>
            <div className="space-y-6">
              {weekStats &&
                [
                  {
                    label: t.profile.stats.sessions,
                    value: weekStats.totalSessions,
                    color: "text-blue-500",
                  },
                  {
                    label: t.profile.stats.cardsStudied,
                    value: weekStats.totalCards,
                    color: "text-green-500",
                  },
                  {
                    label: t.profile.stats.studyTime,
                    value: formatTime(weekStats.totalTime),
                    color: "text-[#FF5733]",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-end border-b border-[#F5F2ED] dark:border-[#242220] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-[10px] font-bold text-[#7A756E] uppercase">
                      {stat.label}
                    </span>
                    <span
                      className={`text-3xl font-serif italic ${stat.color}`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 5. CALENDAR */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-8 min-h-[280px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
              {t.profile.stats.activityMatrix}
            </h2>
            <Calendar size={16} className="text-[#B5B0A8]" />
          </div>
          <ActivityCalendar data={calendarData} />
        </div>
      </div>

      {/* <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FF5733]"/>
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">{t.profile.album}</h2>
          </div>
        </div>
      </section> */}

      {/* 6. ACHIEVEMENTS */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FF5733]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
              {t.profile.achievements} ({profile.achievements.length}/
              {ALL_ACHIEVEMENTS.length})
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_ACHIEVEMENTS.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={profile.achievements.includes(achievement.id)}
              progress={getAchievementProgress(
                achievement,
                profile,
                totalCards,
                collections.length,
              )}
            />
          ))}
        </div>
      </section>

      {/* Settings section */}
      <section className="pt-2 pb-6">
        <div className="flex items-center gap-2 px-2 mb-4">
          <BookOpen size={16} className="text-[#FF5733]" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
            Настройки
          </h2>
        </div>
        <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-3">
          <button
            onClick={() => {
              localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              window.dispatchEvent(new CustomEvent(ONBOARDING_RESTART_EVENT));
            }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors text-left"
          >
            <div className="w-11 h-11 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-xl flex items-center justify-center text-[#FF5733] shrink-0">
              <RefreshCw size={17} />
            </div>
            <div>
              <p className="text-sm font-black text-[#1A1714] dark:text-[#F0EDE8]">
                Перезапустить обучение
              </p>
              <p className="text-[11px] text-[#7A756E]">
                Снова посмотреть знакомство с приложением
              </p>
            </div>
          </button>
        </div>
      </section>

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Toast {...toastState} onClose={hideToast} />
    </motion.div>
  );
}
