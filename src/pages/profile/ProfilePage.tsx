import { useState, useEffect, useMemo, useRef, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import { useData } from "../../contexts/DataContext";
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
import { OrbitRing } from "../../components/progress/OrbitRing";
import { RepairLine, Shields, WeekDays, WeekStatus } from "../../components/progress/WeekOrbit";
import { OrbitGoalModal } from "../../components/progress/OrbitGoalModal";
import { AvatarFrame } from "../../components/rewards/AvatarFrame";
import { BackgroundArt, TitleBadge } from "../../components/rewards/ItemArt";
import { CapsuleArt } from "../../components/rewards/CapsuleArt";
import { CapsuleOpenModal } from "../../components/rewards/CapsuleOpenModal";
import { ShowcaseModal, ShowcaseTile } from "../../components/rewards/Showcase";
import { COLLECTIONS, collectionItems } from "../../../server/core/items";
import { BETA_MEDAL, SHOWCASE_MAX } from "../../../server/core/loot";
import Toast from "../../components/ui/Toast";
import {
  AtSign,
  BookOpen,
  Camera,
  ChevronDown,
  Clock,
  Flame,
  FlaskConical,
  GalleryVerticalEnd,
  Gift,
  ListChecks,
  Medal,
  Pencil,
  RefreshCw,
  Target,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge, Button, ButtonLink, Card, Field, Heading, IconButton, Input, Spinner, Text, cx } from "../../ui";

const ACHIEVEMENTS_PREVIEW_COUNT = 3;

// Профиль (docs/specs/02-progression.md): кто ты и твой уровень → орбита недели → медали | статистика
export default function ProfilePage() {
  const { t, language } = useI18n();
  const p = t.profile;
  const locale = getLanguageInfo(language).htmlLang;
  const navigate = useNavigate();
  const { user } = useAuth();
  // Профиль — про весь аккаунт: слова и наборы всех курсов
  const {
    profile: rawProfile,
    allTotalCards: totalCards,
    allCollections: collections,
    profileLoading,
    refreshProfile,
    progression,
    loot,
  } = useData();
  const [capsuleOpen, setCapsuleOpen] = useState(false);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const r = t.rewards;
  const orbit = progression?.orbit;
  const level = progression?.xp ?? null;
  const legacyFlames: number | null = typeof rawProfile?.legacyFlames === "number" ? rawProfile.legacyFlames : null;
  const [tab, setTab] = useState<"medals" | "stats">("medals");
  const [goalOpen, setGoalOpen] = useState(false);
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
      <Card padding="lg" className="relative grid grid-cols-1 gap-6 overflow-hidden">
        {/* Фон профиля — полоса сверху; аватар заходит на неё снизу */}
        {!isEditing && (
          <div aria-hidden className={cx("absolute inset-x-0 top-0 h-24 sm:h-28", !loot.equipped.background && "bg-linear-to-br from-accent-soft to-special-soft")}>
            {loot.equipped.background && <BackgroundArt id={loot.equipped.background} />}
          </div>
        )}
        {/* На телефоне: аватар и кнопки — первой строкой, имя и данные — второй во всю ширину */}
        <div className={cx("relative flex flex-wrap items-center gap-x-4 gap-y-5 sm:flex-nowrap sm:gap-6", !isEditing && "pt-12 sm:pt-14")}>
          <div className="relative shrink-0">
            <AvatarFrame
              progress={level ? level.into / level.next : 0}
              ring={loot.equipped.ring}
              satellite={isEditing ? undefined : loot.equipped.satellite}
              level={level && !isEditing ? level.level : undefined}
              label={level ? `${p.level.label.replace("{n}", String(level.level))}: ${level.into} / ${level.next}` : profile.displayName}
            >
            <div className="h-full w-full overflow-hidden rounded-full bg-accent-soft">
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
                  className="grid h-full w-full place-items-center font-display text-4xl font-extrabold text-accent-ink"
                >
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            </AvatarFrame>

            {/* Затемнение + спиннер поверх аватара во время загрузки/сжатия */}
            {isUploadingAvatar && (
              <div className="absolute inset-2 grid place-items-center rounded-full bg-scrim/50 text-on-accent">
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
                {loot.equipped.title && <TitleBadge id={loot.equipped.title} className="mt-1.5" />}
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
              {/* На телефоне к наградам ведут точка в нижнем меню и карточка «Коллекции» */}
              <ButtonLink to="/rewards" variant="soft" size="sm" iconLeft={<Gift size={15} />} className="mr-1 hidden sm:inline-flex">
                {r.link}
                {loot.capsules > 0 && (
                  <span className="rounded-full bg-accent px-1.5 text-2xs font-bold tabular-nums text-on-accent">{loot.capsules}</span>
                )}
              </ButtonLink>
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
            </div>
          )}
        </div>

        {level && !isEditing && (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="font-display text-xl font-extrabold text-fg">{p.level.label.replace("{n}", String(level.level))}</p>
              <p className="text-sm text-muted">
                {p.level.total}: <span className="font-semibold tabular-nums text-fg">{level.total.toLocaleString(locale)}</span>
              </p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full bg-special transition-[width] duration-700 ease-out"
                style={{ width: `${Math.round((level.into / level.next) * 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted">
              {p.level.toNext.replace("{into}", String(level.into)).replace("{next}", String(level.next))}
            </p>
          </div>
        )}

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

      {/* ── Орбита недели ── */}
      {orbit && (
        <Card padding="lg" className="grid grid-cols-1 gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <OrbitRing goal={orbit.goal} done={orbit.days.length} closed={orbit.closed} size={64}>
                <span className="font-display text-xl font-extrabold tabular-nums text-fg">{orbit.streak}</span>
              </OrbitRing>
              <div>
                <Heading size={4} as="h2">
                  {p.orbit.title}
                </Heading>
                <p className="text-sm text-muted">{plural(locale, orbit.streak, t.orbit.inRow)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">
                {p.orbit.goal}: <span className="font-semibold text-fg">{plural(locale, orbit.goal, t.orbit.goal.perWeek)}</span>
              </span>
              <Button variant="secondary" size="sm" iconLeft={<Target size={15} />} onClick={() => setGoalOpen(true)}>
                {p.orbit.change}
              </Button>
            </div>
          </div>

          <WeekDays orbit={orbit} />
          <RepairLine orbit={orbit} />
          <WeekStatus orbit={orbit} />

          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted">{p.orbit.record}</dt>
              <dd className="font-display text-2xl font-extrabold tabular-nums text-fg">{orbit.longest}</dd>
            </div>
            <div title={t.orbit.shieldsHint}>
              <dt className="text-sm text-muted">{p.orbit.shields}</dt>
              <dd className="mt-1.5">
                <Shields count={orbit.shields} label={p.orbit.shields} />
              </dd>
            </div>
          </dl>
          {orbit.nextGoal !== undefined && (
            <p className="text-sm text-faint">
              {p.orbit.next.replace("{value}", plural(locale, orbit.nextGoal, t.orbit.goal.perWeek))}
            </p>
          )}
        </Card>
      )}

      {/* ── Витрина и коллекции ── */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-[3fr_2fr]">
        <Card padding="lg" className="grid content-start gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Heading size={4} as="h2">
                {r.showcase.title}
              </Heading>
              <p className="text-sm text-muted">{r.showcase.hint}</p>
            </div>
            <Button variant="secondary" size="sm" iconLeft={<Pencil size={15} />} onClick={() => setShowcaseOpen(true)}>
              {r.showcase.edit}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: SHOWCASE_MAX }, (_, i) => (
              <ShowcaseTile key={i} id={loot.equipped.showcase[i]} />
            ))}
          </div>
        </Card>

        <Card padding="lg" className="grid content-start gap-4">
          <div className="flex items-center justify-between gap-3">
            <Heading size={4} as="h2">
              {r.collections.title}
            </Heading>
            <ButtonLink to="/rewards" variant="ghost" size="sm">
              {r.collections.all}
            </ButtonLink>
          </div>
          <ul className="grid gap-3">
            {COLLECTIONS.map((c) => {
              const items = collectionItems(c.id);
              const owned = items.filter((i) => loot.inventory[i.id]).length;
              return (
                <li key={c.id} className="grid gap-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-fg">
                      {r.collections.names[c.id]}
                      {loot.medals.includes(c.medal) && <Medal size={14} className="text-accent" aria-label={r.collections.complete} />}
                    </span>
                    <span className="tabular-nums text-muted">
                      {r.collections.progress.replace("{n}", String(owned)).replace("{total}", String(items.length))}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-track">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(owned / items.length) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          {loot.capsules > 0 && (
            <button
              type="button"
              onClick={() => setCapsuleOpen(true)}
              className="flex items-center gap-3 rounded-2xl bg-fg p-3 text-left text-on-inverse transition-opacity hover:opacity-90"
            >
              <CapsuleArt size={44} glow />
              <span className="grid">
                <span className="font-semibold">{r.capsules.open}</span>
                <span className="text-sm text-on-inverse/70">{plural(locale, loot.capsules, r.capsules.count)}</span>
              </span>
            </button>
          )}
        </Card>
      </div>

      {/* ── Медали | Статистика ── */}
      <div className="mt-2 flex items-center justify-between gap-3">
        <div role="tablist" aria-label={p.tabs.medals} className="flex w-fit gap-1 rounded-full bg-inset p-1">
          {(["medals", "stats"] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cx(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                tab === id ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
              )}
            >
              {p.tabs[id]}
            </button>
          ))}
        </div>
        {tab === "medals" && (
          <Badge tone="accent" className="tabular-nums">
            {unlockedCount + (legacyFlames ? 1 : 0) + loot.medals.length} /{" "}
            {ALL_ACHIEVEMENTS.length + (legacyFlames ? 1 : 0) + COLLECTIONS.length + (loot.medals.includes(BETA_MEDAL) ? 1 : 0)}
          </Badge>
        )}
      </div>

      {tab === "stats" && (
        <>
          <Card padding="lg" className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
            <Stat icon={<BookOpen size={18} />} value={totalCards} label={p.stats.totalWords} />
            <Stat icon={<GalleryVerticalEnd size={18} />} value={profile.stats.flashcardSessions} label={p.stats.sessions} />
            <Stat icon={<ListChecks size={18} />} value={profile.stats.quizzesTaken} label={p.stats.quizzes} />
            <Stat icon={<Clock size={18} />} value={formatDuration(locale, profile.stats.totalStudyTime)} label={p.stats.inLearning} />
          </Card>

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
        </>
      )}

      {/* ── Медали: памятная за старые огоньки, превью из 3 достижений (последние или ближайшие),
          остальные плавно раскрываются под ним ── */}
      {tab === "medals" && (
      <section className="grid gap-4" aria-label={p.tabs.medals}>
        {loot.medals.includes(BETA_MEDAL) && (
          <Card padding="sm" radius="lg" className="flex items-center gap-4 bg-special-soft">
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-special">
              <FlaskConical size={24} />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <h3 className="font-semibold leading-snug text-fg">{r.medal.beta.name}</h3>
              <p className="text-sm leading-snug text-muted">{r.medal.beta.description}</p>
            </div>
          </Card>
        )}
        {legacyFlames && (
          <Card padding="sm" radius="lg" className="flex items-center gap-4 bg-accent-soft">
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface">
              <Flame size={24} className="fill-accent text-accent" />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <h3 className="font-semibold leading-snug text-fg">{p.legacyFlames.name}</h3>
              <p className="text-sm leading-snug text-muted">{p.legacyFlames.description.replace("{days}", days(legacyFlames))}</p>
            </div>
          </Card>
        )}

        {COLLECTIONS.filter((c) => loot.medals.includes(c.medal)).map((c) => (
          <Card key={c.medal} padding="sm" radius="lg" className="flex items-center gap-4 bg-accent-soft">
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-accent-ink">
              <Medal size={24} />
            </span>
            <div className="grid min-w-0 gap-0.5">
              <h3 className="font-semibold leading-snug text-fg">{r.medal.name.replace("{name}", r.collections.names[c.id])}</h3>
              <p className="text-sm leading-snug text-muted">{r.medal.description}</p>
            </div>
          </Card>
        ))}

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
      )}

      <OrbitGoalModal open={goalOpen} onClose={() => setGoalOpen(false)} />
      <CapsuleOpenModal open={capsuleOpen} onClose={() => setCapsuleOpen(false)} />
      <ShowcaseModal open={showcaseOpen} onClose={() => setShowcaseOpen(false)} />

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
