import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun, Moon, Globe, Volume2,
  Download, Upload, Trash2, FileJson,
  RefreshCw, Terminal, AlertCircle, Monitor, Target, Bell
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { getThemePref, setTheme as saveTheme, getCollections, getDailyGoal, setDailyGoal } from '../../utils/storage';
import {
  getReminderSettings, saveReminderSettings, getNotificationAccess,
  requestNotificationPermission, scheduleReminder,
  type ReminderSettings, type NotificationAccess,
} from '../../utils/notifications';
import { getSoundEnabled, setSoundEnabled } from '../../utils/sounds';
import {
  exportCollectionsToJSON,
  downloadJSON,
  importCollectionsFromJSON,
  readJSONFile
} from '../../utils/exportImport';
import { saveUserCollection } from '../../firebase/firestore';
import { Language } from '../../locales';
import ConfirmDialog from '../../components/ConfirmDialog';
import Toast from '../../components/ui/Toast';
import { PageHeader, SectionCard, SectionTitle, fadeUp } from '../../components/other/PageSection';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
];

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    role="switch"
    aria-checked={enabled}
    onClick={onToggle}
    className={`relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none ${
      enabled ? 'bg-[#FF5733]' : 'bg-[#E0DBD3] dark:bg-[#2E2C29]'
    }`}
  >
    <span
      className={`absolute left-0 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${
        enabled ? 'translate-x-7' : 'translate-x-1'
      }`}
    />
  </button>
);

export default function SettingsPage() {
  const { t, language, setLanguage } = useI18n();
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm();
  const { success, error, toastState, hideToast } = useToast();

  const s = t.settings;

  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark' | 'system'>(getThemePref());
  const [soundEnabled, setSoundState] = useState(getSoundEnabled());
  const [dailyGoal, setDailyGoalState] = useState(getDailyGoal);
  const [reminder, setReminder] = useState<ReminderSettings>(getReminderSettings);
  const [notifAccess, setNotifAccess] = useState<NotificationAccess>(getNotificationAccess);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setCurrentTheme(theme);
    saveTheme(theme);
  };

  const handleSoundToggle = () => {
    const next = !soundEnabled;
    setSoundState(next);
    setSoundEnabled(next);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifAccess(granted ? 'granted' : 'denied');
  };

  const handleReminderToggle = () => {
    const next = { ...reminder, enabled: !reminder.enabled };
    setReminder(next);
    saveReminderSettings(next);
    scheduleReminder(next);
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const next = { ...reminder, hour, minute };
    setReminder(next);
    saveReminderSettings(next);
    scheduleReminder(next);
  };

  const handleGoalChange = (n: number) => {
    const clamped = Math.max(1, Math.min(200, n));
    setDailyGoalState(clamped);
    setDailyGoal(clamped);
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const collections = await getCollections();
      if (collections.length === 0) {
        error(s.sections.data.noCollections);
        return;
      }
      const json = exportCollectionsToJSON(collections);
      const filename = `kolo-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(json, filename);
      success(s.sections.data.exportSuccess);
    } catch {
      error(s.sections.data.exportError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
        const content = await readJSONFile(file);
        const imported = importCollectionsFromJSON(content);
        if (!user) { error('Sign in to import'); return; }
        for (const coll of imported) {
          await saveUserCollection(user.uid, coll);
        }
        success(`${s.sections.data.importSuccess}: ${imported.length}`);
      } catch {
        error(s.sections.data.importError);
      } finally {
        setIsProcessing(false);
      }
    };
    input.click();
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: s.sections.dangerZone.confirmTitle,
      message: s.sections.dangerZone.confirmMessage,
      type: 'danger',
      confirmText: s.sections.dangerZone.delete,
      cancelText: t.cancel,
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/welcome', { replace: true });
    } catch {
      error(s.sections.dangerZone.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">

      {/* Header */}
      <PageHeader title={s.title} accent="." subtitle={s.subtitle} />

      {/* Appearance */}
      <motion.div {...fadeUp(0.05)}>
        <SectionCard>
          <SectionTitle icon={Sun} label={s.sections.appearance.title} />
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light',  Icon: Sun,     label: s.sections.appearance.light },
              { value: 'system', Icon: Monitor, label: s.sections.appearance.system },
              { value: 'dark',   Icon: Moon,    label: s.sections.appearance.dark },
            ] as const).map(({ value, Icon, label }) => {
              const active = currentTheme === value;
              return (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-col items-center justify-center gap-2.5 py-5 px-3 rounded-2xl border-2 transition-all duration-200 ${
                    active
                      ? 'border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15]'
                      : 'border-[#E0DBD3] dark:border-[#2E2C29] bg-[#F5F2ED] dark:bg-[#0F0E0C] hover:border-[#FF5733]/40'
                  }`}
                >
                  <Icon
                    size={22}
                    className={active ? 'text-[#FF5733]' : 'text-[#B5B0A8]'}
                  />
                  <span className={`font-bold text-xs text-center leading-tight ${active ? 'text-[#FF5733]' : 'text-[#7A756E] dark:text-[#8A867F]'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </motion.div>

      {/* Language */}
      <motion.div {...fadeUp(0.1)}>
        <SectionCard>
          <SectionTitle icon={Globe} label={s.sections.language.title} />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 ${
                    active
                      ? 'border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15]'
                      : 'border-[#E0DBD3] dark:border-[#2E2C29] bg-[#F5F2ED] dark:bg-[#0F0E0C] hover:border-[#FF5733]/40'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`font-bold text-sm ${active ? 'text-[#FF5733]' : 'text-[#7A756E] dark:text-[#8A867F]'}`}>
                    {lang.label}
                  </span>
                  {active && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#FF5733]" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] font-medium leading-relaxed px-1">
            {s.sections.language.recommendation}
          </p>
        </SectionCard>
      </motion.div>

      {/* Daily Goal */}
      <motion.div {...fadeUp(0.13)}>
        <SectionCard>
          <SectionTitle icon={Target} label="Daily Study Goal" />
          <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] font-medium mb-5">
            How many cards do you want to review each day? Your streak depends on meeting this goal.
          </p>

          {/* Preset chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {[5, 10, 15, 20, 30, 50].map(n => (
              <button
                key={n}
                onClick={() => handleGoalChange(n)}
                className={`px-4 py-2 rounded-xl text-sm font-black border-2 transition-all duration-200 ${
                  dailyGoal === n
                    ? 'border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733]'
                    : 'border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] dark:text-[#8A867F] hover:border-[#FF5733]/40'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#B5B0A8]">Custom</span>
            <input
              type="number"
              min={1}
              max={200}
              value={dailyGoal}
              onChange={e => handleGoalChange(Number(e.target.value))}
              className="w-20 px-3 py-2 text-center bg-[#F5F2ED] dark:bg-[#0F0E0C] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-xl font-black text-[#1A1714] dark:text-[#F0EDE8] outline-none transition-colors text-sm"
            />
            <span className="text-xs font-medium text-[#7A756E]">cards / day</span>
          </div>
        </SectionCard>
      </motion.div>

      {/* Daily Reminder */}
      <motion.div {...fadeUp(0.14)}>
        <SectionCard>
          <SectionTitle icon={Bell} label="Daily Reminder" />

          {notifAccess === 'unsupported' && (
            <div className="flex gap-3 p-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] rounded-2xl">
              <AlertCircle size={16} className="text-[#B5B0A8] shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-[#7A756E] dark:text-[#8A867F]">
                Notifications are not supported in your browser.
              </p>
            </div>
          )}

          {notifAccess === 'denied' && (
            <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-1">Notifications blocked</p>
                <p className="text-xs text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                  Enable notifications for Kolo Sets in your browser or system settings to use daily reminders.
                </p>
              </div>
            </div>
          )}

          {notifAccess === 'default' && (
            <div className="space-y-4">
              <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] font-medium leading-relaxed">
                Get a daily nudge to review your cards. The notification fires even when Kolo Sets isn't the active tab.
              </p>
              <button
                onClick={handleEnableNotifications}
                className="flex items-center gap-2 px-5 py-3 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-95 shadow-md shadow-[#FF5733]/25"
              >
                <Bell size={14} />
                Enable notifications
              </button>
            </div>
          )}

          {notifAccess === 'granted' && (
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                reminder.enabled ? 'bg-[#F5F2ED] dark:bg-[#0F0E0C]' : 'bg-[#F5F2ED]/50 dark:bg-[#0F0E0C]/50'
              }`}>
                <div>
                  <p className="font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm">Daily reminder</p>
                  <p className="text-xs text-[#B5B0A8] mt-0.5 font-medium">Notify me to study every day</p>
                </div>
                <Toggle enabled={reminder.enabled} onToggle={handleReminderToggle} />
              </div>

              {reminder.enabled && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] rounded-2xl"
                >
                  <Bell size={15} className="text-[#FF5733] shrink-0" />
                  <span className="text-sm font-bold text-[#1A1714] dark:text-[#F0EDE8]">Remind me at</span>
                  <div className="flex items-center gap-2 ml-auto">
                    <select
                      value={reminder.hour}
                      onChange={e => handleTimeChange(Number(e.target.value), reminder.minute)}
                      className="px-3 py-1.5 bg-white dark:bg-[#1A1917] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-xl font-black text-[13px] text-[#1A1714] dark:text-[#F0EDE8] outline-none transition-colors text-center"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                      ))}
                    </select>
                    <span className="font-black text-[#B5B0A8]">:</span>
                    <select
                      value={reminder.minute}
                      onChange={e => handleTimeChange(reminder.hour, Number(e.target.value))}
                      className="px-3 py-1.5 bg-white dark:bg-[#1A1917] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-xl font-black text-[13px] text-[#1A1714] dark:text-[#F0EDE8] outline-none transition-colors text-center"
                    >
                      {[0, 15, 30, 45].map(m => (
                        <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </SectionCard>
      </motion.div>

      {/* Sound */}
      <motion.div {...fadeUp(0.15)}>
        <SectionCard>
          <SectionTitle icon={Volume2} label={s.sections.sound.title} />
          <div className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
            soundEnabled ? 'bg-[#F5F2ED] dark:bg-[#0F0E0C]' : 'bg-[#F5F2ED]/50 dark:bg-[#0F0E0C]/50'
          }`}>
            <div>
              <p className="font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm">{s.sections.sound.effects}</p>
              <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] mt-0.5 font-medium">{s.sections.sound.effectsDesc}</p>
            </div>
            <Toggle enabled={soundEnabled} onToggle={handleSoundToggle} />
          </div>
        </SectionCard>
      </motion.div>

      {/* Data Management */}
      <motion.div {...fadeUp(0.2)}>
        <SectionCard>
          <SectionTitle icon={FileJson} label={s.sections.data.title} />
          <div className="space-y-3">
            {/* Export */}
            <div className="flex items-center gap-4 p-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] rounded-2xl">
              <div className="w-10 h-10 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-xl flex items-center justify-center shrink-0">
                <Download size={18} className="text-[#FF5733]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm">{s.sections.data.export}</p>
                <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] mt-0.5 font-medium truncate">{s.sections.data.exportDesc}</p>
              </div>
              <button
                onClick={handleExport}
                disabled={isProcessing}
                className="shrink-0 flex items-center gap-2 px-4 py-2 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#FF5733] hover:dark:bg-[#FF5733] hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <FileJson size={14} />}
                JSON
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center gap-4 p-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] rounded-2xl">
              <div className="w-10 h-10 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-xl flex items-center justify-center shrink-0">
                <Upload size={18} className="text-[#FF5733]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm">{s.sections.data.import}</p>
                <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] mt-0.5 font-medium truncate">{s.sections.data.importDesc}</p>
              </div>
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="shrink-0 flex items-center gap-2 px-4 py-2 border-2 border-[#1A1714] dark:border-[#F0EDE8] text-[#1A1714] dark:text-[#F0EDE8] rounded-xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-[#1A1714] hover:text-white dark:hover:bg-[#F0EDE8] dark:hover:text-[#0F0E0C] transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <Terminal size={14} />}
                .json
              </button>
            </div>

            <div className="flex gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-600 dark:text-amber-500 font-bold uppercase tracking-tight leading-tight">
                Only Kolo .json backup files are supported for import
              </p>
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {/* Danger Zone */}
      <motion.div {...fadeUp(0.25)}>
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/30 rounded-[2.5rem] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <h2 className="text-base font-black uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
              {s.sections.dangerZone.title}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white/60 dark:bg-red-950/30 rounded-2xl border border-red-200/40 dark:border-red-900/20">
            <div className="flex-1">
              <p className="font-bold text-[#1A1714] dark:text-[#F0EDE8] text-sm mb-1">
                {s.sections.dangerZone.delete}
              </p>
              <p className="text-xs text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                {s.sections.dangerZone.deleteDesc}
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-60 shadow-sm"
            >
              {isDeleting
                ? <><RefreshCw size={14} className="animate-spin" />{s.sections.dangerZone.deleting}</>
                : <><Trash2 size={14} />{s.sections.dangerZone.delete}</>
              }
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        {...confirmState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <Toast {...toastState} onClose={hideToast} />
    </div>
  );
}
