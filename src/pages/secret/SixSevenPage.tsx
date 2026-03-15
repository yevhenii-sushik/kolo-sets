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
    { term: "SS", definition: "В норвежском это 'уровень', в доте — причина твоего фида, потому что ты не смотрел на карту.", icon: <Ghost className="text-blue-400" /> },
    { term: "GG WP", definition: "Универсальная фраза, означающая 'я удаляю игру', но на самом деле ты нажмешь поиск через 30 секунд.", icon: <Trophy className="text-yellow-500" /> },
    { term: "BKB", definition: "Черный Король Бар. Позволяет игнорировать критику тиммейтов в течение 6 секунд.", icon: <Shield className="text-yellow-600" /> },
    { term: "Low Priority", definition: "Норвежская тюрьма по сравнению с этим — пятизвездочный отель.", icon: <Skull className="text-red-600" /> },
  ];

  const activateBKB = () => {
    setBkbActive(true);
    setTimeout(() => setBkbActive(false), 6000);
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${bkbActive ? 'bg-yellow-900/20' : 'bg-[#0F0E0C]'} selection:bg-red-500/30 overflow-hidden`}>
      
      {/* 1. HEADER - Мемный стиль */}
      <header className="max-w-7xl mx-auto px-6 pt-24 mb-20 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1917] border border-[#2E2C29] shadow-sm">
            <Flame size={14} className="text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">Secret Patch 7.36z</span>
          </div>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-[#F0EDE8] uppercase leading-none">
            Dota <span className="font-serif italic text-red-600 tracking-normal lowercase">Brain.</span>
          </h1>
          <p className="text-xl text-[#8A867F] max-w-2xl font-medium leading-tight">
            Система анализа токсичности и тренировки микроконтроля. Если ты не можешь выучить норвежский, попробуй выучить тайминги Рошана.
          </p>
        </motion.div>

        {/* BKB BUTTON */}
        <div className="absolute top-24 right-6">
          <button 
            onClick={activateBKB}
            className={`group relative p-6 rounded-full border-2 transition-all duration-500 ${bkbActive ? 'border-yellow-500 bg-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]' : 'border-[#2E2C29] bg-[#1A1917] hover:border-yellow-500'}`}
          >
            <Shield className={bkbActive ? 'text-black' : 'text-yellow-500'} size={32} />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Press to BKB
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">

        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: ROLES (STATS) */}
          <aside className="lg:col-span-4 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#4A4742] mb-6">Select Your Role</p>
            {[
              { role: "Hard Carry", desc: "Учит слова 40 минут, чтобы выдать базу в конце.", icon: <Sword />, color: "text-blue-500" },
              { role: "Support 5", desc: "Покупает подписку другим, сам сидит без карточек.", icon: <Shield />, color: "text-green-500" },
              { role: "Roamer", desc: "Заходит в приложение раз в месяц, но всё знает.", icon: <Zap />, color: "text-purple-500" },
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => setSelectedHero(item.role)}
                className={`w-full p-6 rounded-[2rem] border transition-all text-left group ${selectedHero === item.role ? 'bg-white text-black' : 'bg-[#1A1917] border-[#2E2C29] text-[#8A867F] hover:border-red-500'}`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={selectedHero === item.role ? 'text-black' : item.color}>{item.icon}</div>
                  <span className="font-black uppercase text-sm tracking-widest">{item.role}</span>
                </div>
                <p className="text-xs opacity-60 font-medium">{item.desc}</p>
              </button>
            ))}
          </aside>

          {/* RIGHT: CONTENT BENTO */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* ANALYTICS BENTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-8 bg-[#1A1917] border border-[#2E2C29] rounded-[2.5rem]">
                <div className="text-[10px] font-black text-[#4A4742] uppercase tracking-widest mb-4 italic">Winrate Analysis</div>
                <div className="text-5xl font-black text-[#F0EDE8] tracking-tighter">12.5%</div>
                <p className="text-xs text-red-500 mt-2 font-bold uppercase tracking-widest">Ниже среднего по больнице</p>
              </div>
              <div className="p-8 bg-red-600 rounded-[2.5rem] flex flex-col justify-between group overflow-hidden relative">
                <div className="relative z-10">
                   <div className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4 italic">Current Status</div>
                   <div className="text-3xl font-black text-white leading-none uppercase">Tilt Detected</div>
                </div>
                <FlaskConical size={120} className="absolute -right-8 -bottom-8 text-black/20 group-hover:rotate-12 transition-transform" />
              </div>
            </div>

            {/* SLANG DICTIONARY */}
            <div className="bg-white rounded-[3rem] p-10">
               <div className="flex items-center gap-3 mb-10 text-black/20">
                  <Terminal size={18} />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-black">Dota_Slang_Dictionary.v1</span>
               </div>
               
               <div className="space-y-6">
                 {slang.map((item, i) => (
                   <div key={i} className="flex items-start gap-6 group">
                     <div className="w-12 h-12 bg-[#F5F2ED] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                       {item.icon}
                     </div>
                     <div>
                       <h4 className="text-xl font-black text-black tracking-tight">{item.term}</h4>
                       <p className="text-sm text-[#7A756E] font-medium leading-relaxed">{item.definition}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* FOOTER QUOTE */}
            <div className="text-center py-10">
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#4A4742]">
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
            className="fixed inset-0 pointer-events-none border-[20px] border-yellow-500/30 z-50 shadow-[inset_0_0_100px_rgba(234,179,8,0.2)]"
          />
        )}
      </AnimatePresence>
    </div>
  );
}