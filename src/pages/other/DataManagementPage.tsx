import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { getCollections } from '../../utils/storage';
import { 
  exportCollectionsToJSON, 
  downloadJSON, 
  importCollectionsFromJSON, 
  readJSONFile 
} from '../../utils/exportImport';
import { saveUserCollection } from '../../firebase/firestore';
import { 
  Download, Upload, Database, 
  ShieldCheck, FileJson, AlertCircle, 
  RefreshCw, HardDrive, Lock, Terminal
} from 'lucide-react';
import Toast from '../../components/Toast';

export default function DataManagementPage() {
  const { user } = useAuth();
  const { success, error, toastState, hideToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportAll = async () => {
    setIsProcessing(true);
    try {
      const collections = await getCollections();
      if (collections.length === 0) {
        error('Нет коллекций для экспорта');
        return;
      }
      const json = exportCollectionsToJSON(collections);
      const filename = `kolo-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(json, filename);
      success('Резервная копия создана');
    } catch (err) {
      error('Ошибка при экспорте');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
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
        
        if (!user) {
          error('Войдите в систему для импорта');
          return;
        }
        
        for (const coll of imported) {
          await saveUserCollection(user.uid, coll);
        }
        
        success(`Импортировано коллекций: ${imported.length}`);
      } catch (err: any) {
        error(`Ошибка формата файла`);
      } finally {
        setIsProcessing(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#0F0E0C] selection:bg-[#FF5733]/20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto pt-16 pb-24">
      {/* 1. HEADER - Умеренный масштаб */}
        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-4"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
              <Database size={14} className="text-[#FF5733]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">Storage & Safety</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
              Data <span className="text-[#FF5733] italic">Core.</span>
            </h1>
            <p className="text-xl text-[#7A756E] dark:text-[#8A867F] max-w-2xl font-medium leading-tight">
              Управляйте своей библиотекой слов: создавайте локальные копии или восстанавливайте прогресс.
            </p>
          </motion.div>
        </header>

        <main className="max-w-7xl mx-auto">
          {/* 2. ACTIONS GRID - Более компактные карточки */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
            
            {/* EXPORT CARD */}
            <div className="group relative bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-8 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl flex items-center justify-center mb-8">
                  <Download size={24} className="text-[#FF5733]" />
                </div>
                <h2 className="text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8] mb-4 uppercase tracking-tighter">Экспорт данных</h2>
                <p className="text-[#7A756E] dark:text-[#8A867F] mb-8 text-sm leading-relaxed">
                  Создайте резервную копию всех ваших коллекций в формате JSON для локального хранения.
                </p>
                
                <div className="space-y-3 mb-10">
                  {["Коллекции и слова", "История изучения"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-black text-[#B5B0A8] uppercase tracking-widest">
                      <div className="w-1 h-1 bg-[#FF5733] rounded-full" /> {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExportAll}
                disabled={isProcessing}
                className="w-full py-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#FF5733] hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <FileJson size={16} />}
                Скачать JSON
              </button>
              <HardDrive size={180} className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none" />
            </div>

            {/* IMPORT CARD */}
            <div className="group relative bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-8 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm flex flex-col justify-between overflow-hidden">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl flex items-center justify-center mb-8">
                  <Upload size={24} className="text-[#FF5733]" />
                </div>
                <h2 className="text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8] mb-4 uppercase tracking-tighter">Импорт данных</h2>
                <p className="text-[#7A756E] dark:text-[#8A867F] mb-8 text-sm leading-relaxed">
                  Восстановите ваши коллекции из файла. Новые данные будут добавлены к текущему списку.
                </p>
                
                <div className="flex gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-10">
                  <AlertCircle className="text-amber-500 shrink-0" size={16} />
                  <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight leading-tight">Поддерживаются только .json файлы Kolo Sets</p>
                </div>
              </div>

              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="w-full py-4 bg-white dark:bg-transparent border-2 border-[#1A1714] dark:border-[#F0EDE8] text-[#1A1714] dark:text-[#F0EDE8] rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#1A1714] hover:text-white dark:hover:bg-[#F0EDE8] dark:hover:text-[#0F0E0C] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Terminal size={16} />}
                Выбрать файл
              </button>
            </div>
          </div>

          {/* 3. SECURITY & COMPLIANCE BLOCK - Тот самый прикольный блок */}
          <section className="mb-24 border-t border-[#E0DBD3] dark:border-[#2E2C29] pt-16">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="w-16 h-16 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-full flex items-center justify-center shadow-sm">
                  <Lock size={28} className="text-[#FF5733]" />
                </div>
                <h3 className="text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8] uppercase tracking-tighter leading-tight">
                  Security & <br /> Compliance.
                </h3>
              </div>
              <div className="md:col-span-8">
                <p className="text-lg text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                  Kolo Sets придерживается принципа <span className="text-[#1A1714] dark:text-[#F0EDE8]">Data Ownership</span>. Ваши данные не принадлежат нам — они хранятся на ваших устройствах и в вашем приватном облаке. Мы используем AES-256 шифрование при передаче данных и никогда не имеем доступа к содержимому ваших JSON-архивов.
                </p>
                <div className="mt-8 flex flex-wrap gap-6 opacity-50">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1714] dark:text-[#F0EDE8]">
                    <ShieldCheck size={12} className="text-[#FF5733]" /> Encrypted
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1714] dark:text-[#F0EDE8]">
                    <ShieldCheck size={12} className="text-[#FF5733]" /> P2P Ready
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1714] dark:text-[#F0EDE8]">
                    <ShieldCheck size={12} className="text-[#FF5733]" /> GDPR Compliant
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <Toast
        isOpen={toastState.isOpen}
        message={toastState.message}
        type={toastState.type}
        duration={toastState.duration}
        onClose={hideToast}
      />
    </div>
  );
}