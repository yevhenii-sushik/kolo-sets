import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { UserProfile, Achievement } from "../../types";
import {
  ALL_ACHIEVEMENTS,
  getAchievementProgress,
} from "../../utils/achievements";
import {
  formatTime,
  getWeekStats,
} from "../../utils/progress";
import { updateUserProfile, claimUsername } from "../../firebase/firestore";
import { isValidUsername, normalizeUsername } from "../../utils/username";
import { uploadAvatar, AvatarUploadError } from "../../utils/avatarUpload";
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
  ChevronDown,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_RESTART_EVENT,
} from "../../components/OnboardingModal";
import { motion, AnimatePresence } from "framer-motion";

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
      username: rawProfile.username ?? '',
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // сброс — иначе повторный выбор того же файла не сработает
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      setEditForm((prev) => ({ ...prev, photoURL: url }));
    } catch (err) {
      error(
        err instanceof AvatarUploadError
          ? err.message
          : 'Не удалось загрузить фото — попробуйте ещё раз',
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    // username обязателен и уникален — валидируем формат до записи,
    // а фактическую уникальность гарантирует транзакция claimUsername
    const trimmedUsername = editForm.username.trim();
    const normalizedNew = normalizeUsername(trimmedUsername);

    if (!trimmedUsername) {
      error('Придумайте имя пользователя — оно обязательно');
      return;
    }
    if (!isValidUsername(normalizedNew)) {
      error('Имя пользователя: 3–20 символов, латиница/цифры/подчёркивание');
      return;
    }

    try {
      await updateProfile(user, {
        displayName: editForm.displayName,
        photoURL: editForm.photoURL || null,
      });

      const normalizedOld = normalizeUsername(profile.username);
      if (normalizedNew !== normalizedOld) {
        await claimUsername(user.uid, trimmedUsername, normalizedOld || undefined);
      }

      await updateUserProfile(user.uid, {
        displayName: editForm.displayName,
        username: trimmedUsername,
        photoURL: editForm.photoURL,
      });
      await refreshProfile();
      setIsEditing(false);
      success(t.profile.toast.success);
    } catch (err) {
      if (err instanceof Error && err.message === 'USERNAME_TAKEN') {
        error('Это имя пользователя уже занято');
      } else {
        error(t.profile.toast.error);
      }
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

  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const ACHIEVEMENTS_PREVIEW_COUNT = 3;

  // Последние разблокированные (achievements хранится в хронологическом
  // порядке — новые добавляются в конец, поэтому reverse даёт "последние").
  // Если разблокировано меньше 3 — докручиваем ближайшими к завершению,
  // чтобы превью никогда не выглядело пустым.
  const previewAchievements = useMemo<Achievement[]>(() => {
    if (!profile) return [];
    const byId = new Map(ALL_ACHIEVEMENTS.map((a) => [a.id, a]));
    const unlocked = [...profile.achievements]
      .reverse()
      .map((id) => byId.get(id))
      .filter((a): a is Achievement => !!a);

    if (unlocked.length >= ACHIEVEMENTS_PREVIEW_COUNT) {
      return unlocked.slice(0, ACHIEVEMENTS_PREVIEW_COUNT);
    }

    const lockedByProgress = ALL_ACHIEVEMENTS.filter(
      (a) => !profile.achievements.includes(a.id),
    )
      .map((a) => ({
        a,
        pct: getAchievementProgress(a, profile, totalCards, collections.length)
          .percentage,
      }))
      .sort((x, y) => y.pct - x.pct)
      .map((x) => x.a);

    return [...unlocked, ...lockedByProgress].slice(
      0,
      ACHIEVEMENTS_PREVIEW_COUNT,
    );
  }, [profile, totalCards, collections.length]);

  // Всё, что не попало в превью — раскрывается плавно под ним по клику,
  // а не переключается свапом всего грида
  const restAchievements = useMemo(() => {
    const previewIds = new Set(previewAchievements.map((a) => a.id));
    return ALL_ACHIEVEMENTS.filter((a) => !previewIds.has(a.id));
  }, [previewAchievements]);

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
      <div className="space-y-5 pb-32">
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
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* 1. HERO SECTION — одна строка на всех брейкпоинтах, размеры/паддинги
          скейлятся через sm:/md:, чтобы на мобилке было плотно, а на десктопе
          сохранялся прежний более просторный вид */}
      <section className="bg-white dark:bg-[#1A1917] rounded-3xl sm:rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] p-4 sm:p-8 md:p-10">
        <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
          <div className="relative group shrink-0">
            <div className="w-16 h-16 sm:w-28 sm:h-28 md:w-40 md:h-40 rounded-2xl sm:rounded-4xl md:rounded-[3rem] bg-[#EDEAE4] dark:bg-[#242220] overflow-hidden border-2 sm:border-4 border-white dark:border-[#1A1917] shadow-md sm:shadow-xl">
              {editForm.photoURL ? (
                <img
                  src={editForm.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
                  onDragStart={handleAvatarEasterEgg} // ВОТ ОНА, ТВОЯ ПАСХАЛКА
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-[#1A1714] dark:text-[#F0EDE8] text-xl sm:text-3xl md:text-5xl font-serif italic cursor-help"
                  onDragStart={handleAvatarEasterEgg} // И здесь тоже, если фото нет
                  draggable // Делаем div перетаскиваемым для срабатывания
                >
                  {profile.displayName.charAt(0)}
                </div>
              )}
            </div>

            {/* Затемнение + спиннер поверх аватара во время загрузки/сжатия */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 rounded-2xl sm:rounded-4xl md:rounded-[3rem] bg-black/50 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" />
              </div>
            )}

            {isEditing && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#FF5733] text-white rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all disabled:opacity-60 disabled:hover:scale-100"
                >
                  <Camera size={14} className="sm:hidden" />
                  <Camera size={18} className="hidden sm:block" />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 text-left">
            <p className="hidden sm:block text-[10px] font-bold text-[#FF5733] uppercase tracking-[0.3em]">
              {t.profile.cabinet}
            </p>
            {isEditing ? (
              <div className="space-y-2 sm:space-y-4 max-w-sm">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  className="text-base sm:text-2xl md:text-3xl font-serif italic bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl w-full focus:outline-none"
                />
                <div>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        // Только допустимые символы, сразу в нижнем регистре —
                        // меньше шансов словить ошибку валидации при сохранении
                        username: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ''),
                      })
                    }
                    className="text-xs sm:text-sm font-bold bg-[#F5F2ED] dark:bg-[#141312] border border-[#E0DBD3] dark:border-[#2E2C29] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl w-full"
                    placeholder={t.profile.usernamePlaceholder}
                  />
                  <p className="text-[10px] text-[#B5B0A8] mt-1 px-1">
                    3–20 символов: латиница, цифры, _
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-lg sm:text-3xl md:text-5xl my-0 sm:my-2 md:my-6 font-serif italic tracking-tight text-[#1A1714] dark:text-[#F0EDE8] truncate">
                  {profile.displayName}
                </h1>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 sm:gap-4 mt-0.5 sm:mt-3">
                  {editForm.username && (
                    <span className="text-[11px] sm:text-sm font-bold text-[#7A756E]">
                      @{editForm.username}
                    </span>
                  )}
                  <span className="text-[11px] sm:text-sm text-[#B5B0A8] font-medium truncate">
                    {profile.email}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Единый визуальный язык для всех кнопок блока: одинаковые
              квадратные icon-only кнопки (размер/скругление/паддинги), меняются
              местами по режиму. В edit-режиме Save/Cancel складываются в
              столбец на мобилке (места по горизонтали в этой строке мало —
              раньше текстовые "Сохранить"/"Отмена" не влезали и распирали
              весь блок), а Logout вообще не рендерится — незачем во время
              редактирования. */}
          <div className="flex gap-1.5 sm:gap-3 shrink-0">
            {isEditing ? (
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={
                    isUploadingAvatar ||
                    !isValidUsername(normalizeUsername(editForm.username))
                  }
                  title={t.profile.save}
                  className="p-2.5 sm:p-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714] rounded-xl sm:rounded-2xl transition-all disabled:opacity-40"
                >
                  <Check size={16} className="sm:hidden" />
                  <Check size={20} className="hidden sm:block" />
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  title={t.profile.cancel}
                  className="p-2.5 sm:p-4 bg-[#EDEAE4] dark:bg-[#242220] rounded-xl sm:rounded-2xl hover:bg-[#E0DBD3] dark:hover:bg-[#2E2C29] transition-all"
                >
                  <X size={16} className="sm:hidden" />
                  <X size={20} className="hidden sm:block" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                  className="p-2.5 sm:p-4 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-xl sm:rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-all"
                >
                  <Edit2 size={16} className="text-[#7A756E] sm:hidden" />
                  <Edit2 size={20} className="text-[#7A756E] hidden sm:block" />
                </button>
                <button
                  onClick={handleLogout}
                  title={t.profile.logoutTitle}
                  className="p-2.5 sm:p-4 bg-[#FFF0ED] dark:bg-[#2A1A15] border border-[#FF5733]/10 rounded-xl sm:rounded-2xl text-[#FF5733] hover:bg-[#FF5733] hover:text-white transition-all"
                >
                  <LogOut size={16} className="sm:hidden" />
                  <LogOut size={20} className="hidden sm:block" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        {/* 2. STREAK CARD */}
        <section
          className={`col-span-12 md:col-span-7 relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 md:p-10 transition-all duration-700 ${
            isTodayActive
              ? "bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#1A1714]"
              : "bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29]"
          }`}
        >
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12 pointer-events-none">
            <Zap size={180} strokeWidth={1} />
          </div>
          <div className="relative z-10 space-y-3 sm:space-y-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ${isTodayActive ? "bg-[#FF5733]" : "bg-[#EDEAE4] dark:bg-[#242220]"}`}
              >
                <Flame
                  size={16}
                  className={isTodayActive ? "text-white" : "text-[#B5B0A8]"}
                  fill={isTodayActive ? "currentColor" : "none"}
                />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">
                {isTodayActive
                  ? t.profile.streak.goalReached
                  : t.profile.streak.title}
              </span>
            </div>
            <div className="flex items-end gap-2 sm:gap-4">
              <span className="text-5xl sm:text-7xl md:text-8xl font-serif italic leading-none">
                {profile.currentStreak}
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest opacity-60 mb-1 sm:mb-2">
                {t.profile.streak.daysInRow}
              </span>
            </div>
            <div className="pt-3 sm:pt-6 border-t border-white/10 dark:border-black/10 flex gap-6 sm:gap-10">
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50 mb-0.5 sm:mb-1">
                  {t.profile.streak.record}
                </p>
                <p className="text-lg sm:text-2xl font-serif italic">
                  {profile.longestStreak} {t.profile.streak.daysShort}
                </p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase opacity-50 mb-0.5 sm:mb-1">
                  {t.profile.streak.status}
                </p>
                <p className="text-lg sm:text-2xl font-serif italic">
                  {isTodayActive
                    ? t.profile.streak.active
                    : t.profile.streak.waiting}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. QUICK STATS */}
        <section className="col-span-12 md:col-span-5 bg-[#EDEAE4] dark:bg-[#242220] rounded-3xl sm:rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] p-5 sm:p-8 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
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
              <div key={i} className="space-y-0.5 sm:space-y-1">
                <p className="text-xl sm:text-3xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8]">
                  {s.val}
                </p>
                <p className="text-[9px] font-bold text-[#7A756E] uppercase tracking-widest leading-tight">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 sm:mt-8 pt-4 sm:pt-6 border-t border-[#D6D0C5] dark:border-[#2E2C29]">
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
          <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:min-h-70">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8] mb-3 sm:mb-4">
              {t.profile.stats.weekTitle}
            </h2>
            <div className="space-y-3 sm:space-y-6">
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
                    className="flex justify-between items-end border-b border-[#F5F2ED] dark:border-[#242220] pb-2 sm:pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-[10px] font-bold text-[#7A756E] uppercase">
                      {stat.label}
                    </span>
                    <span
                      className={`text-xl sm:text-3xl font-serif italic ${stat.color}`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* 5. CALENDAR */}
        <div className="col-span-12 lg:col-span-8 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:min-h-70">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
              {t.profile.stats.activityMatrix}
            </h2>
            <Calendar size={16} className="text-[#B5B0A8]" />
          </div>
          <ActivityCalendar studyHistory={profile.studyHistory} />
        </div>
      </div>

      {/* 6. ACHIEVEMENTS — превью из 3 (последние разблокированные, или
          ближайшие к разблокировке, если открытых меньше 3) всегда на
          месте; остальные плавно раскрываются/схлопываются по высоте под
          ним, а не свапаются мгновенно — весь список никогда не
          перемонтируется целиком. */}
      <section className="space-y-3 sm:space-y-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-[#FF5733]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
              {t.profile.achievements} ({profile.achievements.length}/
              {ALL_ACHIEVEMENTS.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {previewAchievements.map((achievement) => (
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

        <AnimatePresence initial={false}>
          {achievementsOpen && (
            <motion.div
              key="rest-achievements"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
                {restAchievements.map((achievement) => (
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
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setAchievementsOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#E0DBD3] dark:border-[#2E2C29] text-[11px] font-black uppercase tracking-widest text-[#7A756E] hover:text-[#FF5733] hover:border-[#FF5733]/40 transition-colors"
        >
          {achievementsOpen ? "Свернуть" : `Показать все (${ALL_ACHIEVEMENTS.length})`}
          <motion.span
            animate={{ rotate: achievementsOpen ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center"
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
      </section>

      {/* Settings section */}
      <section className="pt-1 sm:pt-2 pb-6">
        <div className="flex items-center gap-2 px-2 mb-3 sm:mb-4">
          <BookOpen size={16} className="text-[#FF5733]" />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#B5B0A8]">
            Настройки
          </h2>
        </div>
        <div className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl sm:rounded-[2.5rem] p-3">
          <button
            onClick={() => {
              localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              window.dispatchEvent(new CustomEvent(ONBOARDING_RESTART_EVENT));
            }}
            className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-2xl hover:bg-[#F5F2ED] dark:hover:bg-[#242220] transition-colors text-left"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-xl flex items-center justify-center text-[#FF5733] shrink-0">
              <RefreshCw size={15} className="sm:hidden" />
              <RefreshCw size={17} className="hidden sm:block" />
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
    </div>
  );
}
