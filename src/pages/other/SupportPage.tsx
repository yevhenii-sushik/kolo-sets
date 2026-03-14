import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bug, Lightbulb, MessageSquareHeart, 
  CheckCircle2, Sparkles, Zap,
  ArrowRight,  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TELEGRAM_BOT_TOKEN = '8233442957:AAFTgYmWbGUyYOyK-unrNJfHWushm1J6AXE';
const TELEGRAM_CHAT_ID = '705285041';

type FeedbackType = 'bug' | 'feature' | 'change' | 'review' | null;

export default function SupportPage() {
  const navigate = useNavigate();
  const [type, setType] = useState<FeedbackType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', email: '' });

  const types = [
    { id: 'bug', label: 'Баг / Ошибка', icon: <Bug size={20}/>, color: 'text-red-500', bg: 'bg-red-500/10', emoji: '🐞' },
    { id: 'feature', label: 'Новая идея', icon: <Lightbulb size={20}/>, color: 'text-orange-500', bg: 'bg-orange-500/10', emoji: '💡' },
    { id: 'change', label: 'Улучшение', icon: <Zap size={20}/>, color: 'text-blue-500', bg: 'bg-blue-500/10', emoji: '⚡' },
    { id: 'review', label: 'Отзыв', icon: <MessageSquareHeart size={20}/>, color: 'text-pink-500', bg: 'bg-pink-500/10', emoji: '❤️' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const selectedType = types.find(t => t.id === type);
    
    const text = `
${selectedType?.emoji} *Новый фидбек: ${selectedType?.label}*
-------------------------
📌 *Тема:* ${formData.title}
📧 *Email:* ${formData.email || 'не указан'}
💬 *Сообщение:*
${formData.message}
    `;

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: 'Markdown' }),
      });
      if (response.ok) setIsSent(true);
    } catch (error) {
      alert('Ошибка при отправке.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] dark:bg-[#0F0E0C] selection:bg-[#FF5733]/20 transition-colors duration-500">
      <div className="max-w-7xl mx-auto pt-16 pb-24 px-6">
        
        {/* 1. HEADER - В строгом соответствии с твоим запросом */}
        <header className="mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-4"
          >
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
              <MessageSquareHeart size={14} className="text-[#FF5733]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">Community & Support</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
              Support <span className="text-[#FF5733] italic">Hub.</span>
            </h1>
            <p className="text-xl text-[#7A756E] dark:text-[#8A867F] max-w-2xl font-medium leading-tight">
              Заметили ошибку или есть крутая идея? Мы читаем каждое сообщение и отвечаем в течение 24 часов.
            </p>
          </motion.div>
        </header>

        {/* 2. CONTENT */}
        {!isSent ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT SIDE: TYPE SELECTION */}
            <div className="lg:col-span-4 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B5B0A8] mb-6 ml-2">Выберите тип обращения</p>
              <div className="grid grid-cols-1 gap-3">
                {types.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setType(t.id as FeedbackType)}
                    className={`flex items-center gap-4 p-5 rounded-[2rem] border transition-all duration-300 group ${
                      type === t.id 
                      ? 'bg-[#1A1714] border-[#1A1714] text-white dark:bg-[#F0EDE8] dark:border-[#F0EDE8] dark:text-[#0F0E0C] shadow-xl' 
                      : 'bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] hover:border-[#FF5733]'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${type === t.id ? 'bg-white/10' : t.bg + ' ' + t.color}`}>
                      {t.icon}
                    </div>
                    <span className="font-black text-sm uppercase tracking-tight">{t.label}</span>
                    {type === t.id && <motion.div layoutId="arrow"><ArrowRight size={18} className="ml-auto" /></motion.div>}
                  </button>
                ))}
              </div>

              {/* INFO BOX */}
              <div className="mt-8 p-8 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles size={18} className="text-[#FF5733]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1714] dark:text-[#F0EDE8]">System Note</span>
                </div>
                <p className="text-xs text-[#7A756E] leading-relaxed font-medium">
                  Ваш фидбек напрямую влияет на приоритеты разработки. Большинство функций в версии 0.2.5 были предложены пользователями.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: FORM */}
            <main className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {type ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSubmit}
                    className="h-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-[3rem] p-8 md:p-12 shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-10 text-[#B5B0A8]">
                      <Terminal size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Message_Draft / {type}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-4">Тема</label>
                        <input
                          type="text"
                          required
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          placeholder="Заголовок сообщения"
                          className="w-full px-6 py-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-2xl outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-4">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="Для обратной связи"
                          className="w-full px-6 py-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-2xl outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mb-10">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-4">Описание</label>
                      <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Опишите детали..."
                        className="w-full px-6 py-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-[2rem] outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-5 bg-[#FF5733] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-[#FF5733]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Отправить протокол</>}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[400px] border-2 border-dashed border-[#E0DBD3] dark:border-[#2E2C29] rounded-[3rem] flex flex-col items-center justify-center text-center p-12"
                  >
                    <div className="w-20 h-20 bg-white dark:bg-[#1A1917] rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <MousePointer2 size={32} className="text-[#B5B0A8] animate-bounce" />
                    </div>
                    <h3 className="text-xl font-black text-[#1A1714] dark:text-[#F0EDE8] uppercase tracking-tighter">Ожидание выбора</h3>
                    <p className="text-sm text-[#7A756E] max-w-xs mt-2 font-medium">Пожалуйста, выберите тип обращения слева, чтобы открыть форму отправки.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        ) : (
          /* SUCCESS STATE */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-[#1A1714] dark:bg-[#F0EDE8] rounded-[3rem] p-16 text-center"
          >
            <div className="w-20 h-20 bg-[#FF5733] text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#FF5733]/40">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-4xl font-black text-white dark:text-[#0F0E0C] mb-4 uppercase tracking-tighter">Tusen Takk!</h2>
            <p className="text-[#7A756E] dark:text-[#8A867F] mb-10 font-medium">Ваше сообщение успешно передано команде Kolo. Мы ценим ваш вклад в развитие проекта.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-10 py-5 bg-[#FF5733] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95"
            >
              Вернуться на базу
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
}

// Доп иконка для пустого состояния
function MousePointer2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 19 9 7.5l10.5 4.5-5 1.5-1.5 5L4.5 19Z"/><path d="m14 14 6 6"/>
    </svg>
  )
}