import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bug,
  Lightbulb,
  MessageSquareHeart,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { PageHeader, SectionCard, SectionTitle, fadeUp } from "../../components/other/PageSection";

const TELEGRAM_BOT_TOKEN = "8233442957:AAFTgYmWbGUyYOyK-unrNJfHWushm1J6AXE";
const TELEGRAM_CHAT_ID = "705285041";

type FeedbackType = "bug" | "feature" | "change" | "review";

const TYPES = [
  {
    id: "bug" as FeedbackType,
    label: "Bug report",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    id: "feature" as FeedbackType,
    label: "Feature request",
    icon: Lightbulb,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    id: "change" as FeedbackType,
    label: "Improvement",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "review" as FeedbackType,
    label: "Feedback / Review",
    icon: MessageSquareHeart,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [type, setType] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setIsSubmitting(true);
    const selected = TYPES.find((t) => t.id === type)!;

    const text =
      `*New Feedback: ${selected.label}*\n` +
      `-------------------------\n` +
      `📌 *Subject:* ${formData.title}\n` +
      `📧 *Email:* ${formData.email || "not provided"}\n` +
      `👤 *User:* ${user?.email ?? "not logged in"}\n` +
      `💬 *Message:*\n${formData.message}`;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: "Markdown",
          }),
        },
      );
      if (res.ok) setIsSent(true);
    } catch {
      alert("Could not send. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-16"
      >
        <div className="w-16 h-16 bg-[#FF5733] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#FF5733]/25">
          <CheckCircle2 size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-[#1A1714] dark:text-[#F0EDE8] mb-3 tracking-tight">
          Tusen Takk!
        </h2>
        <p className="text-[14px] text-[#7A756E] dark:text-[#8A867F] mb-8 font-medium leading-relaxed">
          Your message has been delivered to the Kolo team. We read every single
          one and aim to respond within 24 hours.
        </p>
        <button
          onClick={() => navigate(user ? "/" : "/welcome")}
          className="px-8 py-4 bg-[#1A1714] dark:bg-[#F0EDE8] text-white dark:text-[#0F0E0C] rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#FF5733] dark:hover:bg-[#FF5733] dark:hover:text-white transition-colors"
        >
          Back to {user ? "App" : "Home"}
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <PageHeader
        title="We're "
        accent="listening."
        subtitle="Found a bug or have a brilliant idea? Every message goes directly to the development team. We read everything and respond within 24 hours."
      />

      {/* Type selector */}
      <motion.div {...fadeUp(0.05)}>
        <SectionCard>
          <SectionTitle icon={Sparkles} label="Choose a type" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                    active
                      ? "border-[#FF5733] bg-[#FFF0ED] dark:bg-[#2A1A15]"
                      : "border-[#E0DBD3] dark:border-[#2E2C29] bg-[#F5F2ED] dark:bg-[#0F0E0C] hover:border-[#FF5733]/40"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      active ? "bg-white dark:bg-[#1A1917] text-[#FF5733]" : `${t.bg} ${t.color}`
                    }`}
                  >
                    <t.icon size={16} />
                  </div>
                  <span
                    className={`font-bold text-[13px] ${
                      active ? "text-[#FF5733]" : "text-[#7A756E] dark:text-[#8A867F]"
                    }`}
                  >
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {!type && (
            <p className="text-xs text-[#B5B0A8] dark:text-[#5A5652] font-medium mt-4 px-1">
              Select a category above to open the message form.
            </p>
          )}
        </SectionCard>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {type && (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
          >
            <SectionCard>
              <SectionTitle icon={Send} label="Your message" />

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="One-line summary"
                    className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#0F0E0C] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-2xl outline-none transition-colors dark:text-white font-medium text-[14px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="For follow-up replies"
                    className="w-full px-4 py-3 bg-[#F5F2ED] dark:bg-[#0F0E0C] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-2xl outline-none transition-colors dark:text-white font-medium text-[14px]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#B5B0A8] ml-1">
                  Message *
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Describe in detail — the more context you give, the faster we can help."
                  className="w-full px-4 py-3.5 bg-[#F5F2ED] dark:bg-[#0F0E0C] border-2 border-[#E0DBD3] dark:border-[#2E2C29] focus:border-[#FF5733] rounded-2xl outline-none transition-colors dark:text-white font-medium text-[14px] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#FF5733] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#E54D2A] transition-all active:scale-95 shadow-md shadow-[#FF5733]/25 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={14} /> Send message
                  </>
                )}
              </button>
            </SectionCard>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
