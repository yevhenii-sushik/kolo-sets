import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpenCheck,
  Check,
  Clock,
  Compass,
  Database,
  Download,
  GraduationCap,
  KeyRound,
  Languages,
  LifeBuoy,
  LogOut,
  Monitor,
  Moon,
  Palette,
  Sun,
  Target,
  Trash2,
  Upload,
  UserRound,
  Volume2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useI18n } from "../../contexts/I18nContext";
import { useConfirm } from "../../hooks/useConfirm";
import { useToast } from "../../hooks/useToast";
import { getCollections, getThemePref, setTheme as saveTheme, getDailyGoal, setDailyGoal } from "../../utils/storage";
import { exportCollectionsToJSON, downloadJSON, importCollectionsFromJSON, readJSONFile } from "../../utils/exportImport";
import { saveUserCollection } from "../../firebase/firestore";
import {
  getReminderSettings,
  saveReminderSettings,
  getNotificationAccess,
  requestNotificationPermission,
  scheduleReminder,
  type ReminderSettings,
  type NotificationAccess,
} from "../../utils/notifications";
import { getSoundEnabled, playSound, setSoundEnabled } from "../../utils/sounds";
import { APP_LANGUAGES, getLanguageInfo } from "../../locales/languages";
import { courseFlag, courseName } from "../../courses/languages";
import { plural } from "../../utils/plural";
import { Button, Input, Modal, Select, Switch, cx } from "../../ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { PageHeader } from "../../components/other/PageSection";
import { Segmented, SettingsGroup, SettingsRow } from "../../components/other/SettingsList";
import { restartOnboarding } from "../../utils/firstRun";

type Theme = "light" | "dark" | "system";

const GOAL_PRESETS = [5, 10, 15, 20, 30, 50];
const pad = (n: number) => String(n).padStart(2, "0");

// Разделы страницы — для оглавления на широком экране
const SECTIONS = [
  { id: "account", icon: UserRound },
  { id: "appearance", icon: Palette },
  { id: "learning", icon: GraduationCap },
  { id: "notifications", icon: Bell },
  { id: "data", icon: Database },
  { id: "help", icon: LifeBuoy },
] as const;

// Настройки — сгруппированный список, как в системных настройках: аккаунт, оформление, обучение,
// уведомления, данные, помощь и отдельно в самом низу — удаление аккаунта. Длинные выборы (язык, цель)
// открываются в окне. На эту страницу ссылаются юридические документы («Ещё → Настройки»)
export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const s = t.settings;
  const locale = getLanguageInfo(language).htmlLang;
  const { user, logout, resetPassword, deleteAccount } = useAuth();
  const { profile, activeCourse, refreshCollections } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [currentTheme, setCurrentTheme] = useState<Theme>(getThemePref());
  const [soundEnabled, setSoundState] = useState(getSoundEnabled());
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal);
  const [reminder, setReminder] = useState<ReminderSettings>(getReminderSettings);
  const [notifAccess, setNotifAccess] = useState<NotificationAccess>(getNotificationAccess);
  const [busy, setBusy] = useState<"export" | "import" | "password" | "delete" | null>(null);
  const [picker, setPicker] = useState<"language" | "goal" | null>(null);
  const [activeSection, setActiveSection] = useState<string>("account");
  const fileRef = useRef<HTMLInputElement>(null);

  const hasPassword = !!user?.providerData.some((p) => p.providerId === "password");
  const hasGoogle = !!user?.providerData.some((p) => p.providerId === "google.com");
  const name = user?.displayName || profile?.displayName || (profile?.username ? `@${profile.username}` : "");
  const photo = user?.photoURL || profile?.photoURL || "";

  // Оглавление подсвечивает раздел, который сейчас в верхней части экрана
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 },
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    saveTheme(theme);
  };

  const handleSoundToggle = (next: boolean) => {
    setSoundState(next);
    setSoundEnabled(next);
    // Включили — сразу слышно, как звучит
    if (next) playSound("answer-correct");
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifAccess(granted ? "granted" : "denied");
  };

  const updateReminder = (patch: Partial<ReminderSettings>) => {
    const next = { ...reminder, ...patch };
    setReminder(next);
    saveReminderSettings(next);
    scheduleReminder(next);
  };

  const handleGoalChange = (n: number) => {
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(1, Math.min(200, Math.round(n)));
    setDailyGoalState(clamped);
    setDailyGoal(clamped);
  };

  // ── Аккаунт

  const handlePassword = async () => {
    if (!user?.email) return;
    setBusy("password");
    try {
      await resetPassword(user.email);
      success(s.account.passwordSent.replace("{email}", user.email));
    } catch {
      error(s.account.passwordError);
    } finally {
      setBusy(null);
    }
  };

  const handleLogout = async () => {
    if (await confirm({ title: t.profile.logoutTitle, message: t.profile.logoutConfirm, type: "warning" })) {
      await logout();
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: s.account.confirmTitle,
      message: s.account.confirmMessage,
      type: "danger",
      confirmText: s.account.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;
    setBusy("delete");
    try {
      await deleteAccount();
      navigate("/welcome", { replace: true });
    } catch {
      error(s.account.deleteError);
    } finally {
      setBusy(null);
    }
  };

  // ── Резервная копия

  const handleExport = async () => {
    setBusy("export");
    try {
      const collections = await getCollections();
      if (collections.length === 0) {
        error(s.data.noCollections);
        return;
      }
      downloadJSON(exportCollectionsToJSON(collections), `kolo-backup-${new Date().toISOString().split("T")[0]}.json`);
      success(s.data.exportSuccess);
    } catch {
      error(s.data.exportError);
    } finally {
      setBusy(null);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // иначе повторный выбор того же файла не сработает
    if (!file) return;
    if (!user) {
      error(s.data.signInToImport);
      return;
    }
    setBusy("import");
    try {
      const imported = importCollectionsFromJSON(await readJSONFile(file));
      // id из файла сохраняются: набор, который уже есть, перезапишется версией из копии
      for (const coll of imported) await saveUserCollection(user.uid, coll);
      await refreshCollections();
      success(plural(locale, imported.length, s.data.importSuccess));
    } catch {
      error(s.data.importError);
    } finally {
      setBusy(null);
    }
  };

  const method = [hasPassword && s.account.methods.password, hasGoogle && s.account.methods.google].filter(Boolean).join(" · ");
  const currentLanguage = getLanguageInfo(language);

  return (
    <div className="mx-auto lg:flex lg:max-w-232 lg:items-start lg:gap-10">
      {/* Оглавление — только на широком экране */}
      <nav aria-label={s.title} className="sticky top-24 hidden w-48 shrink-0 lg:block">
        <ul className="grid gap-0.5">
          {SECTIONS.map(({ id, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  aria-current={active || undefined}
                  className={cx(
                    "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm transition-colors",
                    active ? "bg-accent-soft font-semibold text-accent-ink" : "text-muted hover:bg-inset hover:text-fg",
                  )}
                >
                  <Icon size={16} />
                  {s.groups[id]}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="grid min-w-0 max-w-2xl flex-1 grid-cols-1 gap-7">
        <PageHeader title={s.title} subtitle={s.subtitle} />

        {/* ── Аккаунт ── */}
        <SettingsGroup id="account" title={s.groups.account}>
          <div className="flex items-center gap-4 px-4 py-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-display text-2xl font-extrabold text-accent-ink">
              {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name || "?").replace("@", "").charAt(0).toUpperCase()}
            </span>
            <span className="grid min-w-0 gap-0.5">
              <span className="truncate font-semibold text-fg">{name}</span>
              <span className="truncate text-sm text-muted">{user?.email}</span>
              {method && <span className="truncate text-xs text-faint">{s.account.method}: {method}</span>}
            </span>
          </div>
          <SettingsRow icon={<UserRound size={16} />} tone="accent" title={t.profile.edit} to="/profile" />
          {hasPassword && (
            <SettingsRow
              icon={<KeyRound size={16} />}
              tone="info"
              title={s.account.changePassword}
              description={s.account.changePasswordDesc}
              onClick={handlePassword}
              loading={busy === "password"}
              disabled={busy !== null}
            />
          )}
          <SettingsRow icon={<LogOut size={16} />} title={s.account.logout} onClick={handleLogout} disabled={busy !== null} />
        </SettingsGroup>

        {/* ── Оформление ── */}
        <SettingsGroup id="appearance" title={s.groups.appearance} footnote={s.language.hint}>
          <SettingsRow
            icon={<Palette size={16} />}
            tone="special"
            title={s.appearance.theme}
            below={
              <Segmented<Theme>
                label={s.appearance.theme}
                value={currentTheme}
                onChange={handleThemeChange}
                options={[
                  { value: "light", label: s.appearance.light, icon: <Sun size={15} /> },
                  { value: "system", label: s.appearance.auto, icon: <Monitor size={15} /> },
                  { value: "dark", label: s.appearance.dark, icon: <Moon size={15} /> },
                ]}
              />
            }
          />
          <SettingsRow
            icon={<Languages size={16} />}
            tone="info"
            title={s.language.title}
            value={`${currentLanguage.flag} ${currentLanguage.label}`}
            onClick={() => setPicker("language")}
          />
        </SettingsGroup>

        {/* ── Обучение ── */}
        <SettingsGroup id="learning" title={s.groups.learning} footnote={s.goal.hint}>
          <SettingsRow
            icon={<Target size={16} />}
            tone="accent"
            title={s.goal.title}
            value={plural(locale, dailyGoal, s.goal.value)}
            onClick={() => setPicker("goal")}
          />
          {activeCourse && (
            <SettingsRow
              icon={<BookOpenCheck size={16} />}
              tone="success"
              title={s.courses.title}
              value={`${courseFlag(activeCourse.id, activeCourse.voice) ?? ""} ${courseName(activeCourse.id, locale)}`.trim()}
              to="/courses"
            />
          )}
          <SettingsRow
            icon={<Volume2 size={16} />}
            tone="warning"
            title={s.sound.effects}
            description={s.sound.effectsDesc}
            control={<Switch checked={soundEnabled} onChange={handleSoundToggle} label={s.sound.effects} />}
          />
        </SettingsGroup>

        {/* ── Уведомления ── */}
        <SettingsGroup
          id="notifications"
          title={s.groups.notifications}
          footnote={
            notifAccess === "denied" ? s.reminder.blockedText : notifAccess === "unsupported" ? s.reminder.unsupported : s.reminder.intro
          }
        >
          {notifAccess === "granted" ? (
            <>
              <SettingsRow
                icon={<Bell size={16} />}
                tone="danger"
                title={s.reminder.toggle}
                control={<Switch checked={reminder.enabled} onChange={(enabled) => updateReminder({ enabled })} label={s.reminder.toggle} />}
              />
              {reminder.enabled && (
                <SettingsRow
                  icon={<Clock size={16} />}
                  title={s.reminder.time}
                  control={
                    <span className="flex items-center gap-1.5">
                      <Select
                        aria-label={s.reminder.hour}
                        value={reminder.hour}
                        onChange={(e) => updateReminder({ hour: Number(e.target.value) })}
                        className="w-20"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>
                            {pad(h)}
                          </option>
                        ))}
                      </Select>
                      <span className="font-semibold text-faint">:</span>
                      <Select
                        aria-label={s.reminder.minute}
                        value={reminder.minute}
                        onChange={(e) => updateReminder({ minute: Number(e.target.value) })}
                        className="w-20"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {pad(m)}
                          </option>
                        ))}
                      </Select>
                    </span>
                  }
                />
              )}
            </>
          ) : (
            // Разрешения ещё нет — строка спрашивает его; запрещено или не поддерживается — короткий статус,
            // подробности в пояснении под группой
            <SettingsRow
              icon={<Bell size={16} />}
              tone="danger"
              title={s.reminder.toggle}
              value={
                notifAccess === "default"
                  ? s.reminder.status.enable
                  : notifAccess === "denied"
                    ? s.reminder.status.blocked
                    : s.reminder.status.unsupported
              }
              onClick={notifAccess === "default" ? handleEnableNotifications : undefined}
            />
          )}
        </SettingsGroup>

        {/* ── Данные ── */}
        <SettingsGroup id="data" title={s.groups.data} footnote={`${s.data.importNote} ${s.data.importDesc}.`}>
          <SettingsRow
            icon={<Download size={16} />}
            tone="info"
            title={s.data.export}
            description={s.data.exportDesc}
            onClick={handleExport}
            loading={busy === "export"}
            disabled={busy !== null}
          />
          <SettingsRow
            icon={<Upload size={16} />}
            tone="info"
            title={s.data.import}
            onClick={() => fileRef.current?.click()}
            loading={busy === "import"}
            disabled={busy !== null}
          />
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
        </SettingsGroup>

        {/* ── Помощь: тур открывается на главной — сбрасываем отметку «знакомство пройдено» ── */}
        <SettingsGroup id="help" title={s.groups.help}>
          <SettingsRow
            icon={<Compass size={16} />}
            tone="special"
            title={s.tour.title}
            description={s.tour.hint}
            onClick={() => {
              restartOnboarding(user?.uid);
              navigate("/");
            }}
          />
          <SettingsRow icon={<LifeBuoy size={16} />} tone="success" title={t.other.support} to="/other/support" />
        </SettingsGroup>

        {/* ── Удаление аккаунта — отдельно и в самом низу ── */}
        <SettingsGroup footnote={s.account.deleteDesc}>
          <SettingsRow
            icon={<Trash2 size={16} />}
            danger
            title={busy === "delete" ? s.account.deleting : s.account.delete}
            onClick={handleDeleteAccount}
            loading={busy === "delete"}
            disabled={busy !== null && busy !== "delete"}
          />
        </SettingsGroup>
      </div>

      {/* Язык интерфейса */}
      <Modal open={picker === "language"} onClose={() => setPicker(null)} title={s.language.title} size="sm">
        <div className="grid gap-1">
          {APP_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setPicker(null);
                }}
                aria-pressed={active}
                className={cx(
                  "flex h-12 items-center gap-3 rounded-2xl px-4 text-left font-medium transition-colors",
                  active ? "bg-accent-soft text-accent-ink" : "text-fg hover:bg-inset",
                )}
              >
                <span aria-hidden className="text-xl leading-none">
                  {lang.flag}
                </span>
                <span lang={lang.code} className="flex-1 truncate">
                  {lang.label}
                </span>
                {active && <Check size={18} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Цель на день: готовые варианты и своё число */}
      <Modal
        open={picker === "goal"}
        onClose={() => setPicker(null)}
        title={s.goal.title}
        size="sm"
        footer={<Button onClick={() => setPicker(null)}>{s.goal.done}</Button>}
      >
        <div className="grid gap-5">
          <p className="text-sm text-muted">{s.goal.hint}</p>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={dailyGoal === n}
                onClick={() => handleGoalChange(n)}
                className={cx(
                  "h-12 rounded-2xl border text-base font-semibold tabular-nums transition-colors",
                  dailyGoal === n ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-fg hover:bg-inset",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <label className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-fg">{s.goal.custom}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={200}
              value={dailyGoal}
              onChange={(e) => handleGoalChange(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-muted">{plural(locale, dailyGoal, s.goal.unit)}</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}
