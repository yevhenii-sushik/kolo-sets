import { Link } from "react-router-dom";
import {
  ChevronRight,
  ArrowRight,
  Volume2,
  Cloud,
  ShieldCheck,
  Zap,
  BookOpen,
  BarChart3,
  Star,
  RefreshCw,
  Check,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// ── Mini product preview ────────────────────────────────────────────────────

function FlashcardPreview() {
  return (
    <div className="bg-[#F5F2ED] dark:bg-[#0F0E0C] rounded-4xl p-6 md:p-8">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[11px] font-bold text-[#7A756E]">3 / 12</span>
        <div className="flex-1 h-2.5 bg-[#EDEAE4] dark:bg-[#242220] rounded-full overflow-hidden">
          <div className="h-full bg-[#FF5733] rounded-full w-1/4 transition-all" />
        </div>
        <span className="text-[11px] font-bold text-[#7A756E]">25%</span>
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-[#1A1917] rounded-[1.75rem] p-8 md:p-12 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-lg text-center mb-5">
        <span className="inline-block px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] bg-[#F5F2ED] dark:bg-[#242220] text-[#7A756E] rounded-full mb-4">
          сущ.
        </span>
        <div className="text-5xl md:text-6xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-4">
          bok
        </div>
        <div className="text-2xl font-bold text-[#FF5733] mb-2">книга</div>
        <div className="text-sm italic text-[#B5B0A8]">
          "Jeg leser en interessant bok."
        </div>
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[
          {
            label: "Не знаю",
            cls: "bg-red-500/10 border-red-500/25 text-red-500",
          },
          {
            label: "Забыл",
            cls: "bg-[#FF5733]/10 border-[#FF5733]/25 text-[#FF5733]",
          },
          {
            label: "Помню",
            cls: "bg-blue-500/10 border-blue-500/25 text-blue-500",
          },
          {
            label: "Знаю",
            cls: "bg-[#22C55E]/10 border-[#22C55E]/25 text-[#22C55E]",
          },
        ].map((btn) => (
          <div
            key={btn.label}
            className={`py-2.5 rounded-xl border text-[9px] font-black text-center ${btn.cls}`}
          >
            {btn.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.92]);

  return (
    <div className="min-h-dvh bg-[#F5F2ED] dark:bg-[#0F0E0C] selection:bg-[#FF5733]/20 overflow-x-hidden">
      {/* ── Sticky nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#F5F2ED]/80 dark:bg-[#0F0E0C]/80 border-b border-[#E0DBD3]/50 dark:border-[#2E2C29]/50">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icon-512.png" className="w-8 h-8" alt="Kolo" />
            <span className="text-lg font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight">
              Kolo <span className="text-[#FF5733]">Sets</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden sm:block text-sm font-bold text-[#7A756E] hover:text-[#1A1714] dark:hover:text-[#F0EDE8] transition-colors px-3 py-1.5"
            >
              Войти
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] text-[11px] font-black uppercase tracking-[0.12em] rounded-xl hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors"
            >
              Начать <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-dvh flex items-center justify-center px-6 pt-20 pb-24"
      >
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-6xl mx-auto w-full relative z-10"
        >
          <div className="flex flex-col items-center text-center">
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-full mb-12 shadow-sm"
            >
              <Zap size={12} className="text-[#FF5733] fill-[#FF5733]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7A756E]">
                Интервальное повторение SM-2
              </span>
            </motion.div>

            {/* KOLO + Sets title */}
            <div className="relative flex flex-col items-center select-none mb-10">
              {/* Spinning orange badge */}
              <motion.div
                initial={{ rotate: 5, scale: 0.9, opacity: 0 }}
                animate={{ rotate: 12, scale: 1, opacity: 1 }}
                transition={{
                  type: "spring",
                  damping: 20,
                  stiffness: 60,
                  delay: 0.2,
                }}
                className="absolute -top-12 -right-16 md:-top-20 md:-right-52 w-28 h-28 md:w-70 md:h-70 z-0 flex items-center justify-center"
              >
                <div className="relative w-24 h-24 md:w-52 md:h-52 bg-[#FF5733] rounded-full shadow-[0_20px_70px_rgba(255,87,51,0.35)] flex items-center justify-center border-[6px] md:border-10 border-[#F5F2ED] dark:border-[#0F0E0C]">
                  <img
                    src="/icon-512.png"
                    className="w-12 h-12 md:w-24 md:h-24 brightness-0 invert opacity-95"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent rounded-full" />
                </div>
                <div className="absolute inset-0 animate-[spin_40s_linear_infinite]">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <path
                        id="badgePath"
                        d="M 50,50 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0"
                      />
                    </defs>
                    <text className="text-[4.5px] font-black fill-[#FF5733] opacity-30 uppercase tracking-[5px]">
                      <textPath href="#badgePath">
                        LEARN • MASTER • REPEAT • LEARN • MASTER • REPEAT •
                      </textPath>
                    </text>
                  </svg>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75 }}
                className="relative z-10 text-[110px] md:text-[230px] font-black tracking-[-0.08em] leading-[0.85] text-[#1A1714] dark:text-[#F0EDE8] drop-shadow-sm"
              >
                KOLO
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, x: -25 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative z-20 -mt-4.5 md:-mt-11.25 self-center md:self-end md:mr-16"
              >
                <div className="relative inline-block">
                  <h2 className="text-5xl md:text-[115px] font-serif italic text-[#7A756E] dark:text-[#8A867F] leading-none">
                    Sets
                    <span className="text-[#FF5733] font-sans not-italic">
                      .
                    </span>
                  </h2>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 1 }}
                    className="absolute -bottom-2 left-0 right-0 h-1 md:h-1.5 bg-linear-to-r from-[#FF5733] to-transparent origin-left rounded-full opacity-40"
                  />
                </div>
              </motion.div>
            </div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="text-xl md:text-2xl text-[#7A756E] dark:text-[#8A867F] max-w-2xl leading-relaxed mb-10 font-medium"
            >
              Флэшкарты с интервальным повторением, квизы и статистика — всё
              чтобы выучить язык по-настоящему.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex flex-col sm:flex-row items-center gap-4 mb-8"
            >
              <Link
                to="/register"
                className="group px-10 py-5 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all hover:bg-[#FF5733] hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
              >
                Начать бесплатно
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <Link
                to="/login"
                className="px-10 py-5 text-[#1A1714] dark:text-[#F0EDE8] text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl border-2 border-[#1A1714]/30 dark:border-[#F0EDE8]/30 hover:border-[#FF5733] hover:text-[#FF5733] dark:hover:border-[#FF5733] dark:hover:text-[#FF5733] transition-all w-full sm:w-auto text-center"
              >
                Уже есть аккаунт
              </Link>
            </motion.div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.15 }}
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#B5B0A8]"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#22C55E]" /> Бесплатно
              </span>
              <span className="w-1 h-1 rounded-full bg-[#D0CCC5] dark:bg-[#3A3835]" />
              <span className="flex items-center gap-1.5">
                <Cloud size={12} className="text-[#3B82F6]" /> Облачная
                синхронизация
              </span>
              <span className="w-1 h-1 rounded-full bg-[#D0CCC5] dark:bg-[#3A3835]" />
              <span className="flex items-center gap-1.5">
                <Volume2 size={12} className="text-[#FF5733]" /> Произношение
                (TTS)
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* BG glow blobs */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#FF5733]/8 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-125 h-125 bg-[#3B82F6]/6 rounded-full blur-[150px]" />
        </div>
      </section>

      {/* ── Product preview ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
          className="bg-white dark:bg-[#1A1917] rounded-[3rem] border border-[#E0DBD3] dark:border-[#2E2C29] overflow-hidden shadow-2xl"
        >
          {/* Browser chrome */}
          <div className="px-6 py-4 border-b border-[#F5F2ED] dark:border-[#2E2C29] flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
              <div className="w-3 h-3 rounded-full bg-green-400/50" />
            </div>
            <div className="flex-1 mx-4 h-7 bg-[#F5F2ED] dark:bg-[#242220] rounded-lg flex items-center px-3">
              <span className="text-[10px] text-[#B5B0A8] font-mono">
                kolo.dakuta.dev / flashcards
              </span>
            </div>
          </div>
          <FlashcardPreview />
        </motion.div>
      </section>

      {/* ── Features bento ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF5733] mb-3">
            Возможности
          </p>
          <h2 className="text-4xl md:text-6xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8]">
            Всё для запоминания
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* SRS — wide */}
          <div className="md:col-span-2 bg-[#FF5733] p-10 rounded-[3rem] text-white overflow-hidden relative">
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                <RefreshCw size={24} />
              </div>
              <h3 className="text-3xl font-serif italic mb-4">
                Интервальное
                <br />
                повторение (SRS)
              </h3>
              <p className="opacity-85 font-medium leading-relaxed max-w-md">
                Алгоритм SM-2 рассчитывает оптимальный момент для повторения
                каждого слова — именно тогда, когда оно вот-вот забудется. Учи
                меньше, запоминай больше.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 rounded-2xl p-5">
                  <div className="text-3xl font-black mb-1">×5</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-70">
                    эффективнее зубрёжки
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-5">
                  <div className="text-3xl font-black mb-1">SM-2</div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-70">
                    научный алгоритм
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud sync */}
          <div className="bg-[#1A1714] dark:bg-[#F0EDE8] p-10 rounded-[3rem] text-white dark:text-[#0F0E0C] flex flex-col justify-between">
            <Cloud size={36} className="text-[#FF5733] mb-10" />
            <div>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">
                Cloud Sync
              </h3>
              <p className="text-sm opacity-70 font-medium leading-snug">
                Все наборы синхронизируются в реальном времени. Начни на
                компьютере, продолжи с телефона.
              </p>
            </div>
          </div>

          {/* TTS */}
          <div className="bg-white dark:bg-[#1A1917] p-10 rounded-[3rem] border border-[#E0DBD3] dark:border-[#2E2C29]">
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 bg-[#EFF6FF] dark:bg-[#1e3a5f]/30 rounded-2xl flex items-center justify-center text-[#3B82F6]">
                <Volume2 size={24} />
              </div>
              <div className="flex items-end gap-1">
                {[8, 16, 12, 20, 12].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#3B82F6] rounded-full animate-bounce"
                    style={{ height: h, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-[#1A1714] dark:text-[#F0EDE8]">
              Произношение
            </h3>
            <p className="text-sm text-[#7A756E] dark:text-[#8A867F] font-medium leading-snug">
              Текст-в-речь для правильного произношения с первого дня.
            </p>
          </div>

          {/* Quiz */}
          <div className="bg-white dark:bg-[#1A1917] p-10 rounded-[3rem] border border-[#E0DBD3] dark:border-[#2E2C29]">
            <div className="w-12 h-12 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-2xl flex items-center justify-center text-[#FF5733] mb-8">
              <BookOpen size={24} />
            </div>
            <h3 className="text-xl font-bold uppercase tracking-widest mb-2 text-[#1A1714] dark:text-[#F0EDE8]">
              Квиз-режим
            </h3>
            <p className="text-sm text-[#7A756E] dark:text-[#8A867F] font-medium leading-snug mb-6">
              Выбор из вариантов, написание, сопоставление пар — 5 типов
              заданий.
            </p>
            <div className="space-y-2.5">
              {["Слово по переводу", "Написать слово", "Сопоставление пар"].map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-[#7A756E] dark:text-[#8A867F]"
                  >
                    <Check size={13} className="text-[#22C55E] shrink-0" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Stats + Streaks — wide */}
          <div className="md:col-span-3 bg-[#EDEAE4] dark:bg-[#151412] p-10 rounded-[3rem] overflow-hidden relative">
            <div className="max-w-lg">
              <div className="w-12 h-12 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-2xl flex items-center justify-center text-[#FF5733] mb-8">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-3xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8] mb-4">
                Прогресс и мотивация
              </h3>
              <p className="text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                Стрики, достижения и подробная статистика по сессиям — мотивация
                учиться каждый день встроена в систему.
              </p>
            </div>
            <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:flex gap-4">
              {[
                { emoji: "🔥", value: "14", label: "стрик" },
                { emoji: "🏆", value: "12", label: "ачивок" },
                { emoji: "📚", value: "248", label: "слов" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 text-center border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm w-28"
                >
                  <div className="text-2xl mb-1">{item.emoji}</div>
                  <div className="font-black text-xl text-[#1A1714] dark:text-[#F0EDE8]">
                    {item.value}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-[#B5B0A8]">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 bg-[#EDEAE4] dark:bg-[#151412]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF5733] mb-3">
              Как это работает
            </p>
            <h2 className="text-4xl md:text-6xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8]">
              Три шага до <span className="text-[#FF5733]">результата</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: "✏️",
                title: "Создай набор",
                desc: "Добавь слова вручную или импортируй готовый список. Слово, перевод, пример — всё в одном месте.",
              },
              {
                n: "02",
                icon: "🧠",
                title: "Учи каждый день",
                desc: "Флэшкарты и квизы с оценкой знания. SRS алгоритм сам решит, когда показать слово снова.",
              },
              {
                n: "03",
                icon: "📈",
                title: "Отслеживай прогресс",
                desc: "Стрики, достижения и статистика по сессиям показывают как далеко ты продвинулся.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="bg-white dark:bg-[#1A1917] p-8 rounded-[2.5rem] border border-[#E0DBD3] dark:border-[#2E2C29]"
              >
                <div className="text-3xl mb-5">{step.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF5733] mb-3">
                  {step.n}
                </div>
                <h3 className="text-xl font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-[#7A756E] dark:text-[#8A867F] font-medium leading-relaxed">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="max-w-4xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-5xl mb-8">🚀</div>
          <h2 className="text-5xl md:text-7xl font-serif italic text-[#1A1714] dark:text-[#F0EDE8] mb-6 leading-tight">
            Начни учить
            <br />
            <span className="text-[#FF5733]">прямо сейчас</span>
          </h2>
          <p className="text-[#7A756E] dark:text-[#8A867F] mb-12 text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Бесплатно. Без подписки. Работает в браузере — без установки.
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center gap-4 px-12 py-6 bg-[#FF5733] text-white text-[12px] font-black uppercase tracking-[0.25em] rounded-4xl shadow-2xl shadow-[#FF5733]/30 hover:bg-[#E54D2A] hover:scale-105 transition-all active:scale-95"
          >
            Создать аккаунт
            <ChevronRight
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 opacity-50 text-[10px] font-black uppercase tracking-[0.18em]">
            <span className="flex items-center gap-1.5">
              <Star size={11} className="fill-[#FF5733] text-[#FF5733]" /> Без
              кредитной карты
            </span>
            <span>·</span>
            <span>Синхронизация в облаке</span>
            <span>·</span>
            <span>Тёмная тема</span>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E0DBD3] dark:border-[#2E2C29] py-10">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <img src="/icon-512.png" className="w-7 h-7 opacity-60" alt="" />
              <span className="text-sm font-black text-[#7A756E]">
                Kolo <span className="text-[#FF5733]">Sets</span>
              </span>
            </div>
            <p className="text-[11px] text-[#B5B0A8] tracking-wide text-center">
              © 2026 Kolo by{" "}
              <a
                href="https://dakuta.dev"
                className="text-[#FF5733] hover:underline"
              >
                Dakuta
              </a>{" "}
            </p>
            <div className="flex gap-5 text-[11px] font-bold text-[#B5B0A8]">
              <Link
                to="/login"
                className="hover:text-[#FF5733] transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="hover:text-[#FF5733] transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Bottom row — legal links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 border-t border-[#E0DBD3]/50 dark:border-[#2E2C29]/50">
            <Link
              to="/privacy"
              className="text-[11px] font-bold text-[#B5B0A8] hover:text-[#FF5733] transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="w-1 h-1 rounded-full bg-[#D0CCC5] dark:bg-[#3A3835]" />
            <Link
              to="/terms"
              className="text-[11px] font-bold text-[#B5B0A8] hover:text-[#FF5733] transition-colors"
            >
              Terms of Service
            </Link>
            <span className="w-1 h-1 rounded-full bg-[#D0CCC5] dark:bg-[#3A3835]" />
            <Link
              to="/support"
              className="text-[11px] font-bold text-[#B5B0A8] hover:text-[#FF5733] transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
