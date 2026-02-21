import { 
  ShieldCheck, EyeOff, Key, 
  ShieldAlert, FileText, CheckCircle2 
} from 'lucide-react';

export default function PrivacyPage() {
  const principles = [
    {
      title: "Полная анонимность",
      desc: "Мы не собираем ваш IP, местоположение или данные об устройстве. Ваша учеба — ваше личное дело.",
      icon: <EyeOff className="text-blue-500" />
    },
    {
      title: "Шифрование AES-256",
      desc: "Все данные при синхронизации проходят через военный стандарт шифрования.",
      icon: <Key className="text-purple-500" />
    },
    {
      title: "GDPR Compliant",
      desc: "Вы имеете полное право на экспорт и удаление всех своих данных в любой момент.",
      icon: <FileText className="text-orange-500" />
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pt-10 pb-24 px-6 space-y-20">
      
      {/* Hero Header */}
      <section className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-bold border border-green-100 dark:border-green-800">
          <ShieldCheck size={16} /> На страже ваших данных
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
          Безопасность и <br /><span className="text-green-600 font-serif italic">Приватность.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          В Kolo Sets мы не просто храним слова, мы защищаем ваш прогресс. 
          Ваши данные принадлежат только вам.
        </p>
      </section>

      {/* Principles Grid */}
      <section className="grid md:grid-cols-3 gap-8">
        {principles.map((item, i) => (
          <div key={i} className="group p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300">
            <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
              {item.desc}
            </p>
          </div>
        ))}
      </section>

      {/* Detailed Policy Layout */}
      <section className="bg-gray-900 dark:bg-black rounded-[3rem] p-8 md:p-16 text-white overflow-hidden relative">
        <div className="relative z-10 grid md:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Как мы работаем с данными?</h2>
            <div className="space-y-6">
              {[
                { t: "Хранение", d: "Все коллекции сохраняются в IndexedDB браузера — это надежнее обычного LocalStorage." },
                { t: "Авторизация", d: "Мы используем безопасные токены доступа (JWT), которые обновляются автоматически." },
                { t: "Синхронизация", d: "Происходит только когда вы вносите изменения, экономя ваш трафик." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1"><CheckCircle2 className="text-purple-500" size={20} /></div>
                  <div>
                    <h4 className="font-bold text-lg">{item.t}</h4>
                    <p className="text-gray-400 text-sm">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 space-y-6">
            <ShieldAlert className="text-orange-400" size={32} />
            <h3 className="text-xl font-bold">Важное напоминание</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Если вы используете гостевой режим (без аккаунта), ваши данные привязаны к конкретному браузеру. Очистка кэша браузера может привести к потере коллекций. Мы рекомендуем использовать Cloud Sync.
            </p>
            {/* <button className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors">
              Защитить данные сейчас
            </button> */}
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