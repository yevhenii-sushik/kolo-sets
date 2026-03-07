import { Link } from 'react-router-dom';
import { 
  Star, ChevronRight, 
  BrainCircuit, Sparkles,
  ArrowRight, Globe,
  Volume2, Cloud, ShieldCheck, Zap,
  MousePointer2
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function LandingPage() {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#0F0E0C] transition-colors duration-500 selection:bg-[#FF5733]/20 overflow-x-hidden">
      
      {/* 1. HERO SECTION - Эмоциональный старт */}
      <section ref={targetRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-24">
        <motion.div style={{ opacity, scale }} className="max-w-6xl mx-auto text-center relative z-10">

{/* 1. HERO SECTION - OFFSET BADGE BEHIND TEXT */}
          <div className="relative flex flex-col items-center mb-24 pt-10 select-none">
            
            <div className="relative flex flex-col items-center">
              
              {/* МЕДАЛЬОН (Смещенный за буквы) */}
              <motion.div 
                initial={{ rotate: 5, scale: 0.9, opacity: 0 }}
                animate={{ rotate: 12, scale: 1, opacity: 1 }}
                transition={{ 
                  type: "spring", 
                  damping: 20, 
                  stiffness: 60,
                  delay: 0.2 
                }}
                // Сдвигаем еще сильнее вправо и вверх, чтобы он был виден за буквой 'O'
                className="absolute -top-12 -right-16 md:-top-20 md:-right-52 w-35 h-35 md:w-[300px] md:h-[300px] z-0 flex items-center justify-center"
              >
                {/* Внутреннее оранжевое ядро */}
                <div className="relative w-28 h-28 md:w-56 md:h-56 bg-[#FF5733] rounded-full shadow-[0_20px_80px_rgba(255,87,51,0.35)] flex items-center justify-center border-[6px] md:border-[12px] border-[#F5F2ED] dark:border-[#0F0E0C]">
                  <img 
                    src="/icon-512.png" 
                    className="w-14 h-14 md:w-28 md:h-28 brightness-0 invert opacity-95" 
                    alt="Logo"
                  />
                  
                  {/* Декоративный блик на ядре */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full" />
                </div>
                
                {/* Крутящийся текст (сделали его шире, чтобы он выходил далеко за пределы ядра) */}
                <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <path 
                        id="badgePath" 
                        d="M 50, 50 m -48, 0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0" 
                      />
                    </defs>
                    <text className="text-[5px] md:text-[4.5px] font-black fill-[#FF5733] opacity-30 uppercase tracking-[5px]">
                      <textPath href="#badgePath">
                        LEARN • MASTER • REPEAT • LEARN • MASTER • REPEAT • LEARN • MASTER • REPEAT •
                      </textPath>
                    </text>
                  </svg>
                </div>
              </motion.div>

              {/* ГИГАНТСКИЙ ЗАГОЛОВОК KOLO */}
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-[110px] md:text-[240px] font-black tracking-[-0.08em] leading-[0.85] text-[#1A1714] dark:text-[#F0EDE8] drop-shadow-sm"
              >
                KOLO
              </motion.h1>
              
              {/* ВТОРАЯ ЧАСТЬ: Sets */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative z-20 mt-[-20px] md:mt-[-50px] self-center md:self-end md:mr-16"
              >
                <div className="relative inline-block">
                  <h2 className="text-6xl md:text-[120px] font-serif italic text-[#7A756E] dark:text-[#8A867F] leading-none">
                    Sets<span className="text-[#FF5733] font-sans not-italic">.</span>
                  </h2>
                  {/* Подчеркивание под Sets */}
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 1 }}
                    className="absolute -bottom-2 left-0 right-0 h-1 md:h-2 bg-gradient-to-r from-[#FF5733] to-transparent origin-left rounded-full opacity-40"
                  />
                </div>
              </motion.div>
            </div>

            {/* Слоган с новой анимацией */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-16 flex items-center gap-6"
            >
              <div className="h-[1px] w-12 bg-[#E0DBD3] dark:bg-[#2E2C29]" />
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-[#B5B0A8] dark:text-[#4A4742]">
                Evolution of Learning
              </p>
              <div className="h-[1px] w-12 bg-[#E0DBD3] dark:bg-[#2E2C29]" />
            </motion.div>
          </div>


          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl text-[#7A756E] dark:text-[#8A867F] max-w-3xl mx-auto leading-tight mb-14 font-medium font-serif italic"
          >
            "Språk er ikke bare ord, det er nøkkelen til en ny verden." <br />
            <span className="not-italic font-sans text-base md:text-xl block mt-4 font-normal opacity-80">
              Opplev en smartere måte å mestre norsk på med vitenskapelig repetisjon.
            </span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              to="/register"
              className="group px-12 py-6 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] text-[12px] font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Begynn gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-12 py-6 bg-transparent text-[#1A1714] dark:text-[#F0EDE8] text-[12px] font-black uppercase tracking-[0.2em] rounded-[2rem] border-2 border-[#1A1714] dark:border-[#F0EDE8] hover:bg-[#1A1714] hover:text-white dark:hover:bg-[#F0EDE8] dark:hover:text-[#0F0E0C] transition-all w-full sm:w-auto text-center"
            >
              Logg inn
            </Link>
          </motion.div>
        </motion.div>

        {/* Фоновые элементы */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF5733]/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#3B82F6]/10 rounded-full blur-[150px]"></div>
        </div>
      </section>

      {/* 2. FEATURES GRID - Фокус на технологиях */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* AI Card */}
          <div className="md:col-span-2 bg-white dark:bg-[#1A1917] p-10 rounded-[3rem] border border-[#E0DBD3] dark:border-[#2E2C29] flex flex-col md:flex-row gap-10 items-center overflow-hidden relative group">
            <div className="flex-1 z-10">
              <div className="w-12 h-12 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-2xl flex items-center justify-center text-[#FF5733] mb-6">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-3xl font-serif italic mb-4 text-[#1A1714] dark:text-[#F0EDE8]">AI-drevet Magi</h3>
              <p className="text-[#7A756E] dark:text-[#8A867F] leading-relaxed font-medium">
                Vår AI hjelper deg med å lage perfekte flashcards på sekunder. Den forstår kontekst, 
                genererer eksempler og finner den rette nyansen i språket.
              </p>
            </div>
            <div className="flex-1 relative">
               <div className="bg-[#F5F2ED] dark:bg-[#242220] p-6 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={14} className="text-[#FF5733]" />
                    <span className="text-[9px] font-black uppercase tracking-widest opacity-50 text-[#1A1714] dark:text-[#F0EDE8]">AI Forslag</span>
                  </div>
                  <div className="h-2 w-3/4 bg-[#E0DBD3] dark:bg-[#2E2C29] rounded-full mb-2"></div>
                  <div className="h-2 w-1/2 bg-[#E0DBD3] dark:bg-[#2E2C29] rounded-full"></div>
               </div>
            </div>
          </div>

          {/* Cloud Sync Card */}
          <div className="bg-[#1A1714] dark:bg-[#F0EDE8] p-10 rounded-[3rem] text-white dark:text-[#0F0E0C] flex flex-col justify-between">
            <Cloud size={40} className="text-[#FF5733] mb-8" />
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tighter mb-2">Cloud Sync</h3>
              <p className="text-sm opacity-70 font-medium tracking-tight">
                Dine fremskritt er alltid med deg. Start på PC, fortsett på bussen.
              </p>
            </div>
          </div>

          {/* TTS Card */}
          <div className="bg-white dark:bg-[#1A1917] p-10 rounded-[3rem] border border-[#E0DBD3] dark:border-[#2E2C29] flex flex-col justify-between group cursor-pointer">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 bg-[#EFF6FF] dark:bg-[#1e3a5f]/30 rounded-2xl flex items-center justify-center text-[#3B82F6]">
                <Volume2 size={24} />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-4 bg-[#3B82F6] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}></div>)}
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-[#1A1714] dark:text-[#F0EDE8]">Hør Språket</h3>
              <p className="text-sm text-[#7A756E] dark:text-[#8A867F] font-medium leading-snug">
                Høykvalitets tekst-til-tale hjelper deg å mestre uttalen fra dag én.
              </p>
            </div>
          </div>

          {/* Stats/SRS Card */}
          <div className="md:col-span-2 bg-[#FF5733] p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-4xl font-serif italic mb-4 italic">Glem aldri igjen</h3>
              <p className="opacity-90 font-medium leading-relaxed">
                Vår Spaced Repetition (SRS) algoritme beregner nøyaktig når du er i ferd med å glemme et ord, 
                og minner deg på det i det perfekte øyeblikket.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
               <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-center">
                  <div className="text-3xl font-black italic">98%</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Huskerate</div>
               </div>
               <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-center">
                  <div className="text-3xl font-black italic">SRS</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Algoritme</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GAMIFICATION SECTION - Огоньки и уровни */}
      <section className="py-24 bg-[#EDEAE4] dark:bg-[#151412] px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-20">
          <div className="flex-1 order-2 md:order-1">
             <div className="relative">
                <div className="absolute -top-10 -left-10 w-32 h-32 bg-[#FF5733]/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="bg-white dark:bg-[#1A1917] p-8 rounded-[2.5rem] shadow-xl border border-[#E0DBD3] dark:border-[#2E2C29]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#1A1714] dark:bg-[#F0EDE8] rounded-xl flex items-center justify-center text-white dark:text-[#0F0E0C] font-black">
                        AS
                      </div>
                      <div>
                        <div className="text-sm font-black text-[#1A1714] dark:text-[#F0EDE8]">Alex Smith</div>
                        <div className="text-[10px] text-[#7A756E] uppercase font-bold tracking-widest">Level 12 • Pro</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-[#FFF0ED] dark:bg-[#2A1A15] px-4 py-2 rounded-full">
                      <Zap size={16} className="text-[#FF5733] fill-[#FF5733]" />
                      <span className="text-[#FF5733] font-black text-sm">14</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-[#F5F2ED] dark:bg-[#242220] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "70%" }}
                        className="h-full bg-[#FF5733]"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-[#B5B0A8] tracking-widest">
                      <span>Neste nivå</span>
                      <span>240 / 300 XP</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>
          <div className="flex-1 order-1 md:order-2 space-y-8 text-center md:text-left">
            <h2 className="text-5xl md:text-7xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8] leading-none">
              Hold gnisten <br /><span className="text-[#FF5733]">levende</span>
            </h2>
            <p className="text-lg text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
              Vårt system med streaks og achievements er designet for å holde deg motivert hver eneste dag. 
              Gjør læring til en vane du faktisk gleder deg til.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
               {["🏆 Achievements", "🔥 Streaks", "📈 Statistikk"].map(tag => (
                 <span key={tag} className="px-5 py-2 rounded-full border border-[#E0DBD3] dark:border-[#2E2C29] text-[10px] font-black uppercase tracking-widest text-[#1A1714] dark:text-[#F0EDE8]">
                   {tag}
                 </span>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA - Эмоциональное завершение */}
      <section className="max-w-4xl mx-auto px-6 py-40 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none">
          <Star size={300} className="text-[#FF5733]/10 rotate-12" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-8xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8] mb-8 leading-tight">
            Din vei til <br />flytende norsk
          </h2>
          <p className="text-[#7A756E] dark:text-[#8A867F] mb-14 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Bli med over 40 brukere som allerede har transformert sin læringsprosess.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-5 px-14 py-7 bg-[#FF5733] text-white text-[13px] font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-2xl shadow-[#FF5733]/40 hover:scale-105 transition-all active:scale-95"
          >
            Start ditt eventyr <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <div className="mt-10 flex items-center justify-center gap-6 opacity-40 grayscale">
            <ShieldCheck size={20} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sikker • Privat • Gratis</span>
            <Globe size={20} />
          </div>
        </motion.div>
      </section>

      {/* 5. FOOTER */}
      <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-[#E0DBD3] dark:border-[#2E2C29]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/icon-512.png" className="w-10 h-10" alt="Logo" />
              <div className="text-2xl font-black tracking-tighter text-[#1A1714] dark:text-[#F0EDE8]">Kolo <span className="text-[#FF5733]">Sets</span></div>
            </div>
            <p className="text-sm text-[#7A756E] dark:text-[#8A867F] max-w-xs font-medium leading-relaxed">
              Vi bygger fremtidens verktøy for språklæring. Drevet av lidenskap for teknologi og pedagogikk.
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1714] dark:text-[#F0EDE8] mb-6">Produkt</h4>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-[#7A756E] dark:text-[#8A867F]">
              <li><Link to="/features" className="hover:text-[#FF5733] transition-colors">Funksjoner</Link></li>
              <li><Link to="/pricing" className="hover:text-[#FF5733] transition-colors">Gratis Plan</Link></li>
              <li><Link to="/updates" className="hover:text-[#FF5733] transition-colors">Oppdateringer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1A1714] dark:text-[#F0EDE8] mb-6">Selskap</h4>
            <ul className="space-y-4 text-[11px] font-bold uppercase tracking-widest text-[#7A756E] dark:text-[#8A867F]">
              <li><Link to="/about" className="hover:text-[#FF5733] transition-colors">Om oss</Link></li>
              <li><Link to="/support" className="hover:text-[#FF5733] transition-colors">Support</Link></li>
              <li><Link to="/privacy" className="hover:text-[#FF5733] transition-colors">Privatliv</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-[#E0DBD3] dark:border-[#2E2C29] opacity-60">
           <p className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8]">© 2026 Euphoria Software AS</p>
           <div className="flex gap-6">
              <div className="w-8 h-8 rounded-full bg-[#1A1714] dark:bg-[#F0EDE8] flex items-center justify-center text-white dark:text-[#0F0E0C]">
                <MousePointer2 size={14} />
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}