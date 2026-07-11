import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bug, Lightbulb, MessageSquareHeart, CheckCircle2, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TELEGRAM_BOT_TOKEN = '8233442957:AAFTgYmWbGUyYOyK-unrNJfHWushm1J6AXE';
const TELEGRAM_CHAT_ID = '705285041';

type FeedbackType = 'bug' | 'feature' | 'change' | 'review';

const TYPES = [
  { id: 'bug' as FeedbackType,     label: 'Bug report',        emoji: '🐞', icon: Bug,                color: 'text-red-500',    bg: 'bg-red-500/10' },
  { id: 'feature' as FeedbackType, label: 'Feature request',   emoji: '💡', icon: Lightbulb,          color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'change' as FeedbackType,  label: 'Improvement',       emoji: '⚡', icon: Zap,                color: 'text-blue-500',   bg: 'bg-blue-500/10' },
  { id: 'review' as FeedbackType,  label: 'Feedback / Review', emoji: '❤️', icon: MessageSquareHeart, color: 'text-pink-500',   bg: 'bg-pink-500/10' },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [type, setType] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setIsSubmitting(true);
    const selected = TYPES.find(t => t.id === type)!;

    const text = `${selected.emoji} *New Feedback: ${selected.label}*\n`
      + `-------------------------\n`
      + `📌 *Subject:* ${formData.title}\n`
      + `📧 *Email:* ${formData.email || 'not provided'}\n`
      + `👤 *User:* ${user?.email ?? 'not logged in'}\n`
      + `💬 *Message:*\n${formData.message}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'Markdown' }),
      });
      if (res.ok) setIsSent(true);
    } catch {
      alert('Could not send. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-12"
      >
        <div className="w-16 h-16 bg-[#FF5733] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#FF5733]/25">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-[#1A1714] dark:text-[#F0EDE8] mb-3 tracking-tight">Tusen Takk!</h2>
        <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] mb-8 font-medium leading-relaxed">
          Your message has been delivered to the Kolo team. We read every single one and aim to respond within 24 hours.
        </p>
        <button
          onClick={() => navigate(user ? '/' : '/welcome')}
          className="px-8 py-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors"
        >
          Back to {user ? 'App' : 'Home'}
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-start gap-4"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] shadow-sm">
            <MessageSquareHeart size={14} className="text-[#FF5733]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#7A756E]">
              Support Hub
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black italic font-serif text-[#1A1714] dark:text-[#F0EDE8] leading-none">
            We're <span className="text-[#FF5733]">listening.</span>
          </h1>
          <p className="text-[15px] text-[#7A756E] dark:text-[#8A867F] max-w-lg font-medium leading-relaxed">
            Found a bug or have a brilliant idea? Every message goes directly to the development team.
            We read everything and respond within 24 hours.
          </p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: type selector + info */}
        <div className="lg:col-span-4 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#B5B0A8] mb-4">
            Choose type
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 group ${
                  type === t.id
                    ? 'bg-[#1A1714] border-[#1A1714] text-white dark:bg-[#F0EDE8] dark:border-[#F0EDE8] dark:text-[#0F0E0C] shadow-lg'
                    : 'bg-white dark:bg-[#1A1917] border-[#E0DBD3] dark:border-[#2E2C29] text-[#7A756E] hover:border-[#FF5733]'
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${
                  type === t.id ? 'bg-white/10' : `${t.bg} ${t.color}`
                }`}>
                  <t.icon size={16} />
                </div>
                <span className="font-black text-[12px] uppercase tracking-tight">{t.label}</span>
                {type === t.id && <ArrowRight size={16} className="ml-auto opacity-60" />}
              </button>
            ))}
          </div>

          {/* Info card */}
          <div className="mt-6 p-5 bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-3xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} className="text-[#FF5733]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1A1714] dark:text-[#F0EDE8]">
                Did you know?
              </span>
            </div>
            <p className="text-[12px] text-[#7A756E] leading-relaxed font-medium">
              Most features in Kolo 0.2.x were suggested by users like you. Your feedback directly shapes the roadmap.
            </p>
          </div>

          {/* Legal links */}
          <div className="pt-2 flex gap-4 text-[11px] font-bold text-[#B5B0A8]">
            <Link to="/privacy" className="hover:text-[#FF5733] transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-[#FF5733] transition-colors">Terms of Service</Link>
          </div>
        </div>

        {/* Right: form */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {type ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                onSubmit={handleSubmit}
                className="bg-white dark:bg-[#1A1917] border border-[#E0DBD3] dark:border-[#2E2C29] rounded-4xl p-7 sm:p-10"
              >
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                      Subject *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="One-line summary"
                      className="w-full px-5 py-3.5 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-2xl outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium text-[14px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="For follow-up replies"
                      className="w-full px-5 py-3.5 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-2xl outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium text-[14px]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 mb-7">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe in detail — the more context you give, the faster we can help."
                    className="w-full px-5 py-4 bg-[#F5F2ED] dark:bg-[#0F0E0C] border border-transparent rounded-3xl outline-none focus:border-[#FF5733] transition-all dark:text-white font-medium text-[14px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] shadow-lg shadow-[#FF5733]/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send size={14} /> Send message</>
                  }
                </button>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-95 border-2 border-dashed border-[#E0DBD3] dark:border-[#2E2C29] rounded-4xl flex flex-col items-center justify-center text-center p-10"
              >
                <div className="w-16 h-16 bg-white dark:bg-[#1A1917] rounded-full flex items-center justify-center mb-5 shadow-sm">
                  <span className="text-2xl">👆</span>
                </div>
                <h3 className="text-[17px] font-black text-[#1A1714] dark:text-[#F0EDE8] uppercase tracking-tighter mb-2">
                  Pick a type first
                </h3>
                <p className="text-[13px] text-[#7A756E] max-w-xs font-medium">
                  Select a category on the left to open the message form.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
