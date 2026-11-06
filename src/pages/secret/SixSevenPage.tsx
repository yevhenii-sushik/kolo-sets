import { useState} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sword, Shield, FlaskConical, 
  Flame, Skull, Ghost, Zap, 
  Terminal, Trophy
} from 'lucide-react';

export default function DotaEasterEgg() {
  const [bkbActive, setBkbActive] = useState(false);
  const [selectedHero, setSelectedHero] = useState<string | null>(null);

  const slang = [
    { term: "SS", definition: "В норвежском это 'уровень', в доте — причина твоего фида, потому что ты не смотрел на карту.", icon: <Ghost className="text-info" /> },
    { term: "GG WP", definition: "Универсальная фраза, означающая 'я удаляю игру', но на самом деле ты нажмешь поиск через 30 секунд.", icon: <Trophy className="text-warning" /> },
    { term: "BKB", definition: "Черный Король Бар. Позволяет игнорировать критику тиммейтов в течение 6 секунд.", icon: <Shield className="text-warning" /> },
    { term: "Low Priority", definition: "Норвежская тюрьма по сравнению с этим — пятизвездочный отель.", icon: <Skull className="text-danger" /> },
  ];

  const activateBKB = () => {
    setBkbActive(true);
    setTimeout(() => setBkbActive(false), 6000);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${bkbActive ? 'bg-warning/20' : 'bg-fg'} selection:bg-danger/30 overflow-hidden`}>
      
      {/* 1. HEADER - Мемный стиль */}
      <header className="max-w-7xl mx-auto px-6 pt-24 mb-20 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-fg border border-line shadow-sm">
            <Flame size={14} className="text-danger" />
            <span className="text-2xs font-bold uppercase tracking-[0.2em] text-muted">Secret Patch 7.36z</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-bold tracking-tighter text-faint uppercase leading-none">
            Dota <span className="font-display text-danger tracking-normal lowercase">Brain.</span>
          </h1>
          <p className="text-xl text-muted max-w-2xl font-medium leading-tight">
            Система анализа токсичности и тренировки микроконтроля. Если ты не можешь выучить норвежский, попробуй выучить тайминги Рошана.
          </p>
        </motion.div>

        {/* BKB BUTTON */}
        <div className="absolute top-24 right-6">
          <button 
            onClick={activateBKB}
            className={`group relative p-6 rounded-full border-2 transition-all duration-500 ${bkbActive ? 'border-warning bg-warning shadow-[0_0_50px_rgba(234,179,8,0.5)]' : 'border-line bg-fg hover:border-warning'}`}
          >
            <Shield className={bkbActive ? 'text-black' : 'text-warning'} size={32} />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-2xs font-bold uppercase text-warning opacity-0 group-hover:opacity-100 transition-opacity">
              Press to BKB
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: ROLES (STATS) */}
          <aside className="lg:col-span-4 space-y-6">
            <p className="text-2xs font-bold uppercase tracking-[0.3em] text-muted mb-6">Select Your Role</p>
            {[
              { role: "Hard Carry", desc: "Учит слова 40 минут, чтобы выдать базу в конце.", icon: <Sword />, color: "text-info" },
              { role: "Support 5", desc: "Покупает подписку другим, сам сидит без карточек.", icon: <Shield />, color: "text-success" },
              { role: "Roamer", desc: "Заходит в приложение раз в месяц, но всё знает.", icon: <Zap />, color: "text-special" },
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => setSelectedHero(item.role)}
                className={`w-full p-6 rounded-4xl border transition-all text-left group ${selectedHero === item.role ? 'bg-white text-black' : 'bg-fg border-line text-muted hover:border-danger'}`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={selectedHero === item.role ? 'text-black' : item.color}>{item.icon}</div>
                  <span className="font-bold uppercase text-sm tracking-widest">{item.role}</span>
                </div>
                <p className="text-xs opacity-60 font-medium">{item.desc}</p>
              </button>
            ))}
          </aside>

          {/* RIGHT: CONTENT BENTO */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ANALYTICS BENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-8 bg-fg border border-line rounded-4xl">
                <div className="text-2xs font-bold text-muted uppercase tracking-widest mb-4 italic">Winrate Analysis</div>
                <div className="text-5xl font-bold text-faint tracking-tighter">12.5%</div>
                <p className="text-xs text-danger mt-2 font-semibold uppercase tracking-widest">Ниже среднего по больнице</p>
              </div>
              <div className="p-8 bg-danger rounded-4xl flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                   <div className="text-2xs font-bold text-white/50 uppercase tracking-widest mb-4 italic">Current Status</div>
                   <div className="text-3xl font-bold text-white leading-none uppercase">Tilt Detected</div>
                </div>
                <FlaskConical size={120} className="absolute -right-8 -bottom-8 text-black/20 group-hover:rotate-12 transition-transform" />
              </div>
            </div>

            {/* SLANG DICTIONARY */}
            <div className="bg-white rounded-4xl p-10">
               <div className="flex items-center gap-3 mb-10 text-black/20">
                  <Terminal size={18} />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-black">Dota_Slang_Dictionary.v1</span>
               </div>
               
               <div className="space-y-6">
                 {slang.map((item, i) => (
                   <div key={i} className="flex items-start gap-6 group">
                     <div className="w-12 h-12 bg-inset rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                       {item.icon}
                     </div>
                     <div>
                       <h4 className="text-xl font-bold text-black tracking-tight">{item.term}</h4>
                       <p className="text-sm text-muted font-medium leading-relaxed">{item.definition}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* FOOTER QUOTE */}
            <div className="text-center py-10">
               <p className="text-2xs font-bold uppercase tracking-[0.5em] text-muted">
                 "В Доте нет поражений, есть только не вовремя закончившийся Трон" — Сократ (наверное)
               </p>
            </div>
          </div>
        </div>
      </main>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {bkbActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none border-[20px] border-warning/30 z-50 shadow-[inset_0_0_100px_rgba(234,179,8,0.2)]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}