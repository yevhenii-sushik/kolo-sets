import { 
  Cpu, Code2, Heart, Globe, Zap, 
  Layers, Workflow, Sparkles, Binary 
} from 'lucide-react';

export default function SystemInfoPage() {
  return (
    <div className="max-w-5xl mx-auto pt-10 pb-24 px-6 space-y-24">
      
      {/* Hero */}
      <header className="space-y-8">
        <div className="flex items-center gap-3 text-purple-600 font-bold tracking-widest uppercase text-sm">
          <Binary size={18} /> System Core v0.2.0
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white leading-[0.9]">
          Инженерия <br />
          <span className="text-purple-600 font-serif italic">знаний.</span>
        </h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
          Kolo Sets — это высокопроизводительная среда для обучения, оптимизированная для работы на любом устройстве.
        </p>
      </header>

      {/* Bento Grid Specs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 p-8 bg-purple-600 rounded-[2.5rem] text-white space-y-4">
          <Zap size={32} />
          <h3 className="text-2xl font-bold">Fast Performance</h3>
          <p className="opacity-80">Нулевая задержка при переключении карточек благодаря оптимизированному состоянию React.</p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
          <Layers className="text-blue-500 mb-4" />
          <div className="text-2xl font-bold dark:text-white">SRS</div>
          <p className="text-sm text-gray-500 mt-2">Алгоритм интервальных повторений 2.0</p>
        </div>
        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700">
          <Globe className="text-orange-500 mb-4" />
          <div className="text-2xl font-bold dark:text-white">Cloud</div>
          <p className="text-sm text-gray-500 mt-2">Глобальная база данных</p>
        </div>
        
        <div className="md:col-span-4 p-10 bg-gray-50 dark:bg-gray-800/50 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold dark:text-white">Технологический стек</h3>
            <p className="text-gray-500 dark:text-gray-400">Построено с использованием самых надежных инструментов индустрии.</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {["React 18", "TypeScript", "Vite", "Zustand", "Tailwind", "Supabase"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">{tag}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm"><Code2 className="text-purple-500" /></div>
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm"><Cpu className="text-blue-500" /></div>
            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm"><Sparkles className="text-orange-500" /></div>
          </div>
        </div>
      </section>

      {/* Mission */}
      {/* Mission Section */}
      <section className="flex flex-col md:flex-row gap-20 items-center py-10">
        {/* Левая часть с текстом */}
        <div className="flex-1 space-y-8 order-2 md:order-1">
          <div className="w-12 h-1 bg-blue-500"></div>
          <h2 className="text-4xl font-bold dark:text-white leading-tight">Наша миссия</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Мы строим мост между теорией и практикой. Наша цель — убрать барьеры при запоминании сложных норвежских слов и грамматических конструкций, используя проверенный метод <span className="text-purple-600 font-bold">SRS</span>.
          </p>
          <div className="flex items-center gap-4 py-2 px-5 bg-purple-50 dark:bg-purple-900/20 rounded-2xl w-fit">
            <Heart size={20} className="text-purple-600 fill-purple-600/20" /> 
            <span className="text-purple-600 font-bold text-sm uppercase tracking-wide">
              Made for language learners
            </span>
          </div>
        </div>

        {/* Правая часть с визуальной композицией */}
        <div className="flex-1 relative order-1 md:order-2 w-full">
          {/* Фоновый декоративный элемент */}
          <div className="absolute -inset-4 bg-blue-50 dark:bg-blue-900/10 rounded-[3rem] rotate-3"></div>
          
          <div className="relative grid grid-cols-2 gap-4">
            <div className="aspect-square bg-gradient-to-br from-purple-600 to-purple-700 rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center text-white p-6 transition-transform hover:-translate-y-2">
              <Cpu size={48} className="mb-4 opacity-80" />
              <span className="text-xs font-mono opacity-60">Neural Engine</span>
            </div>
            
            <div className="aspect-[3/4] bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col items-center justify-center p-6 mt-8">
              <Globe size={48} className="text-blue-500 mb-4" />
              <span className="text-sm font-bold dark:text-white text-center">Глобальная база</span>
            </div>
            
            <div className="col-span-2 bg-gray-900 dark:bg-gray-700 rounded-[2rem] p-6 flex items-center justify-between group overflow-hidden relative">
              <div className="z-10">
                <div className="text-white font-bold">SRS Algorithm 2.0</div>
                <div className="text-gray-400 text-xs">Оптимизация повторений</div>
              </div>
              <Zap className="text-yellow-400 group-hover:scale-125 transition-transform" />
              {/* Декоративное свечение */}
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/20 blur-3xl rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="flex flex-col md:flex-row gap-20 items-center py-10">
        <div className="flex-1 space-y-8">
          <div className="w-12 h-1 bg-purple-600"></div>
          <h2 className="text-4xl font-bold dark:text-white leading-tight">Философия <br />минимализма</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed italic">
            "Мы верим, что интерфейс обучения не должен отвлекать от самого обучения. Каждая тень, каждый отступ и каждый шрифт в Kolo Sets выбраны для того, чтобы снизить когнитивную нагрузку."
          </p>
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500"></div>
             <div>
                <div className="font-bold dark:text-white">Euphoria Design Team</div>
                <div className="text-sm text-gray-500">Product Strategy</div>
             </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div className="absolute -inset-4 bg-purple-100 dark:bg-purple-900/20 rounded-[3rem] -rotate-3"></div>
          <div className="relative bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-200 dark:border-gray-700 shadow-xl">
             <Workflow className="text-purple-600 mb-6" size={48} />
             <h4 className="text-xl font-bold mb-4 dark:text-white">Workflow Optimization</h4>
             <p className="text-gray-500 text-sm leading-relaxed">
               Наша система анализирует ваши ошибки и автоматически подстраивает график повторений, экономя до 40% времени на изучение одного набора.
             </p>
          </div>
        </div>
      </section>

      <footer className="pt-12 mt-12 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Utviklet av <span className="font-semibold text-gray-900 dark:text-white">Euphoria Software</span>
        </p>
      </footer>
    </div>
  );
}