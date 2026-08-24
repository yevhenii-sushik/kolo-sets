import { motion } from "framer-motion";
import { ArrowUpRight, Bell } from "lucide-react";
import { useI18n } from "../../contexts/I18nContext";
import { PageHeader, fadeUp } from "../../components/other/PageSection";

export default function ExplorePage() {
  const { t } = useI18n();
  const e = t.explore;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <PageHeader
        title={`${e.title} `}
        accent={e.titleAccent}
        subtitle={e.subtitle}
      />

      {/* ── Woky: Norsk Grammatikk — dark navy, live ── */}
      <motion.a
        {...fadeUp(0.05)}
        href="https://woky.dakuta.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-4xl overflow-hidden border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        <div className="relative bg-[#13121B] p-8 sm:p-10 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-[#C9B8F5]">
              {e.woky.category}
            </span>
            <h3 className="mt-4 text-4xl sm:text-5xl font-serif leading-none">
              <span className="font-black text-[#C9B8F5]">Norsk</span>{" "}
              <span className="italic text-[#F5C453]">Grammatikk</span>
            </h3>
            <p className="mt-3 text-sm text-[#9B96A8] max-w-sm leading-relaxed">
              {e.woky.tagline}
            </p>
            <div className="mt-6 flex gap-6">
              <div>
                <p className="text-2xl font-black text-white">10</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E6980]">
                  {e.woky.sections}
                </p>
              </div>
              <div>
                <p className="text-2xl font-black text-white">97</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#6E6980]">
                  {e.woky.exercises}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1917] px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#B5B0A8]">
            woky.dakuta.dev
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#FF5733] group-hover:gap-2.5 transition-all">
            {e.visit}
            <ArrowUpRight size={14} />
          </span>
        </div>
      </motion.a>

      {/* ── Bøy!: interactive dictionary — cream/rust, coming soon ── */}
      <motion.a
        {...fadeUp(0.1)}
        href="https://boey.dakuta.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-4xl overflow-hidden border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm hover:shadow-xl transition-shadow duration-300"
      >
        <div className="relative bg-[#F5EFE4] dark:bg-[#1C1712] p-8 sm:p-10 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#C0553B]/10 pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C0553B]/10 text-[10px] font-black uppercase tracking-widest text-[#C0553B]">
              {e.comingSoon}
            </span>
            <h3 className="mt-4 text-4xl sm:text-5xl font-serif font-black text-[#1A1714] dark:text-[#F0EDE8] leading-none">
              Bøy<span className="text-[#C0553B]">!</span>
            </h3>
            <p className="mt-3 text-sm text-[#7A756E] dark:text-[#8A867F] max-w-sm leading-relaxed">
              {e.boey.tagline}
            </p>
            <div className="mt-6 flex gap-2 flex-wrap">
              {e.boey.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full bg-white/60 dark:bg-white/5 text-[10px] font-bold text-[#7A756E] dark:text-[#8A867F]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1A1917] px-6 py-4 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#B5B0A8]">
            boey.dakuta.dev
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-[#C0553B] group-hover:gap-2.5 transition-all">
            <Bell size={14} />
            {e.notifyMe}
          </span>
        </div>
      </motion.a>

      <motion.p
        {...fadeUp(0.15)}
        className="text-center text-xs text-[#B5B0A8] dark:text-[#5A5652] font-medium pt-2"
      >
        {e.footer}
      </motion.p>
    </div>
  );
}
