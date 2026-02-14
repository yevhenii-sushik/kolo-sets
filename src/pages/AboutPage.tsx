import { Rocket, ShieldCheck, Zap, Star} from 'lucide-react';

export default function AboutPage() {

  const versions = [
    {
      number: "0.1.2",
      status: "Latest",
      date: "Februar 2026",
      badgeClass: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      changes: [
        "Полная поддержка темной темы (Dark Mode)",
        "Адаптивный интерфейс для мобильных устройств",
        "Обновленный алгоритм интервальных повторений (SRS)",
        "Новый дизайн бокового и нижнего меню",
        "Оптимизация производительности анимаций"
      ]
    },
    {
      number: "0.1.1",
      status: "Release",
      date: "Februar 2026",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      changes: [
        "Улучшенный дизайн главной страницы и интерфейса",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)",
        "Локальное хранилище данных (localStorage)"
      ]
    },
    {
      number: "0.1.0",
      status: "Release",
      date: "Februar 2026",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      changes: [
        "Первый публичный релиз",
        "Система коллекций и карточек",
        "Режим изучения (Flashcards) и проверки (Quiz)",
        "Локальное хранилище данных (localStorage)"
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 pt-10 pb-10">

      {/* Header */}
      <section className="text-center space-y-4">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Kolo <span className="text-purple-600">Sets</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Минималистичный инструмент для изучения норвежского языка, построенный на научном подходе интервальных повторений.
        </p>
      </section>

      {/* О приложении (Карточки с фичами) */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Zap size={24} />
          </div>
          <h3 className="font-bold text-lg">Эффективность</h3>
          <p className="text-sm text-gray-500">Алгоритм SRS показывает слова именно тогда, когда вы готовы их забыть.</p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-lg">Приватность</h3>
          <p className="text-sm text-gray-500">Все ваши данные хранятся локально в браузере. Никаких серверов и сбора данных.</p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 space-y-3">
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Star size={24} />
          </div>
          <h3 className="font-bold text-lg">Простота</h3>
          <p className="text-sm text-gray-500">Фокус на обучении, а не на настройке. Создавайте наборы и учитесь сразу.</p>
        </div>
      </section>

      {/* История версий (Таймлайн) */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <Rocket className="text-purple-600" />
          <h2 className="text-3xl font-bold">Versjonsoversikt</h2>
        </div>

        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 pl-8 space-y-12">
          {versions.map((v) => (
            <div key={v.number} className="relative">
              {/* Точка на таймлайне */}
              <div className="absolute -left-[41px] top-1 w-5 h-5 bg-white dark:bg-gray-900 border-4 border-purple-600 rounded-full" />
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold">{v.number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${v.badgeClass}`}>
                    {v.status}
                  </span>
                  <span className="text-gray-500 text-sm">{v.date}</span>
                </div>

                <ul className="grid gap-2">
                  {v.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                      <span className="text-purple-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / Credits */}
      <footer className="pt-12 border-t border-gray-200 dark:border-gray-800 text-center space-y-4">
        <p className="text-gray-500">
          Utviklet av <span className="font-semibold text-gray-900 dark:text-white">Euphoria Software</span>
        </p>
        {/* <div className="flex justify-center gap-6">
          <a href="#" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Github size={20} />
          </a>
        </div> */}
      </footer>
    </div>
  );
}