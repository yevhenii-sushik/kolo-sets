import Sidebar from '../../components/Sidebar';
import BottomNav from '../../components/BottomNav';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Languages, Flame, Trophy, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Language } from '../../utils/i18n';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const SIDEBAR_KEY = 'sidebar-open';

export default function MainLayout() {
  const { language, setLanguage} = useI18n();
  const { user } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showStreakCard, setShowStreakCard] = useState(false);
  const [streakData, setStreakData] = useState({ current: 0, isActive: false, longest: 0 });
  
  const [open, setOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    return saved === null ? true : saved === 'true';
  });

  const toggleSidebar = () => setOpen(o => !o);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, String(open));
  }, [open]);

  // Загрузка данных стрика для хедера
  useEffect(() => {
    const loadStreak = async () => {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid) as any;
        if (profile) {
          const lastDate = profile.lastStudyDate?.toDate?.();
          const today = new Date().toDateString();
          const isActive = lastDate && lastDate.toDateString() === today;
          
          let current = profile.currentStreak || 0;
          // Проверка на обнуление (как в профиле)
          if (lastDate) {
            const diff = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 80 * 60 * 24));
            if (diff > 1) current = 0;
          }

          setStreakData({ current, isActive: !!isActive, longest: profile.longestStreak || 0 });
        }
      } catch (e) {
        console.error("Header streak error:", e);
      }
    };
    loadStreak();
  }, [user]);
  
  const languageNames = {
    en: '🇬🇧 English (UK)',
    ru: '🇷🇺 Русский'
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#0F0E0C] text-gray-900 dark:text-gray-100">
      <header className="fixed top-0 left-0 right-0 z-[100] bg-[#F5F2ED] dark:bg-[#0F0E0C]">
        <div className="px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 mr-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-90"
            >
              <Menu size={22} />
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-1.5 bg-[#FF5733] rounded-lg group-hover:rotate-12 transition-transform shadow-lg shadow-orange-500/25">
                <img src="/icon-192.png" alt="logo" className="w-5 h-5 brightness-0 invert" />
              </div>
              <h1 className="text-xl font-black tracking-tighter">KOLO</h1>
            </Link>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* STREAK WIDGET */}
            <div className="relative">
              <button
                onClick={() => setShowStreakCard(!showStreakCard)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-500 ${
                  streakData.isActive 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 opacity-70 hover:opacity-100'
                }`}
              >
                <Flame 
                  size={18} 
                  fill={streakData.isActive ? "currentColor" : "none"} 
                  className={streakData.isActive ? "animate-pulse" : ""} 
                />
                <span className="font-black text-sm">{streakData.current}</span>
              </button>

              {/* STREAK DROP CARD */}
              <AnimatePresence>
                {showStreakCard && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStreakCard(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-72 z-50 overflow-hidden bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700"
                    >
                      <div className={`p-6 ${streakData.isActive ? 'bg-orange-500' : 'bg-gray-400'} transition-colors`}>
                        <div className="flex justify-between items-start text-white">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Ваш ударный режим</p>
                            <h3 className="text-3xl font-black">{streakData.current} дн.</h3>
                          </div>
                          <Flame size={32} fill="white" className={streakData.isActive ? "animate-bounce" : "opacity-50"} />
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <Trophy size={14} />
                            <span>Рекорд</span>
                          </div>
                          <span className="font-bold">{streakData.longest} дн.</span>
                        </div>
                        
                        {!streakData.isActive ? (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30">
                            <p className="text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
                              Упс! Ваш огонек потух. Пройдите урок сегодня, чтобы зажечь его снова!
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30">
                            <p className="text-xs text-green-600 dark:text-green-400 leading-relaxed">
                              Вы сегодня молодец! Огонек горит ярко. Возвращайтесь завтра.
                            </p>
                          </div>
                        )}

                        <Link 
                          to="/profile" 
                          onClick={() => setShowStreakCard(false)}
                          className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                        >
                          Подробнее в профиле
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                   <Languages size={16} className="text-gray-600 dark:text-gray-400" />
                </div>
                <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">{language}</span>
              </button>
              
              <AnimatePresence>
                {showLangMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 overflow-hidden"
                    >
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLanguage(lang);
                            setShowLangMenu(false);
                          }}
                          className={`w-full px-5 py-3 text-left text-sm font-bold flex items-center justify-between transition-colors ${
                            language === lang 
                              ? 'bg-purple-600 text-white' 
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {languageNames[lang]}
                          {language === lang && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16 pb-20 md:pb-0">
        <Sidebar open={open} />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
      
      <BottomNav />
    </div>
  );
}