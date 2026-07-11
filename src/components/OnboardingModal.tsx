import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Layers, Flame, Zap } from "lucide-react";

export const ONBOARDING_STORAGE_KEY = "kolo_onboarding_v1";
export const ONBOARDING_RESTART_EVENT = "kolo:restart-onboarding";

// ── Step illustrations ──────────────────────────────────────────────────────

function WelcomeIll() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <motion.div
        initial={{ scale: 0.6, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 14, stiffness: 100 }}
        className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center border-4 border-white/50"
      >
        <img src="/icon-512.png" className="w-12 h-12" alt="" />
      </motion.div>
      <div className="text-center">
        <div className="text-white/90 text-xs font-black uppercase tracking-[0.2em]">
          Kolo Sets
        </div>
        <div className="text-white/60 text-[10px] mt-0.5">Smart flashcards · SM-2 SRS</div>
      </div>
      <div className="flex gap-2 mt-1">
        {["📚", "🧠", "🔥", "🏆"].map((e, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="text-xl"
          >
            {e}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function CollectionsIll() {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-[220px] space-y-2">
        {[
          { name: "Норвежский Б1", count: 24 },
          { name: "Повседневные слова", count: 48 },
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12 }}
            className="bg-white dark:bg-[#1A1917] rounded-2xl p-3.5 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-md"
          >
            <div className="text-[11px] font-black text-[#1A1714] dark:text-[#F0EDE8] mb-1">
              {c.name}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[9px] text-[#B5B0A8]">
                <Layers size={9} /> {c.count} слов
              </div>
              <div className="px-2 py-0.5 bg-[#1A1714] dark:bg-[#F0EDE8] rounded-lg text-[8px] font-black text-white dark:text-[#0F0E0C]">
                Учить →
              </div>
            </div>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-[#FF5733]/40 rounded-2xl"
        >
          <span className="text-[#FF5733] text-xs font-black">+ Создать набор</span>
        </motion.div>
      </div>
    </div>
  );
}

function FlashcardsIll() {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-[220px]">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-[9px] font-bold text-[#7A756E]">2 / 8</div>
          <div className="flex-1 h-1.5 bg-[#EDEAE4] dark:bg-[#242220] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "25%" }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="h-full bg-[#FF5733] rounded-full"
            />
          </div>
        </div>
        <motion.div
          initial={{ rotateY: -15, opacity: 0.7 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white dark:bg-[#1A1917] rounded-2xl p-5 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-lg text-center mb-2"
        >
          <div className="text-3xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-1">
            hund
          </div>
          <div className="text-base font-bold text-[#FF5733]">собака</div>
          <div className="text-[9px] italic text-[#B5B0A8] mt-1">"Hunden min heter Max"</div>
        </motion.div>
        <div className="grid grid-cols-4 gap-1">
          {[
            { l: "Не знаю", c: "text-red-500 border-red-500/30 bg-red-500/10" },
            { l: "Забыл",   c: "text-[#FF5733] border-[#FF5733]/30 bg-[#FF5733]/10" },
            { l: "Помню",  c: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
            { l: "Знаю",   c: "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/10" },
          ].map((b, i) => (
            <motion.div
              key={b.l}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className={`py-1.5 rounded-xl border text-[7px] font-black text-center ${b.c}`}
            >
              {b.l}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuizIll() {
  const options = ["hund", "katt", "fugl", "fisk"];
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-[220px]">
        <div className="bg-white dark:bg-[#1A1917] rounded-2xl p-4 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-lg">
          <span className="inline-block px-2 py-0.5 bg-[#FFF0ED] dark:bg-[#2A1A15] text-[#FF5733] text-[7px] font-black rounded-full mb-3 uppercase tracking-widest">
            Слово по переводу
          </span>
          <div className="text-lg font-bold text-[#1A1714] dark:text-[#F0EDE8] mb-3">
            собака
          </div>
          <div className="space-y-1.5">
            {options.map((opt, i) => (
              <motion.div
                key={opt}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold ${
                  i === 0
                    ? "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]"
                    : "border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E]"
                }`}
              >
                <span className="text-[8px] text-[#B5B0A8] font-black w-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
                {i === 0 && <span className="ml-auto">✓</span>}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressIll() {
  return (
    <div className="h-full flex items-center justify-center px-6">
      <div className="w-full max-w-[220px] space-y-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-white dark:bg-[#1A1917] rounded-2xl px-4 py-3 border border-[#E0DBD3] dark:border-[#2E2C29] shadow-md"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 rounded-full">
            <Flame size={13} className="text-white fill-white" />
            <span className="text-white font-black text-sm">7</span>
          </div>
          <div>
            <div className="text-[10px] font-black text-[#1A1714] dark:text-[#F0EDE8]">7 дней подряд</div>
            <div className="text-[8px] text-[#7A756E]">Лучший: 14 дней</div>
          </div>
        </motion.div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { e: "🏆", l: "Первый набор", done: true },
            { e: "⚡", l: "10 сессий",    done: true },
            { e: "🧠", l: "100 слов",     done: false },
          ].map((a, i) => (
            <motion.div
              key={a.l}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: a.done ? 1 : 0.45, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="bg-white dark:bg-[#1A1917] rounded-xl p-2.5 text-center border border-[#E0DBD3] dark:border-[#2E2C29]"
            >
              <div className="text-lg">{a.e}</div>
              <div className="text-[7px] font-black text-[#7A756E] mt-0.5 leading-tight">{a.l}</div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: <Zap size={11} className="text-[#FF5733]" />, v: "12",   l: "сессий" },
            { icon: "📚",                                          v: "248",  l: "слов" },
            { icon: "⏱",                                          v: "4h",   l: "учёбы" },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-white dark:bg-[#1A1917] rounded-xl py-2 text-center border border-[#E0DBD3] dark:border-[#2E2C29]"
            >
              <div className="flex items-center justify-center text-sm">{s.icon}</div>
              <div className="text-[10px] font-black text-[#1A1714] dark:text-[#F0EDE8]">{s.v}</div>
              <div className="text-[7px] text-[#B5B0A8]">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DoneIll() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 12, stiffness: 80, delay: 0.1 }}
        className="text-6xl"
      >
        🚀
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-white/80 text-xs font-black uppercase tracking-[0.25em]"
      >
        Готово к запуску!
      </motion.div>
    </div>
  );
}

// ── Step data ───────────────────────────────────────────────────────────────

interface StepData {
  illBg: string;
  title: string;
  description: string;
  tip?: string;
}

const STEPS: StepData[] = [
  {
    illBg: "bg-[#FF5733]",
    title: "Добро пожаловать в Kolo Sets!",
    description:
      "Умные флэшкарты с интервальным повторением. Это знакомство займёт меньше минуты — и вы узнаете всё главное.",
  },
  {
    illBg: "bg-[#EDEAE4] dark:bg-[#151412]",
    title: "Создай набор слов",
    description:
      "Нажми «Создать набор», добавь слова с переводом, объяснением и примером. Можно импортировать готовый список.",
    tip: "Для квиза нужно минимум 4 слова в наборе.",
  },
  {
    illBg: "bg-[#EDEAE4] dark:bg-[#151412]",
    title: "Учи с флэшкартами",
    description:
      "Переворачивай карточки и оценивай знание: «Не знаю» → «Знаю». Алгоритм SM-2 рассчитает идеальный момент для повторения.",
    tip: "На клавиатуре: Пробел — перевернуть, 1–4 — оценить. Свайп работает на мобайле.",
  },
  {
    illBg: "bg-[#EDEAE4] dark:bg-[#151412]",
    title: "Проверяй себя в квизе",
    description:
      "Пять режимов: выбор ответа, перевод, написание слова, объяснение и сопоставление пар. Каждый раз вопросы разные.",
    tip: "В настройках квиза можно выбрать только нужные типы заданий.",
  },
  {
    illBg: "bg-[#EDEAE4] dark:bg-[#151412]",
    title: "Следи за прогрессом",
    description:
      "Стрики, достижения и подробная статистика. Возвращайся каждый день — алгоритм покажет только слова, которые пора повторить.",
    tip: "В профиле есть активность за последние месяцы и все достижения.",
  },
  {
    illBg: "bg-[#1A1714] dark:bg-[#FF5733]",
    title: "Всё готово!",
    description:
      "Создай первый набор и начни учить прямо сейчас. Удачи!",
  },
];

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const ILLUSTRATIONS = [
  WelcomeIll,
  CollectionsIll,
  FlashcardsIll,
  QuizIll,
  ProgressIll,
  DoneIll,
];

export default function OnboardingModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const total = STEPS.length;

  const goNext = useCallback(() => {
    if (step < total - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step, total]);

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
    onClose();
    if (step === total - 1) navigate("/");
  };

  const skip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "done");
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, goNext]);

  // Reset step on reopen
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);

  const current = STEPS[step];
  const IllComponent = ILLUSTRATIONS[step];
  const isLast = step === total - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#1A1714]/50 dark:bg-black/60 backdrop-blur-xl"
            onClick={skip}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative w-full max-w-sm bg-white dark:bg-[#1A1917] rounded-4xl overflow-hidden shadow-2xl border border-[#E0DBD3] dark:border-[#2E2C29]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Illustration area */}
            <div className={`relative h-52 ${current.illBg} transition-colors duration-300`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22 }}
                  className="absolute inset-0"
                >
                  <IllComponent />
                </motion.div>
              </AnimatePresence>

              {/* Top overlay: dots + skip */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4">
                {/* Progress dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === step
                          ? "w-5 h-2 bg-white"
                          : i < step
                          ? "w-2 h-2 bg-white/60"
                          : "w-2 h-2 bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                {/* Skip */}
                {!isLast && (
                  <button
                    onClick={skip}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-[0.15em] transition-colors"
                  >
                    Пропустить <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pb-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B5B0A8] mb-2">
                    {step + 1} / {total}
                  </div>
                  <h2 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8] tracking-tight mb-2 leading-tight">
                    {current.title}
                  </h2>
                  <p className="text-sm text-[#7A756E] dark:text-[#8A867F] leading-relaxed font-medium mb-4">
                    {current.description}
                  </p>
                  {current.tip && (
                    <div className="flex gap-2.5 p-3 bg-[#FFF0ED] dark:bg-[#2A1A15] rounded-2xl mb-4">
                      <span className="shrink-0 text-sm">💡</span>
                      <p className="text-[11px] font-medium text-[#FF5733] leading-snug">
                        {current.tip}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] hover:bg-[#F5F2ED] dark:hover:bg-[#242220] text-[11px] font-black uppercase tracking-[0.12em] transition-colors"
                  >
                    <ArrowLeft size={13} />
                    Назад
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl text-[11px] font-black uppercase tracking-[0.12em] hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors active:scale-[0.98]"
                >
                  {isLast ? "Начать! 🚀" : (
                    <>Далее <ArrowRight size={13} /></>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
