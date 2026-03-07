import { useState } from 'react';
import { Send, Bug, Lightbulb, MessageSquareHeart, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Константы для Telegram (в реальном проекте лучше хранить в .env)
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
    { id: 'bug', label: 'Баг / Ошибка', icon: <Bug />, color: 'text-red-500', bg: 'bg-red-500/10', emoji: '🐞' },
    { id: 'feature', label: 'Новая идея', icon: <Lightbulb />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', emoji: '💡' },
    { id: 'change', label: 'Улучшение', icon: <Zap />, color: 'text-blue-500', bg: 'bg-blue-500/10', emoji: '⚡' },
    { id: 'review', label: 'Отзыв', icon: <MessageSquareHeart />, color: 'text-pink-500', bg: 'bg-pink-500/10', emoji: '❤️' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedType = types.find(t => t.id === type);
    
    // Формируем текст для Telegram
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
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        setIsSent(true);
      } else {
        throw new Error('Ошибка сети');
      }
    } catch (error) {
      alert('Не удалось отправить сообщение. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/20">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Tusen takk!</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">Ваше сообщение уже летит к нам. Мы ценим ваш вклад в развитие Kolo Sets.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black transition-transform active:scale-95 shadow-lg shadow-purple-500/30"
        >
          Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 italic">
          Kolo <span className="text-purple-600">Feedback</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl leading-relaxed">
          Заметили ошибку или есть крутая идея? Напишите нам, мы читаем каждое сообщение.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {types.map((t) => (
          <button
            key={t.id}
            onClick={() => setType(t.id as FeedbackType)}
            className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 text-center group ${
              type === t.id 
              ? 'border-purple-600 bg-purple-600/5 shadow-xl shadow-purple-500/10 scale-105' 
              : 'border-transparent bg-white/60 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700'
            }`}
          >
            <div className={`p-4 rounded-2xl ${t.bg} ${t.color} group-hover:scale-110 transition-transform`}>
              {t.icon}
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white">{t.label}</span>
          </button>
        ))}
      </div>

      {type && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Заголовок</label>
                <input
                  type="text"
                  placeholder="О чем ваше сообщение?"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email для ответа</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Подробности</label>
              <textarea
                placeholder={type === 'bug' ? 'Опишите, как это случилось...' : 'Опишите ваше предложение...'}
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all dark:text-white resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  <span>Отправить фидбек</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="mt-12 flex items-center gap-4 p-6 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/10 rounded-[2rem]">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl">
          <Sparkles className="text-purple-500" size={24} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Мы читаем каждое сообщение и отвечаем в течение 24 часов.
        </p>
      </div>
    </div>
  );
}