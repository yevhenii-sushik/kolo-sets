import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, Zap, PocketKnife, Sparkles, 
  History, Layout, Bug, Terminal, 
  CheckCircle2, ChevronRight, Milestone,
  Cloud, Smartphone, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

export default function UpdatesPage() {
  const { t } = useI18n();
  const [activeVersion, setActiveVersion] = useState("0.2.5");

  // status переведён в locale-файлах (напр. "Siste"/"Остання" вместо "Latest"),
  // но здесь используется как ключ для подбора иконки/цвета — без этой
  // нормализации у NO/UK все версии проваливались в default (серый Terminal),
  // т.к. их переведённые статусы не совпадали ни с одним case ниже.
  const STATUS_ALIASES: Record<string, string> = {
    'Siste': 'Latest', 'Oppdatering': 'Patch', 'Stabil': 'Stable', 'Arv': 'Legacy', 'Innledende': 'Initial',
    'Остання': 'Latest', 'Патч': 'Patch', 'Стабільна': 'Stable', 'Початковий': 'Initial',
  };

  // Маппинг иконок и стилей, так как их нельзя передать через JSON
  const getVersionMeta = (status: string, number: string) => {
    switch (STATUS_ALIASES[status] ?? status) {
      case "Latest": return { icon: <Layout size={20} />, badge: "bg-[#FFF0ED] text-[#FF5733] dark:bg-[#2A1A15]" };
      case "Patch": 
        if (number === "0.2.3") return { icon: <Sparkles size={20} />, badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30" };
        if (number === "0.2.2") return { icon: <PocketKnife size={20} />, badge: "bg-[#C8E6C9] text-[#1B5E20] dark:bg-[#0A2F10]" };
        return { icon: <Bug size={20} />, badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30" };
      case "Minor": return { icon: <Cloud size={20} />, badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30" };
      case "Legacy": return { icon: <Smartphone size={20} />, badge: "bg-gray-100 text-gray-600 dark:bg-gray-800" };
      case "Initial": return { icon: <Milestone size={20} />, badge: "bg-gray-100 text-gray-600 dark:bg-gray-800" };
      default: return { icon: <Terminal size={20} />, badge: "bg-gray-100 text-gray-600" };
    }
  };

  const versions = t.updates.versions;

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
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
    versions.forEach((v: any) => {
      const el = document.getElementById(`v-${v.number}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [versions]);

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
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">{t.updates.changelog}</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
            {t.updates.title} <span className="text-[#FF5733] italic">{t.updates.titleHighlight}</span>
          </h1>
          <p className="text-xl text-[#7A756E] dark:text-[#8A867F] max-w-2xl font-medium leading-tight">
            {t.updates.subtitle}
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="hidden lg:block lg:col-span-2">
          <div className="sticky top-24 space-y-2 max-h-[70vh] overflow-y-auto pr-4 no-scrollbar">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-6 ml-4">{t.updates.sidebarTitle}</p>
            <div className="space-y-1 relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-[1px] bg-[#E0DBD3] dark:bg-[#2E2C29] -z-10" />
              
              {versions.map((v: any) => (
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
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { 
                icon: <Zap size={20}/>, 
                label: t.updates.stats.intensity, 
                val: t.updates.stats.intensityVal, 
                sub: t.updates.stats.intensitySub 
              },
              { 
                icon: <CheckCircle2 size={20}/>, 
                label: t.updates.stats.improvements, 
                val: versions.reduce((acc: number, v: any) => acc + v.changes.length, 0), 
                sub: t.updates.stats.improvementsSub 
              },
              { 
                icon: <Cloud size={20}/>, 
                label: t.updates.stats.status, 
                val: t.updates.stats.statusVal, 
                sub: t.updates.stats.statusSub 
              },
              { 
                icon: <Users size={20}/>, 
                label: t.updates.stats.feedback, 
                val: t.updates.stats.feedbackVal, 
                sub: t.updates.stats.feedbackSub 
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
          {versions.map((v: any) => {
            const meta = getVersionMeta(v.status, v.number);
            return (
              <section 
                key={v.number} 
                id={`v-${v.number}`}
                className="scroll-mt-32"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/5">
                      <div className="sticky top-24">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${meta.badge}`}>
                          {meta.icon} {v.status}
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
                      {v.changes.map((change: string, idx: number) => (
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
            );
          })}

          {/* FOOTER CTA */}
          <section className="bg-[#1A1714] dark:bg-[#F0EDE8] rounded-[3rem] p-12 text-center relative overflow-hidden mt-32">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-serif italic text-white dark:text-[#0F0E0C] mb-6">
                {t.updates.footer.title}
              </h2>
              <p className="text-[#7A756E] dark:text-[#8A867F] max-w-xl mx-auto mb-10 font-medium">
                {t.updates.footer.subtitle}
              </p>
              <Link
                to="/other/support"
                className="inline-flex items-center gap-3 px-10 py-5 bg-[#FF5733] text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-[#FF5733]/40"
              >
                {t.updates.footer.button} <Sparkles size={16} />
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