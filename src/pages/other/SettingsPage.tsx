import { useState } from 'react';
import { Bell, Moon, Sun, Globe, ShieldCheck, Trash2, ChevronRight, Smartphone, Info } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getTheme, setTheme as saveTheme } from '../../utils/storage';

export default function SettingsPage() {
  const { language } = useI18n();
  
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [notifications, setNotifications] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setCurrentTheme(theme);
    saveTheme(theme);
    // Принудительно меняем класс на html для мгновенного эффекта
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    (theme === 'dark' ? 'Тёмная тема включена' : 'Светлая тема включена');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Заголовок */}
      <div className="px-4">
        <h1 className="text-4xl font-black tracking-tight mb-2 italic">Настройки</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Управляйте своим опытом в Kolo</p>
      </div>

      {/* 1. ГРУППА: ИНТЕРФЕЙС */}
      <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Smartphone className="text-purple-500" size={24} />
          <h2 className="text-xl font-black">Внешний вид</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-between p-5 rounded-3xl transition-all ${
              currentTheme === 'light' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
              : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <Sun size={24} />
              <span className="font-bold">Светлая</span>
            </div>
            {currentTheme === 'light' && <div className="w-2 h-2 bg-white rounded-full" />}
          </button>

          <button 
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-between p-5 rounded-3xl transition-all ${
              currentTheme === 'dark' 
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30' 
              : 'bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <Moon size={24} />
              <span className="font-bold">Тёмная</span>
            </div>
            {currentTheme === 'dark' && <div className="w-2 h-2 bg-white rounded-full" />}
          </button>
        </div>
      </section>

      {/* 2. ГРУППА: УВЕДОМЛЕНИЯ */}
      <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Bell className="text-blue-500" size={24} />
          <h2 className="text-xl font-black">Уведомления</h2>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl transition-colors">
            <div>
              <p className="font-bold">Напоминания о занятиях</p>
              <p className="text-xs text-gray-500 italic">Помогает поддерживать ваш стрик</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-2xl transition-colors">
            <div>
              <p className="font-bold">Новости и обновления</p>
              <p className="text-xs text-gray-500 italic">Только самые важные изменения</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={marketing} onChange={() => setMarketing(!marketing)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </section>

      {/* 3. ГРУППА: СИСТЕМА И ЯЗЫК */}
      <section className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Globe className="text-green-500" size={24} />
          <h2 className="text-xl font-black">Регион</h2>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-2xl transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                <Globe size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold">Язык приложения</p>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{language === 'ru' ? 'Русский' : 'English'}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </button>
        </div>
      </section>

      {/* 4. ОПАСНАЯ ЗОНА */}
      <section className="bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] p-4 md:p-8 border border-red-100 dark:border-red-900/20">
        <div className="flex items-center gap-3 mb-6 px-2 text-red-600">
          <ShieldCheck size={24} />
          <h2 className="text-xl font-black">Приватность и данные</h2>
        </div>

        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 hover:bg-red-500 hover:text-white rounded-2xl transition-all group shadow-sm">
            <div className="flex items-center gap-4">
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold">Удалить аккаунт</span>
            </div>
            <ChevronRight size={20} className="opacity-50" />
          </button>
        </div>
      </section>

      {/* FOOTER INFO */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <Info size={14} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Kolo v2.4.0 — Euphoria Software</span>
        </div>
      </div>
    </div>
  );
}