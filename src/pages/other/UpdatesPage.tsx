import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, Zap, PocketKnife, Sparkles,
  Layout, Bug, Terminal, ChevronRight,
  CheckCircle2, Milestone, Globe,
  Cloud, Smartphone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { translations } from '../../locales';
import { PageHeader, SectionCard, fadeUp } from '../../components/other/PageSection';

export default function UpdatesPage() {
  const { t } = useI18n();
  const versions = t.updates.versions;
  const [activeVersion, setActiveVersion] = useState(versions[0]?.number ?? '');

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
      case "Latest": return { icon: <Layout size={18} />, badge: "bg-[#FFF0ED] text-[#FF5733] dark:bg-[#2A1A15]" };
      case "Patch":
        if (number === "0.2.3") return { icon: <Sparkles size={18} />, badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/30" };
        if (number === "0.2.2") return { icon: <PocketKnife size={18} />, badge: "bg-[#C8E6C9] text-[#1B5E20] dark:bg-[#0A2F10]" };
        return { icon: <Bug size={18} />, badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30" };
      case "Minor": return { icon: <Cloud size={18} />, badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30" };
      case "Legacy": return { icon: <Smartphone size={18} />, badge: "bg-gray-100 text-gray-600 dark:bg-gray-800" };
      case "Initial": return { icon: <Milestone size={18} />, badge: "bg-gray-100 text-gray-600 dark:bg-gray-800" };
      default: return { icon: <Terminal size={18} />, badge: "bg-gray-100 text-gray-600" };
    }
  };

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
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
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="lg:max-w-232 mx-auto lg:flex lg:items-start lg:gap-10 pb-16">
      {/* Version tree — desktop only */}
      <aside className="hidden lg:block lg:w-56 shrink-0 sticky top-24">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-6 ml-4">
          {t.updates.sidebarTitle}
        </p>
        <div className="space-y-1 relative max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
          <div className="absolute left-4.75 top-0 bottom-0 w-px bg-[#E0DBD3] dark:bg-[#2E2C29] -z-10" />

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
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                activeVersion === v.number ? "bg-[#FF5733] scale-150 shadow-[0_0_10px_#FF5733]" : "bg-[#B5B0A8]"
              }`} />
              <span className="font-black text-sm tracking-tight">v{v.number}</span>
              <ChevronRight size={14} className={`ml-auto transition-transform ${activeVersion === v.number ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}`} />
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 max-w-2xl space-y-5">
        <PageHeader
          title={`${t.updates.title} `}
          accent={t.updates.titleHighlight}
          subtitle={t.updates.subtitle}
        />

        {/* Stats strip */}
        <motion.div {...fadeUp(0.05)}>
          <SectionCard>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 sm:gap-4">
              {[
                { icon: <Zap size={16} />, label: t.updates.stats.releases, val: versions.length, sub: t.updates.stats.releasesSub },
                { icon: <CheckCircle2 size={16} />, label: t.updates.stats.improvements, val: versions.reduce((acc: number, v: any) => acc + v.changes.length, 0), sub: t.updates.stats.improvementsSub },
                { icon: <Bug size={16} />, label: t.updates.stats.patches, val: versions.filter((v: any) => (STATUS_ALIASES[v.status] ?? v.status) === 'Patch').length, sub: t.updates.stats.patchesSub },
                { icon: <Globe size={16} />, label: t.updates.stats.languages, val: Object.keys(translations).length, sub: t.updates.stats.languagesSub },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-start gap-1">
                  <div className="text-[#FF5733] mb-1">{item.icon}</div>
                  <div className="text-[10px] font-black text-[#B5B0A8] uppercase tracking-[0.12em]">{item.label}</div>
                  <div className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">{item.val}</div>
                  <div className="text-[11px] font-medium text-[#7A756E] dark:text-[#8A867F]">{item.sub}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </motion.div>

        {/* Version list */}
        {versions.map((v: any, i: number) => {
          const meta = getVersionMeta(v.status, v.number);
          return (
            <motion.div
              key={v.number}
              id={`v-${v.number}`}
              className="scroll-mt-32"
              {...fadeUp(Math.min(0.08 + i * 0.02, 0.3))}
            >
              <SectionCard>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.badge}`}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">v{v.number}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
                        {v.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#B5B0A8] font-bold uppercase tracking-widest mt-0.5">{v.date} · {v.type}</p>
                  </div>
                </div>

                <ul className="space-y-3 mt-6">
                  {v.changes.map((change: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#F5F2ED] dark:bg-[#242220] flex items-center justify-center">
                        <CheckCircle2 size={11} className="text-[#B5B0A8]" />
                      </div>
                      <span className="text-sm font-medium text-[#7A756E] dark:text-[#8A867F] leading-relaxed">
                        {change}
                      </span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </motion.div>
          );
        })}

        {/* Footer CTA */}
        <motion.div {...fadeUp(0.2)}>
          <div className="bg-[#1A1714] dark:bg-[#F0EDE8] rounded-[2.5rem] p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-serif italic text-white dark:text-[#0F0E0C] mb-3">
                {t.updates.footer.title}
              </h2>
              <p className="text-[#7A756E] dark:text-[#8A867F] max-w-md mx-auto mb-8 font-medium text-sm">
                {t.updates.footer.subtitle}
              </p>
              <Link
                to="/other/support"
                className="inline-flex items-center gap-2.5 px-7 py-4 bg-[#FF5733] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-[#FF5733]/40"
              >
                {t.updates.footer.button} <Sparkles size={15} />
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none translate-x-8 -translate-y-8">
              <Rocket size={200} className="text-white dark:text-black rotate-12" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
