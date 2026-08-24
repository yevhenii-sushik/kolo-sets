import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// Общий визуальный язык для страниц Settings/Updates/Support — единый
// хедер, единая карточка-секция. Держим здесь, чтобы все три страницы
// физически не могли разъехаться по дизайну.

export const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: 'easeOut' as const },
});

type IconType = LucideIcon;

// Бейдж-пилюля (иконка+название) теперь живёт в фиксированной шапке
// NavLayout (см. PAGE_META там же) — виден сразу, без скролла, на всех
// трёх страницах. Здесь остаётся только заголовок и подзаголовок.
export function PageHeader({
  title,
  accent,
  subtitle,
}: {
  title: ReactNode;
  accent?: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <motion.header {...fadeUp(0)} className="mb-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
        {title}
        {accent && <span className="text-[#FF5733]">{accent}</span>}
      </h1>
      <p className="mt-3 text-[#7A756E] dark:text-[#8A867F] font-medium">{subtitle}</p>
    </motion.header>
  );
}

export function SectionCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem] p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon: Icon, label }: { icon: IconType; label: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-[#FFF0ED] dark:bg-[#2A1A15] flex items-center justify-center text-[#FF5733]">
        <Icon size={18} />
      </div>
      <h2 className="text-base font-black uppercase tracking-[0.12em] text-[#1A1714] dark:text-[#F0EDE8]">
        {label}
      </h2>
    </div>
  );
}
