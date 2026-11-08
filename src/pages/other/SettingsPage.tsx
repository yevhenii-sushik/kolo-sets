import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Download, KeyRound, LogOut, Monitor, Moon, Sun, Trash2, Upload } from "lucide-react";
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
import { getSoundEnabled, setSoundEnabled } from "../../utils/sounds";
import { APP_LANGUAGES, getLanguageInfo } from "../../locales/languages";
import { plural } from "../../utils/plural";
import { Alert, Button, Card, Input, Select, Switch } from "../../ui";
import ConfirmDialog from "../../components/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import { OptionButton, PageHeader, Section, SettingRow } from "../../components/other/PageSection";
import { ONBOARDING_STORAGE_KEY } from "../../components/OnboardingModal";

type Theme = "light" | "dark" | "system";

const GOAL_PRESETS = [5, 10, 15, 20, 30, 50];
const pad = (n: number) => String(n).padStart(2, "0");

// Настройки — всё про аккаунт и приложение на одной странице: аккаунт (вход, пароль, выход),
// предпочтения, резервная копия, знакомство с приложением и в самом низу — удаление аккаунта.
// На эту страницу ссылаются юридические документы («Ещё → Настройки»)
export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const s = t.settings;
  const locale = getLanguageInfo(language).htmlLang;
  const { user, logout, resetPassword, deleteAccount } = useAuth();
  const { refreshCollections } = useData();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const [currentTheme, setCurrentTheme] = useState<Theme>(getThemePref());
  const [soundEnabled, setSoundState] = useState(getSoundEnabled());
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal);
  const [reminder, setReminder] = useState<ReminderSettings>(getReminderSettings);
  const [notifAccess, setNotifAccess] = useState<NotificationAccess>(getNotificationAccess);
  const [busy, setBusy] = useState<"export" | "import" | "password" | "delete" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasPassword = !!user?.providerData.some((p) => p.providerId === "password");
  const hasGoogle = !!user?.providerData.some((p) => p.providerId === "google.com");

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    saveTheme(theme);
  };

  const handleSoundToggle = (next: boolean) => {
    setSoundState(next);
    setSoundEnabled(next);
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

  const themes = [
    { value: "light", Icon: Sun, label: s.appearance.light },
    { value: "system", Icon: Monitor, label: s.appearance.system },
    { value: "dark", Icon: Moon, label: s.appearance.dark },
  ] as const;

  const method = [hasPassword && s.account.methods.password, hasGoogle && s.account.methods.google].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={s.title} subtitle={s.subtitle} />

      {/* ── Аккаунт: кто вошёл, пароль, выход ── */}
      <Section title={s.account.title}>
        <dl className="grid gap-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <dt className="text-muted">{s.account.email}</dt>
            <dd className="min-w-0 truncate font-semibold text-fg">{user?.email}</dd>
          </div>
          {method && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
              <dt className="text-muted">{s.account.method}</dt>
              <dd className="font-semibold text-fg">{method}</dd>
            </div>
          )}
        </dl>
        <div className="grid gap-3">
          {hasPassword && (
            <ActionRow
              icon={<KeyRound size={18} />}
              title={s.account.changePassword}
              description={s.account.changePasswordDesc}
              action={
                <Button variant="secondary" size="sm" loading={busy === "password"} disabled={busy !== null} onClick={handlePassword}>
                  {s.account.send}
                </Button>
              }
            />
          )}
          <ActionRow
            icon={<LogOut size={18} />}
            title={s.account.logout}
            description={s.account.logoutDesc}
            action={
              <Button variant="secondary" size="sm" disabled={busy !== null} onClick={handleLogout}>
                {s.account.logout}
              </Button>
            }
          />
        </div>
      </Section>

      <Section title={s.appearance.title}>
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ value, Icon, label }) => (
            <OptionButton
              key={value}
              active={currentTheme === value}
              onClick={() => handleThemeChange(value)}
              className="grid justify-items-center gap-2 px-2 py-4"
            >
              <Icon size={22} />
              <span className="text-center leading-tight">{label}</span>
            </OptionButton>
          ))}
        </div>
      </Section>

      <Section title={s.language.title} description={s.language.hint}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {APP_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <OptionButton
                key={lang.code}
                active={active}
                onClick={() => setLanguage(lang.code)}
                className="flex h-12 items-center gap-3 px-4 text-left"
              >
                <span aria-hidden className="text-xl leading-none">
                  {lang.flag}
                </span>
                <span lang={lang.code} className="flex-1 truncate">
                  {lang.label}
                </span>
                {active && <Check size={18} className="shrink-0" />}
              </OptionButton>
            );
          })}
        </div>
      </Section>

      <Section title={s.goal.title} description={s.goal.hint}>
        <div className="flex flex-wrap gap-2">
          {GOAL_PRESETS.map((n) => (
            <OptionButton key={n} active={dailyGoal === n} onClick={() => handleGoalChange(n)} className="h-11 min-w-14 px-4 tabular-nums">
              {n}
            </OptionButton>
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
      </Section>

      <Section title={s.reminder.title}>
        {notifAccess === "unsupported" && <Alert tone="info">{s.reminder.unsupported}</Alert>}

        {notifAccess === "denied" && (
          <Alert tone="warning">
            <p className="font-semibold">{s.reminder.blockedTitle}</p>
            <p className="mt-0.5 font-normal">{s.reminder.blockedText}</p>
          </Alert>
        )}

        {notifAccess === "default" && (
          <div className="grid justify-items-start gap-4">
            <p className="text-sm text-muted">{s.reminder.intro}</p>
            <Button variant="soft" iconLeft={<Bell size={16} />} onClick={handleEnableNotifications}>
              {s.reminder.enable}
            </Button>
          </div>
        )}

        {notifAccess === "granted" && (
          <div className="grid gap-4">
            <SettingRow
              title={s.reminder.toggle}
              description={s.reminder.intro}
              control={<Switch checked={reminder.enabled} onChange={(enabled) => updateReminder({ enabled })} label={s.reminder.toggle} />}
            />
            {reminder.enabled && (
              <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
                <span className="text-sm font-medium text-fg">{s.reminder.time}</span>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={s.reminder.hour}
                    value={reminder.hour}
                    onChange={(e) => updateReminder({ hour: Number(e.target.value) })}
                    className="w-24"
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
                    className="w-24"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        {pad(m)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title={s.sound.title}>
        <SettingRow
          title={s.sound.effects}
          description={s.sound.effectsDesc}
          control={<Switch checked={soundEnabled} onChange={handleSoundToggle} label={s.sound.effects} />}
        />
      </Section>

      {/* ── Резервная копия наборов ── */}
      <Section title={s.data.backup} description={s.data.importNote}>
        <div className="grid gap-3">
          <ActionRow
            icon={<Download size={18} />}
            title={s.data.export}
            description={s.data.exportDesc}
            action={
              <Button variant="secondary" size="sm" loading={busy === "export"} disabled={busy !== null} onClick={handleExport}>
                {s.data.exportButton}
              </Button>
            }
          />
          <ActionRow
            icon={<Upload size={18} />}
            title={s.data.import}
            description={s.data.importDesc}
            action={
              <>
                <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
                <Button variant="secondary" size="sm" loading={busy === "import"} disabled={busy !== null} onClick={() => fileRef.current?.click()}>
                  {s.data.importButton}
                </Button>
              </>
            }
          />
        </div>
      </Section>

      {/* Тур открывается на главной: сбрасываем отметку «знакомство пройдено» и уходим туда */}
      <Section title={s.tour.title}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="min-w-0 flex-1 basis-60 text-sm text-muted">{s.tour.hint}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              localStorage.removeItem(ONBOARDING_STORAGE_KEY);
              navigate("/");
            }}
          >
            {s.tour.button}
          </Button>
        </div>
      </Section>

      {/* ── Удаление аккаунта — отдельно и в самом низу, чтобы не нажать случайно ── */}
      <Section title={s.account.dangerTitle} className="border-danger/40">
        <div className="grid justify-items-start gap-4 sm:flex sm:items-center sm:justify-between">
          <p className="text-sm text-muted">{s.account.deleteDesc}</p>
          <Button
            variant="danger"
            iconLeft={<Trash2 size={16} />}
            loading={busy === "delete"}
            disabled={busy !== null && busy !== "delete"}
            onClick={handleDeleteAccount}
            className="shrink-0"
          >
            {busy === "delete" ? s.account.deleting : s.account.delete}
          </Button>
        </div>
      </Section>

      <ConfirmDialog {...confirmState} onConfirm={handleConfirm} onCancel={handleCancel} />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}

function ActionRow({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action: ReactNode }) {
  return (
    <Card tone="inset" padding="sm" radius="lg" className="grid gap-3 sm:flex sm:items-center sm:gap-4">
      <span className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-surface text-accent-ink sm:grid">{icon}</span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="font-semibold text-fg">{title}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {/* На телефоне кнопка уходит под текст — иначе описание сжимается в узкую колонку */}
      <div className="shrink-0">{action}</div>
    </Card>
  );
}
