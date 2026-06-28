import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun, Moon, Globe, Volume2,
  Download, Upload, Trash2, FileJson,
  RefreshCw, Terminal, AlertCircle, Settings, Monitor
} from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { getThemePref, setTheme as saveTheme, getCollections } from '../../utils/storage';
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

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'no', label: 'Norsk', flag: '🇳🇴' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' as const },
});

const SectionCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-6 md:p-8 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-9 h-9 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15] flex items-center justify-center text-[#FF5733]">
      <Icon size={18} />
    </div>
    <h2 className="text-base font-black uppercase tracking-[0.12em] text-[#1A1714] dark:text-[#F0EDE8]">
      {label}
    </h2>
  </div>
);

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
      <motion.header {...fadeUp(0)} className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1 py-1.5 w-fit rounded-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm pr-4">
          <div className="w-7 h-7 rounded-full bg-[#FFF0ED] dark:bg-[#2A1A15] flex items-center justify-center">
            <Settings size={14} className="text-[#FF5733]" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">
            {s.title}
          </span>
        </div>
        <h1 className="text-5xl md:text-6xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
          {s.title}<span className="text-[#FF5733]">.</span>
        </h1>
        <p className="mt-3 text-[#7A756E] dark:text-[#8A867F] font-medium">{s.subtitle}</p>
      </motion.header>

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

          <div className="flex items-start gap-4 p-5 bg-white/60 dark:bg-red-950/30 rounded-2xl border border-red-200/40 dark:border-red-900/20">
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
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-60 shadow-sm"
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
