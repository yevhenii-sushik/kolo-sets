import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, Zap, PocketKnife, Sparkles, 
  History, Layout, Bug, Terminal, 
  CheckCircle2, ChevronRight, Milestone,
  Cloud, Smartphone, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UpdatesPage() {
  const [activeVersion, setActiveVersion] = useState("0.2.3");

  const versions = [
    {
      number: "0.2.5",
      status: "Latest",
      date: "March 2026",
      type: "UI Update",
      icon: <Layout size={20} />,
      badgeClass: "bg-[#FFF0ED] text-[#FF5733] dark:bg-[#2A1A15]",
      changes: [
        "Масштабная реструктуризация навигации: раздел Words стал отдельным центром управления вашим словарем, освободив место для новой интерактивной Dashboard-панели",
        "Запуск обновленной Home-страницы — теперь это ваш персональный хаб с ключевой статистикой, полезными виджетами и быстрым доступом к прогрессу",
        "Библиотека Words теперь включает эксклюзивные коллекции слов, сегментированные по уровням владения языком (от Beginner до Advanced) с регулярным пополнением контента",
        "Глобальное обновление дизайн-кода и интерфейса для достижения безупречной визуальной чистоты и современного пользовательского опыта",
      ]
    },
    {
      number: "0.2.4",
      status: "Patch",
      date: "March 2026",
      type: "Maintenance",
      icon: <Bug size={20} />,
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
      changes: [
        "В ходе планового мониторинга была выявлена потенциальная уязвимость в конфигурации API-интерфейсов. В целях обеспечения безопасности пользовательских данных и предотвращения несанкционированного доступа, защитные алгоритмы хостинг-провайдера инициировали экстренную заморозку серверного ядра. Нами была проведена полная ревизия протоколов безопасности, после чего работоспособность системы была восстановлена в штатном режиме"
      ]
    },
    {
      number: "0.2.3",
      status: "Patch",
      date: "Februar 2026",
      type: "UI Update",
      icon: <Sparkles size={20} />,
      badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30",
      changes: [
        "Глобальное изменение дизайна и пользовательского интерфейса для более современного и чистого вида",
        "Добавлена страница Support с формой обратной связи c командой разработчиков",
        "Смена окна импорта карточек на более современное и удобное интерфейсное решение + кнопка AI помощи",
        "Исправлена ошибка, при которой завершенное достижение могло отображаться как незавершенное",
      ]
    },
    {
      number: "0.2.2",
      status: "Patch",
      date: "Februar 2026",
      type: "Feature Release",
      icon: <PocketKnife size={20} />,
      badgeClass: "bg-[#C8E6C9] text-[#1B5E20] dark:bg-[#0A2F10]",
      changes: [
        "Изменена навигация между страницами прочего и обновлений для более интуитивного опыта",
        "Добавлена приветственная страница с обзором функций для новых пользователей",
        "Исправлена критическая ошибка, приводившая к потере страниц при навигации",
        "Исправлена визуальная ошибка преждевременного отображения карточки в режиме изучения",
        "Исправлены ошибки визуального отображения на мобильных устройствах",
        "Редизайн в режиме изучения для более чистого и современного вида",
        "Прочий общий редизайн и оптимизация пользовательского интерфейса",
      ]
    },
    {
      number: "0.2.1",
      status: "Patch",
      date: "Februar 2026",
      type: "Maintenance",
      icon: <Bug size={20} />,
      badgeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/30",
      changes: [
        "Улучшена доступность и адаптивность интерфейса для мобильных устройств",
        "Исправлены мелкие баги и улучшены пользовательские интерфейсы",
        "Оптимизирована производительность приложения"
      ]
    },
    {
      number: "0.2.0",
      status: "Minor",
      date: "Februar 2026",
      type: "Core Update",
      icon: <Cloud size={20} />,
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30",
      changes: [
        "Добавлена поддержка синхронизации данных через облако (Cloud Sync)",
        "Реализована критически важная система аккаунтов и авторизации",
        "Добавлена поддержка экспорта и импорта данных в формате JSON",
        "Добавлена функция синтеза речи (Text-to-Speech) для карточек",
        "Добавлена система достижений и уровней для мотивации",
        "Добавлена система страйков (Огоньков 🔥)",
        "Поддержка нескольких языков интерфейса (локализация)",
        "Детальная статистика и аналитика прогресса пользователя",
      ]
    },
    {
      number: "0.1.2",
      status: "Legacy",
      date: "Februar 2026",
      type: "UI Update",
      icon: <Smartphone size={20} />,
      badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800",
      changes: [
        "Полная поддержка темной темы (Dark Mode)",
        "Адаптивный интерфейс для мобильных устройств",
        "Новый дизайн бокового и нижнего меню"
      ]
    },
    {
      number: "0.1.1",
      status: "Legacy",
      date: "Februar 2026",
      type: "UI Update",
      icon: <Layout size={20} />,
      badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800",
      changes: [
        "Улучшенный дизайн главной страницы и интерфейса",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)"
      ]
    },
    {
      number: "0.1.0",
      status: "Initial",
      date: "January 2026",
      type: "Feature Release",
      icon: <Milestone size={20} />,
      badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800",
      changes: [
        "Первый публичный релиз",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)",
        "Локальное хранилище данных (localStorage)"
      ]
    }
  ];

  // --- ЛОГИКА АВТОМАТИЧЕСКОЙ ПОДСВЕТКИ (SCROLL SPY) ---
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px', // Срабатывает, когда секция в центре экрана
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const versionId = entry.target.id.replace('v-', '');
          setActiveVersion(versionId);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    versions.forEach((v) => {
      const el = document.getElementById(`v-${v.number}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToVersion = (number: string) => {
    const element = document.getElementById(`v-${number}`);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      window.scrollTo({
        top: elementRect - bodyRect - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="transition-colors duration-500">
      
      {/* HEADER */}
      <header className="mb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
            <History size={14} className="text-[#FF5733]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">Changelog</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
            Kolo <span className="text-[#FF5733] italic">Evolution.</span>
          </h1>
          <p className="text-xl text-[#7A756E] dark:text-[#8A867F] max-w-2xl font-medium leading-tight">
            Мы постоянно работаем над тем, чтобы сделать ваше изучение норвежского языка продуктивнее.
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="sticky top-24 space-y-2 max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-6 ml-4">Дерево версий</p>
            <div className="space-y-1 relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-[#E0DBD3] dark:bg-[#2E2C29] -z-10" />
              
              {versions.map((v) => (
                <button
                  key={v.number}
                  onClick={() => scrollToVersion(v.number)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-500 group ${
                    activeVersion === v.number 
                    ? "bg-[#1A1714] text-white dark:bg-[#F0EDE8] dark:text-[#0F0E0C]" 
                    : "hover:bg-white/50 dark:hover:bg-[#1A1917] text-[#7A756E] dark:text-[#8A867F]"
                  }`}
                >
                  <div className={`w-[6px] h-[6px] rounded-full transition-all duration-500 ${
                    activeVersion === v.number ? "bg-[#FF5733] scale-150 shadow-[0_0_10px_#FF5733]" : "bg-[#B5B0A8]"
                  }`} />
                  <span className="font-black text-sm tracking-tight">v{v.number}</span>
                  <ChevronRight size={14} className={`ml-auto transition-transform ${activeVersion === v.number ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* CONTENT LIST */}
        <main className="lg:col-span-9 space-y-32">
          
          {/* STATS BENTO */}
          {/* 2. PRODUCT PULSE BENTO */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { 
                icon: <Zap size={20}/>, 
                label: "Интенсивность", 
                val: "Weekly", 
                sub: "Цикл обновлений" 
              },
              { 
                icon: <CheckCircle2 size={20}/>, 
                label: "Улучшений", 
                val: versions.reduce((acc, v) => acc + v.changes.length, 0), 
                sub: "Всего изменений" 
              },
              { 
                icon: <Cloud size={20}/>, 
                label: "Статус систем", 
                val: "Online", 
                sub: "Cloud Sync Active" 
              },
              { 
                icon: <Users size={20}/>, 
                label: "Фидбек", 
                val: "100%", 
                sub: "Community Driven" 
              },
            ].map((item, i) => (
              <div key={i} className="group p-6 bg-white dark:bg-[#1A1917] rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29] flex flex-col items-start text-left space-y-1 shadow-sm hover:border-[#FF5733] transition-all duration-500">
                <div className="text-[#FF5733] mb-3 p-3 bg-[#F5F2ED] dark:bg-[#242220] rounded-2xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div className="text-[10px] font-black text-[#B5B0A8] uppercase tracking-[0.15em]">{item.label}</div>
                <div className="text-2xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tighter">{item.val}</div>
                <div className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F]">{item.sub}</div>
              </div>
            ))}
          </section>

          {/* VERSION SECTIONS */}
          {versions.map((v) => (
            <section 
              key={v.number} 
              id={`v-${v.number}`}
              className="scroll-mt-32"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/5">
                    <div className="sticky top-24">
                      <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${v.badgeClass}`}>
                        {v.icon} {v.status}
                      </span>
                      <h3 className="text-5xl font-black mt-2 text-[#1A1714] dark:text-[#F0EDE8] tracking-tighter">v{v.number}</h3>
                      <p className="text-[#B5B0A8] font-bold text-xs uppercase tracking-widest mt-2">{v.date}</p>
                    </div>
                </div>

                <div className="md:w-4/5 bg-white dark:bg-[#1A1917] rounded-[2.5rem] p-10 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="flex items-center gap-3 mb-8 text-[#B5B0A8]">
                    <Terminal size={18} />
                    <span className="text-xs font-black uppercase tracking-widest">{v.type}</span>
                  </div>
                  
                  <ul className="space-y-6">
                    {v.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-4 group/item">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#F5F2ED] dark:bg-[#242220] flex items-center justify-center group-hover/item:bg-[#FF5733] transition-all">
                          <CheckCircle2 size={12} className="text-[#B5B0A8] group-hover/item:text-white" />
                        </div>
                        <span className="text-md font-medium text-[#7A756E] dark:text-[#8A867F] leading-relaxed group-hover/item:text-[#1A1714] dark:group-hover/item:text-[#F0EDE8] transition-colors">
                          {change}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          ))}

          {/* FOOTER CTA */}
          <section className="bg-[#1A1714] dark:bg-[#F0EDE8] rounded-[3rem] p-12 text-center relative overflow-hidden mt-32">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif italic text-white dark:text-[#0F0E0C] mb-6">
                Это только начало
              </h2>
              <p className="text-[#7A756E] dark:text-[#8A867F] max-w-xl mx-auto mb-10 font-medium">
                У нас большие планы на 2026 год: интеграция историй, групповые челленджи и еще больше нового контента.
              </p>
              <Link
                to="/support"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#FF5733] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-[#FF5733]/40"
              >
                Предложить функцию <Sparkles size={16} />
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none translate-x-12 -translate-y-12">
              <Rocket size={320} className="text-white dark:text-black rotate-12" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}