import { Link } from 'react-router-dom';
import { 
  Rocket, Star, ChevronRight, 
  Languages, BrainCircuit, Sparkles,
  ArrowRight, CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf4] dark:bg-gray-900 transition-colors selection:bg-purple-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden px-6 pt-16 pb-24 md:pt-32 md:pb-40">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-bold mb-8 animate-bounce">
            <Sparkles size={16} /> 
            Nyhet: Cloud Sync 2.0 er live!
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white mb-8">
            Kolo <span className="text-purple-600">Sets</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12">
            Mestre det norske språket raskere. En vitenskapelig tilnærming til ordforråd, 
            drevet av algoritmer som forstår hvordan du husker.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/register"
              className="group px-10 py-5 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-purple-500/40 transition-all hover:scale-105 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              Start reisen nå <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-10 py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xl font-bold rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-purple-200 transition-all w-full sm:w-auto justify-center"
            >
              Logg inn
            </Link>
          </div>
        </div>

        {/* Декоративные элементы фона */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-20 dark:opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-300 rounded-full blur-[120px]"></div>
        </div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-12 bg-white dark:bg-gray-800/50 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl">
          {[
            { label: "Aktive brukere", value: "40+" },
            { label: "Ord lært", value: "1.2k" },
            { label: "Språkstøtte", value: "Norsk" },
            { label: "Brukerstøtte", value: "24/7" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl font-black text-purple-600 mb-2">{stat.value}</div>
              <div className="text-gray-500 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. INTERACTIVE PREVIEW (Живой пример) */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Lær ord i deres <br /><span className="text-purple-600 underline decoration-wavy">naturlige miljø</span>
            </h2>
            <ul className="space-y-4">
              {[
                "Smart repetisjon (SRS) algoritme",
                "Uttale med krystallklar lyd",
                "Eksempelsetninger fra det virkelige liv",
                "Fremgangssporing i sanntid"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-lg text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="text-green-500" size={24} /> {text}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 w-full">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border-4 border-purple-100 dark:border-purple-900/30 transform rotate-2 hover:rotate-0 transition-transform duration-500">
               <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <span className="px-4 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-bold rounded-full uppercase">Substantiv</span>
                    <Star className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="space-y-2 text-center py-8">
                    <h3 className="text-5xl font-black text-gray-900 dark:text-white">Kjærlighet</h3>
                    <p className="text-xl text-gray-500">Любовь / Love</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl italic text-gray-600 dark:text-gray-300">
                    "Kjærlighet ved første blikk."
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-gray-900 text-white py-24 px-6 rounded-[4rem] mx-4 md:mx-10 overflow-hidden relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Slik fungerer det</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">Tre enkle steg for å transformere norsken din.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Opprett sett", desc: "Lag dine egne ordlister eller importer fra fellesskapet.", icon: <Languages /> },
              { step: "02", title: "Tren smart", desc: "Vår AI velger ut de ordene du trenger å øve på mest.", icon: <BrainCircuit /> },
              { step: "03", title: "Snakk flytende", desc: "Se selvtilliten din vokse for hver dag som går.", icon: <Rocket /> },
            ].map((item, i) => (
              <div key={i} className="space-y-6 group">
                <div className="text-6xl font-black text-gray-800 group-hover:text-purple-600 transition-colors">{item.step}</div>
                <h3 className="text-2xl font-bold">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-8 leading-tight">
          Klar for å starte ditt <br />norske eventyr?
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 italic">
          Ingen kredittkort kreves. Helt gratis å starte.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-4 px-12 py-6 bg-purple-600 text-white text-2xl font-black rounded-3xl shadow-2xl hover:bg-purple-700 transition-all hover:-translate-y-2"
        >
          Lag din konto nå <ChevronRight size={28} />
        </Link>
      </section>

      {/* 6. MINI FOOTER */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-2xl font-black text-gray-900 dark:text-white">Kolo <span className="text-purple-600">Sets</span></div>
        <div className="flex gap-8 text-gray-500 font-medium">
          <Link to="/about" className="hover:text-purple-600 transition-colors">Om oss</Link>
          <a href="#" className="hover:text-purple-600 transition-colors">Vilkår</a>
          <a href="#" className="hover:text-purple-600 transition-colors">Personvern</a>
        </div>
        <p className="text-gray-400 text-sm">© 2026 Euphoria Software</p>
      </footer>
    </div>
  );
}