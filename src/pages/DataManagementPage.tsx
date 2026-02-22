import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { getCollections } from '../utils/storage';
import { 
  exportCollectionsToJSON, 
  downloadJSON, 
  importCollectionsFromJSON, 
  readJSONFile 
} from '../utils/exportImport';
import { saveUserCollection } from '../firebase/firestore';
import { 
  Download, 
  Upload, 
  ArrowLeft, 
  Database, 
  ShieldCheck, 
  FileJson, 
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import Toast from '../components/Toast';

export default function DataManagementPage() {
  const navigate = useNavigate();
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
      const filename = `kolo-sets-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(json, filename);
      success('Файл успешно создан и скачан');
    } catch (err) {
      error('Ошибка при экспорте данных');
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
          error('Необходимо войти в систему');
          return;
        }
        
        for (const coll of imported) {
          await saveUserCollection(user.uid, coll);
        }
        
        success(`Успешно импортировано коллекций: ${imported.length}`);
      } catch (err: any) {
        error(`Ошибка импорта: проверьте формат файла`);
      } finally {
        setIsProcessing(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-700">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center gap-2 text-gray-400 hover:text-purple-500 transition-colors mb-8"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-[10px]">Вернуться назад</span>
      </button>

      {/* Заголовок */}
      <div className="flex items-center gap-4 mb-12">
        <div className="p-4 bg-blue-500/10 text-blue-600 rounded-[1.5rem] dark:bg-blue-500/20">
          <Database size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            Данные и <span className="text-blue-600">Бекапы</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Управляйте своей библиотекой слов и сохраняйте прогресс</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Карточка Экспорта */}
        <div className="group relative bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col h-full">
          <div className="flex-1">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Download size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Экспорт данных</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Создайте резервную копию всех ваших коллекций в формате JSON. Это позволит вам сохранить данные локально или перенести их на другое устройство.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle2 size={14} className="text-green-500" /> Все ваши коллекции и слова
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <CheckCircle2 size={14} className="text-green-500" /> Прогресс и история изучения
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportAll}
            disabled={isProcessing}
            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="animate-spin" /> : <Download size={20} />}
            Скачать JSON
          </button>
        </div>

        {/* Карточка Импорта */}
        <div className="group relative bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full">
          <div className="flex-1">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Upload size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Импорт данных</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Восстановите ваши коллекции из ранее созданного JSON файла. Будьте внимательны: это добавит коллекции к вашему текущему списку.
            </p>

            <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl mb-8 flex gap-3">
              <AlertCircle className="text-yellow-500 shrink-0" size={18} />
              <p className="text-[11px] text-yellow-700 dark:text-yellow-400/80 leading-snug">
                Поддерживаются только файлы формата .json, созданные этим приложением.
              </p>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={isProcessing}
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-purple-700 transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="animate-spin" /> : <FileJson size={20} />}
            Выбрать файл
          </button>
        </div>
      </div>

      {/* Инфо-панель безопасности */}
      <div className="mt-12 p-8 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-white/20 dark:border-gray-800 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-xl text-green-500">
          <ShieldCheck size={32} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Ваши данные в безопасности</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Kolo Sets использует локальное хранилище и Firebase для синхронизации. Регулярный экспорт — хороший способ гарантировать, что вы никогда не потеряете свои учебные материалы.
          </p>
        </div>
      </div>

      {/* Toast уведомления */}
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