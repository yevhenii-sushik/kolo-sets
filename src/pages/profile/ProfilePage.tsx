import { useState, useEffect, useMemo, useRef, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { UserProfile, Achievement } from "../../types";
import { ALL_ACHIEVEMENTS, getAchievementProgress } from "../../utils/achievements";
import { formatDuration, getWeekStats } from "../../utils/progress";
import { updateUserProfile, claimUsername } from "../../firebase/firestore";
import { isValidUsername, normalizeUsername } from "../../utils/username";
import { uploadAvatar, AvatarUploadError } from "../../utils/avatarUpload";
import { getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { updateProfile } from "firebase/auth";
import ActivityCalendar from "../../components/ActivityCalendar";
import AchievementCard from "../../components/AchievementCard";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import {
  AtSign,
  BookOpen,
  Camera,
  ChevronDown,
  ChevronRight,
  Clock,
  Flame,
  GalleryVerticalEnd,
  ListChecks,
  LogOut,
  Pencil,
  RefreshCw,
  User,
} from "lucide-react";
import { ONBOARDING_STORAGE_KEY, ONBOARDING_RESTART_EVENT } from "../../components/OnboardingModal";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, Card, Field, Heading, IconButton, Input, Spinner, Text, cx } from "../../ui";

const ACHIEVEMENTS_PREVIEW_COUNT = 3;

// Профиль: кто ты → серия и цифры → неделя и календарь → достижения → перезапуск знакомства
export default function ProfilePage() {
  const { t, language } = useI18n();
  const p = t.profile;
  const locale = getLanguageInfo(language).htmlLang;
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  // Профиль — про весь аккаунт: слова и наборы всех курсов
  const { profile: rawProfile, allTotalCards: totalCards, allCollections: collections, profileLoading, refreshProfile } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  // Приводим сырые данные из контекста к типу UserProfile для компонента
  const profile = useMemo<UserProfile | null>(() => {
    if (!rawProfile || !user) return null;
    const lastStudyDate =
      typeof rawProfile.lastStudyDate?.toDate === "function"
        ? rawProfile.lastStudyDate.toDate()
        : rawProfile.lastStudyDate
          ? new Date(rawProfile.lastStudyDate)
          : null;
    return {
      uid: user.uid,
      displayName: user.displayName || rawProfile.displayName || "User",
      email: user.email || "",
      username: rawProfile.username ?? "",
      createdAt: rawProfile.createdAt?.toDate?.() ?? new Date(rawProfile.createdAt ?? Date.now()),
      stats: rawProfile.stats ?? {
        totalCards: 0,
        cardsLearned: 0,
        quizzesTaken: 0,
        flashcardSessions: 0,
        totalStudyTime: 0,
        perfectQuizzes: 0,
      },
      currentStreak: rawProfile.currentStreak ?? 0,
      longestStreak: rawProfile.longestStreak ?? 0,
      lastStudyDate,
      achievements: rawProfile.achievements ?? [],
      studyHistory: rawProfile.studyHistory ?? [],
    };
  }, [rawProfile, user]);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", username: "", photoURL: "" });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Синхронизируем editForm когда данные профиля появляются
  useEffect(() => {
    if (rawProfile && user) {
      setEditForm({
        displayName: user.displayName || rawProfile.displayName || "",
        username: rawProfile.username || "",
        photoURL: user.photoURL || rawProfile.photoURL || "",
      });
    }
  }, [rawProfile, user]);

  const isTodayActive = Boolean(
    profile?.lastStudyDate && new Date(profile.lastStudyDate).toDateString() === new Date().toDateString(),
  );

  const handleAvatarEasterEgg = (e: React.DragEvent) => {
    e.preventDefault();
    success(p.easterEgg);
    setTimeout(() => {
      window.open("https://youtu.be/3MyecXEKBlo?si=Xj8Ih-GwndYy0Zok&t=27s", "_blank");
    }, 2000);
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // сброс — иначе повторный выбор того же файла не сработает
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.uid, file);
      setEditForm((prev) => ({ ...prev, photoURL: url }));
    } catch (err) {
      error(err instanceof AvatarUploadError ? p.errors[err.code] : p.errors.avatarGeneric);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Отмена возвращает имя и username к сохранённым; фото уже лежит в Storage
  // по тому же пути, поэтому его оставляем как есть
  const cancelEditing = () => {
    setEditForm((prev) => ({
      ...prev,
      displayName: user?.displayName || rawProfile?.displayName || "",
      username: rawProfile?.username || "",
    }));
    setIsEditing(false);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // username обязателен и уникален — валидируем формат до записи,
    // а фактическую уникальность гарантирует транзакция claimUsername
    const trimmedUsername = editForm.username.trim();
    const normalizedNew = normalizeUsername(trimmedUsername);

    if (!trimmedUsername) {
      error(p.errors.usernameRequired);
      return;
    }
    if (!isValidUsername(normalizedNew)) {
      error(p.errors.usernameInvalid);
      return;
    }

    setIsSaving(true);
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
      success(p.toast.success);
    } catch (err) {
      error(err instanceof Error && err.message === "USERNAME_TAKEN" ? p.errors.usernameTaken : p.toast.error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (await confirm({ title: p.logoutTitle, message: p.logoutConfirm, type: "warning" })) {
      await logout();
      navigate("/login");
    }
  };

  const weekStats = useMemo(() => (profile ? getWeekStats(profile.studyHistory) : null), [profile]);

  const [achievementsOpen, setAchievementsOpen] = useState(false);

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

    const lockedByProgress = ALL_ACHIEVEMENTS.filter((a) => !profile.achievements.includes(a.id))
      .map((a) => ({
        a,
        pct: getAchievementProgress(a, profile, totalCards, collections.length).percentage,
      }))
      .sort((x, y) => y.pct - x.pct)
      .map((x) => x.a);

    return [...unlocked, ...lockedByProgress].slice(0, ACHIEVEMENTS_PREVIEW_COUNT);
  }, [profile, totalCards, collections.length]);

  // Всё, что не попало в превью — раскрывается плавно под ним по клику,
  // а не переключается свапом всего грида
  const restAchievements = useMemo(() => {
    const previewIds = new Set(previewAchievements.map((a) => a.id));
    return ALL_ACHIEVEMENTS.filter((a) => !previewIds.has(a.id));
  }, [previewAchievements]);

  if (profileLoading && !profile)
    return (
      <div className="grid animate-pulse gap-4 sm:gap-5">
        <div className="h-40 rounded-4xl border border-line bg-surface" />
        <div className="grid gap-4 sm:gap-5 md:grid-cols-[7fr_5fr]">
          <div className="h-64 rounded-4xl bg-inset" />
          <div className="h-64 rounded-4xl border border-line bg-surface" />
        </div>
      </div>
    );

  // Заглушка когда профиль не загрузился
  if (!profile && !profileLoading) {
    return (
      <Card padding="lg" className="grid justify-items-center gap-3 py-12 text-center">
        <span className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-inset text-faint">
          <User size={28} />
        </span>
        <Heading size={2}>{p.guestStub.title}</Heading>
        <Text tone="muted" className="max-w-sm">
          {p.guestStub.description}
        </Text>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" iconLeft={<RefreshCw size={16} />} onClick={refreshProfile}>
            {p.guestStub.retry}
          </Button>
          <Button onClick={() => navigate("/login")}>{p.guestStub.toLogin}</Button>
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => profile.achievements.includes(a.id)).length;
  const days = (n: number) => plural(locale, n, t.shell.streak.days);
  const memberSince = new Date(profile.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  // grid-cols-1 = minmax(0, 1fr): без него обрезаемый текст (длинный email) растягивает колонку шире экрана
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5">
      {/* ── Кто ты ── */}
      <Card padding="lg" className="grid grid-cols-1 gap-6">
        {/* На телефоне: аватар и кнопки — первой строкой, имя и данные — второй во всю ширину */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-5 sm:flex-nowrap sm:gap-6">
          <div className="relative shrink-0">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-accent-soft sm:h-28 sm:w-28">
              {editForm.photoURL ? (
                <img
                  src={editForm.photoURL}
                  alt=""
                  className="h-full w-full cursor-grab object-cover active:cursor-grabbing"
                  onDragStart={handleAvatarEasterEgg} // пасхалка: перетащи аватар
                />
              ) : (
                <div
                  draggable // чтобы пасхалка срабатывала и без фото
                  onDragStart={handleAvatarEasterEgg}
                  className="grid h-full w-full place-items-center font-display text-3xl font-extrabold text-accent-ink sm:text-4xl"
                >
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Затемнение + спиннер поверх аватара во время загрузки/сжатия */}
            {isUploadingAvatar && (
              <div className="absolute inset-0 grid place-items-center rounded-full bg-scrim/50 text-on-accent">
                <Spinner size={22} />
              </div>
            )}

            {isEditing && (
              <>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileSelect} />
                <IconButton
                  size="sm"
                  variant="surface"
                  label={p.changePhoto}
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-1 -right-1 shadow-md"
                >
                  <Camera size={16} />
                </IconButton>
              </>
            )}
          </div>

          <div className={cx("min-w-0 flex-1", !isEditing && "order-last basis-full sm:order-none sm:basis-auto")}>
            {isEditing ? (
              <Heading size={3} as="h1">
                {p.edit}
              </Heading>
            ) : (
              <>
                <Heading size={1} className="break-words">
                  {profile.displayName}
                </Heading>
                <p className="mt-1 truncate text-sm text-muted">
                  {editForm.username && <span className="font-semibold text-fg">@{editForm.username}</span>}
                  {editForm.username && profile.email && " · "}
                  {profile.email}
                </p>
                <p className="mt-0.5 text-sm text-faint">{p.memberSince.replace("{date}", memberSince)}</p>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <span className="hidden sm:contents">
                <Button variant="secondary" size="sm" iconLeft={<Pencil size={15} />} onClick={() => setIsEditing(true)}>
                  {p.edit}
                </Button>
              </span>
              <span className="sm:hidden">
                <IconButton variant="surface" label={p.edit} onClick={() => setIsEditing(true)}>
                  <Pencil size={18} />
                </IconButton>
              </span>
              <IconButton label={p.logoutTitle} onClick={handleLogout}>
                <LogOut size={18} />
              </IconButton>
            </div>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleSaveProfile} className="grid gap-4 sm:grid-cols-2">
            <Field label={p.nameLabel} htmlFor="profile-name">
              <Input
                id="profile-name"
                autoComplete="name"
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
              />
            </Field>
            <Field label={p.usernameLabel} hint={p.usernameHint} htmlFor="profile-username">
              <Input
                id="profile-username"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                iconLeft={<AtSign size={16} />}
                placeholder={p.usernamePlaceholder}
                value={editForm.username}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    // Только допустимые символы, сразу в нижнем регистре —
                    // меньше шансов словить ошибку валидации при сохранении
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  })
                }
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-3 sm:col-span-2">
              <Button variant="secondary" onClick={cancelEditing} disabled={isSaving}>
                {p.cancel}
              </Button>
              <Button
                type="submit"
                loading={isSaving}
                disabled={isSaving || isUploadingAvatar || !isValidUsername(normalizeUsername(editForm.username))}
              >
                {p.save}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* ── Серия и цифры ── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-[7fr_5fr]">
        <Card tone={isTodayActive ? "inverse" : "surface"} padding="lg" className="grid content-between gap-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cx(
                  "grid h-10 w-10 place-items-center rounded-full",
                  isTodayActive ? "bg-accent text-on-accent" : "bg-inset text-faint",
                )}
              >
                <Flame size={20} fill={isTodayActive ? "currentColor" : "none"} />
              </span>
              <p className={cx("font-semibold", isTodayActive ? "text-on-inverse" : "text-fg")}>{p.streak.title}</p>
            </div>
            <Text size="sm" tone={isTodayActive ? "inverse" : "muted"} className="tabular-nums">
              {p.streak.record}: {days(profile.longestStreak)}
            </Text>
          </div>
          <div>
            <p
              className={cx(
                "font-display text-6xl font-extrabold leading-none tabular-nums sm:text-7xl",
                isTodayActive ? "text-on-inverse" : "text-fg",
              )}
            >
              {profile.currentStreak}
            </p>
            <Text tone={isTodayActive ? "inverse" : "muted"} className="mt-2">
              {plural(locale, profile.currentStreak, p.streak.inRow)}
            </Text>
          </div>
          <Text size="sm" tone={isTodayActive ? "inverse" : "muted"}>
            {isTodayActive ? t.shell.streak.active : t.shell.streak.inactive}
          </Text>
        </Card>

        <Card padding="lg" className="grid grid-cols-2 gap-x-4 gap-y-6">
          <Stat icon={<BookOpen size={18} />} value={totalCards} label={p.stats.totalWords} />
          <Stat icon={<GalleryVerticalEnd size={18} />} value={profile.stats.flashcardSessions} label={p.stats.sessions} />
          <Stat icon={<ListChecks size={18} />} value={profile.stats.quizzesTaken} label={p.stats.quizzes} />
          <Stat icon={<Clock size={18} />} value={formatDuration(locale, profile.stats.totalStudyTime)} label={p.stats.inLearning} />
        </Card>
      </div>

      {/* ── Неделя и календарь ── */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[1fr_2fr]">
        <Card padding="lg" className="grid content-start gap-4">
          <Heading size={4} as="h2">
            {p.stats.weekTitle}
          </Heading>
          {weekStats && (
            <dl className="grid divide-y divide-line">
              {[
                { label: p.stats.weekSessions, value: weekStats.totalSessions },
                { label: p.stats.cardsStudied, value: weekStats.totalCards },
                { label: p.stats.studyTime, value: formatDuration(locale, weekStats.totalTime) },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <dt className="text-sm text-muted">{row.label}</dt>
                  <dd className="font-display text-xl font-extrabold tabular-nums text-fg">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Card>

        <Card padding="lg" className="grid content-start gap-4">
          <Heading size={4} as="h2">
            {p.activity}
          </Heading>
          <ActivityCalendar studyHistory={profile.studyHistory} />
        </Card>
      </div>

      {/* ── Достижения: превью из 3 (последние разблокированные или ближайшие
          к разблокировке) всегда на месте; остальные плавно раскрываются под ним ── */}
      <section className="mt-4 grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <Heading size={2}>{p.achievements}</Heading>
          <Badge tone="accent" className="tabular-nums">
            {unlockedCount} / {ALL_ACHIEVEMENTS.length}
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {previewAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isUnlocked={profile.achievements.includes(achievement.id)}
              progress={getAchievementProgress(achievement, profile, totalCards, collections.length)}
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
              className="-mt-1 overflow-hidden"
            >
              <div className="grid gap-3 pt-1 md:grid-cols-2 lg:grid-cols-3">
                {restAchievements.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={profile.achievements.includes(achievement.id)}
                    progress={getAchievementProgress(achievement, profile, totalCards, collections.length)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="secondary"
          fullWidth
          aria-expanded={achievementsOpen}
          onClick={() => setAchievementsOpen((o) => !o)}
          iconRight={
            <motion.span animate={{ rotate: achievementsOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="flex">
              <ChevronDown size={16} />
            </motion.span>
          }
        >
          {achievementsOpen ? p.showLess : p.showAll.replace("{n}", String(ALL_ACHIEVEMENTS.length))}
        </Button>
      </section>

      {/* ── Настройки ── */}
      <section className="mt-4 grid gap-4">
        <Heading size={2}>{p.settingsTitle}</Heading>
        <Card padding="none" className="p-2">
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              window.dispatchEvent(new CustomEvent(ONBOARDING_RESTART_EVENT));
            }}
            className="flex w-full items-center gap-4 rounded-3xl px-4 py-3 text-left transition-colors hover:bg-inset focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-ink">
              <RefreshCw size={18} />
            </span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-semibold text-fg">{p.restartTour}</span>
              <span className="text-sm text-muted">{p.restartTourText}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-faint" />
          </button>
        </Card>
      </section>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: ReactNode; label: string }) {
  return (
    <div className="grid content-start gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-inset text-muted">{icon}</span>
      <div>
        <p className="font-display text-2xl font-extrabold leading-tight tabular-nums text-fg sm:text-3xl">{value}</p>
        <p className="mt-1 text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}
