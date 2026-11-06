import { useState } from "react";
import { Bell, Check, Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { getThemePref, setTheme as saveTheme, getDailyGoal, setDailyGoal } from "../../utils/storage";
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
import { Alert, Button, Input, Select, Switch } from "../../ui";
import { OptionButton, PageHeader, Section, SettingRow } from "../../components/other/PageSection";

type Theme = "light" | "dark" | "system";

const GOAL_PRESETS = [5, 10, 15, 20, 30, 50];
const pad = (n: number) => String(n).padStart(2, "0");

// Настройки — только предпочтения: тема, язык, цель, напоминание, звук.
// Резервная копия и удаление аккаунта — на странице «Данные и аккаунт».
export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const s = t.settings;
  const locale = getLanguageInfo(language).htmlLang;

  const [currentTheme, setCurrentTheme] = useState<Theme>(getThemePref());
  const [soundEnabled, setSoundState] = useState(getSoundEnabled());
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal);
  const [reminder, setReminder] = useState<ReminderSettings>(getReminderSettings);
  const [notifAccess, setNotifAccess] = useState<NotificationAccess>(getNotificationAccess);

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

  const themes = [
    { value: "light", Icon: Sun, label: s.appearance.light },
    { value: "system", Icon: Monitor, label: s.appearance.system },
    { value: "dark", Icon: Moon, label: s.appearance.dark },
  ] as const;

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={s.title} subtitle={s.subtitle} />

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
    </div>
  );
}
