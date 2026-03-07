import { Link } from 'react-router-dom';
import { Rocket, Zap, ShieldCheck, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export default function UpdatesPage() {
  const versions = [
    {
      number: "0.2.3",
      status: "Latest",
      date: "Februar 2026",
      type: "UI Update",
      badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      changes: [
        "Глобальное изменение дизайна и пользовательского интерфейса для более современного и чистого вида",
        "Добавлена страница Support с формой обратной связи c командой разработчиков",
        "Смена окна импорта карточек на более современное и удобное интерфейсное решение добавлена кнопка помощи создания карточек при помощи AI",
        "Исправлена ошибка, при которой завершенное достижение могло отображаться как незавершенное",
      ]
    },
    {
      number: "0.2.2",
      status: "Patch",
      date: "Februar 2026",
      type: "Feature Release",
      badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      changes: [
        "Изменена навигация между страницами прочего и обновлений для более интуитивного опыта",
        "Добавлена приветственная страница с обзором функций для новых пользователей",
        "Исправлена критическая ошибка, приводившая к потере страниц при навигации",
        "Исправлена визуальная ошибка преждевременного отображения обновеленной карточкм при ее смене в режиме изучения",
        "Исправлены ошибки визуального отображения на мобильных устройствах",
        "Редизайн в режиие изучения для более чистого и современного вида",
        "Прочий общий редизайн и оптимизация пользовательского интерфейса для более плавного опыта",
      ]
    },
    {
      number: "0.2.1",
      status: "Patch",
      date: "Februar 2026",
      type: "Maintenance",
      badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      changes: [
        "Улучна доступность и адаптивность интерфейса для мобильных устройств",
        "Исправлены мелкие баги и улучшены пользовательские интерфейсы",
        "Оптимизирована производительность приложения"
      ]
    },
    {
      number: "0.2.0",
      status: "Minor",
      date: "Februar 2026",
      type: "Feature Release",
      badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      changes: [
        "Добавлена поддержка синхронизации данных через облако (Cloud Sync)",
        "Реализована критически важная система аккаунтов и авторизации",
        "Добавлена поддержка экспорта и импорта данных в формате JSON",
        "Добавлена функция синтеза речи (Text-to-Speech) для карточек",
        "Добавлена система достижений и уровней для мотивации пользователей",
        "Добавлена система страйков (Огоньков 🔥)",
        "Поддержка нескольких языков интерфейса (локализация)",
        "Детальная статистика и аналитика прогресса пользователя",
      ]
    },
    {
      number: "0.1.2",
      status: "Patch",
      date: "Februar 2026",
      type: "UI Update",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      changes: [
        "Полная поддержка темной темы (Dark Mode)",
        "Адаптивный интерфейс для мобильных устройств",
        "Новый дизайн бокового и нижнего меню"
      ]
    },
    {
      number: "0.1.1",
      status: "Patch",
      date: "Februar 2026",
      type: "UI Update",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      changes: [
        "Улучшенный дизайн главной страницы и интерфейса",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)"
      ]
    },
    {
      number: "0.1.0",
      status: "Minor",
      date: "January 2026",
      type: "Feature Release",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      changes: [
        "Первый публичный релиз",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)",
        "Локальное хранилище данных (localStorage)"
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-24 space-y-24">
      
      {/* 1. HERO HEADER */}
      <header className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-100 dark:border-purple-800 tracking-wider uppercase">
          <Clock size={14} /> Changelog & Roadmap
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
          Что <span className="text-purple-600 font-serif italic">нового?</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Мы постоянно работаем над тем, чтобы сделать ваше изучение норвежского языка продуктивнее. Вот путь, который мы прошли.
        </p>
      </header>

      {/* 2. QUICK STATS (Bento) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Rocket size={20}/>, label: "Статус", val: "Active" },
          { icon: <Sparkles size={20}/>, label: "Релизов", val: "6+" },
          { icon: <Zap size={20}/>, label: "Скорость", val: "99/100" },
          { icon: <ShieldCheck size={20}/>, label: "Безопасность", val: "SSL" },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center text-center space-y-2">
            <div className="text-purple-600 dark:text-purple-400 mb-2">{item.icon}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{item.label}</div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{item.val}</div>
          </div>
        ))}
      </section>

      {/* 3. TIMELINE SECTION */}
      <section className="relative">
        <div className="flex items-center gap-4 mb-16">
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
             История версий
          </h2>
          <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
        </div>

        <div className="space-y-20 relative">
          {/* Вертикальная линия */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500 via-blue-500 to-transparent opacity-20 hidden md:block"></div>

          {versions.map((v, i) => (
            <div key={v.number} className={`relative flex flex-col md:flex-row gap-8 md:gap-0 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Центральный индикатор */}
              <div className="absolute left-0 md:left-1/2 -translate-x-1/2 top-0 z-10 hidden md:block">
                <div className="w-10 h-10 bg-white dark:bg-gray-900 border-4 border-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 rotate-45 group-hover:rotate-90 transition-transform">
                   <div className="-rotate-45 text-[10px] font-black">{v.number.split('.').pop()}</div>
                </div>
              </div>

              {/* Контентная часть */}
              <div className="w-full md:w-[45%] group">
                <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${v.badgeClass}`}>
                      {v.status}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">{v.date}</span>
                  </div>
                  
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2">v{v.number}</h3>
                  <p className="text-purple-600 dark:text-purple-400 font-bold text-sm mb-6 flex items-center gap-2">
                     <Zap size={14} /> {v.type}
                  </p>

                  <ul className="space-y-4">
                    {v.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-600 dark:text-gray-300 group/item">
                        <div className="mt-1.5 transition-transform group-hover/item:scale-125">
                          <CheckCircle2 size={16} className="text-purple-500" />
                        </div>
                        <span className="text-sm leading-relaxed">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Пустая половина для симметрии (на десктопе) */}
              <div className="hidden md:block w-[45%]"></div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FOOTER / CALL TO ACTION */}
      <section className="bg-purple-600 rounded-[3rem] p-12 text-center text-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
          <Rocket size={120} />
        </div>
        <h2 className="text-3xl font-bold">Это только начало</h2>
        <p className="text-purple-100 max-w-xl mx-auto">
          У нас большие планы на 2026 год: интеграция историй, групповые челленджи и еще больше нового контента
        </p>
        <Link
          to="/support"
          className="relative group px-8 py-4 bg-white text-purple-600 font-black rounded-2xl hover:bg-gray-100 transition-all shadow-xl active:scale-95"
        >
          Предложить функцию
        </Link>
      </section>

      <footer className="pt-12 border-t border-gray-100 dark:border-gray-800 text-center">
        <p className="text-gray-400 text-sm">
          Built with <HeartIcon /> by <span className="font-bold text-gray-900 dark:text-white">Euphoria Software</span>
        </p>
      </footer>
    </div>
  );
}

function HeartIcon() {
  return <span className="inline-block animate-pulse text-red-500">❤️</span>;
}