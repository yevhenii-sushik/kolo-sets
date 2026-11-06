import { useState } from "react";
import { Bug, CheckCircle2, Lightbulb, MessageSquareHeart, Send, Zap } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import ConsentText from "../../components/legal/ConsentText";
import { Alert, Button, ButtonLink, Card, Field, Heading, Input, Text, Textarea } from "../../ui";
import { OptionButton, PageHeader, Section } from "../../components/other/PageSection";

// TODO(безопасность): токен бота виден любому в коде страницы — отправку нужно перенести на сервер
// (например, Cloud Function), а этот токен отозвать в @BotFather.
const TELEGRAM_BOT_TOKEN = "8233442957:AAFTgYmWbGUyYOyK-unrNJfHWushm1J6AXE";
const TELEGRAM_CHAT_ID = "705285041";

type FeedbackType = "bug" | "feature" | "change" | "review";

// Подписи в Telegram — для команды, поэтому по-английски и не зависят от языка интерфейса
const TYPES = [
  { id: "bug", icon: Bug, telegram: "Bug report" },
  { id: "feature", icon: Lightbulb, telegram: "Feature request" },
  { id: "change", icon: Zap, telegram: "Improvement" },
  { id: "review", icon: MessageSquareHeart, telegram: "Feedback / Review" },
] as const;

const EMPTY_FORM = { title: "", message: "", email: "" };

export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const sp = t.other.supportPage;

  const [type, setType] = useState<FeedbackType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setIsSubmitting(true);
    setSendFailed(false);
    const selected = TYPES.find((x) => x.id === type)!;

    const text =
      `*New Feedback: ${selected.telegram}*\n` +
      `-------------------------\n` +
      `📌 *Subject:* ${formData.title}\n` +
      `📧 *Email:* ${formData.email || "not provided"}\n` +
      `👤 *User:* ${user?.email ?? "not logged in"}\n` +
      `💬 *Message:*\n${formData.message}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
      });
      if (res.ok) setIsSent(true);
      else setSendFailed(true);
    } catch {
      setSendFailed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const writeAnother = () => {
    setFormData(EMPTY_FORM);
    setType(null);
    setIsSent(false);
  };

  if (isSent) {
    return (
      <Card padding="lg" className="mx-auto grid max-w-md justify-items-center gap-3 py-12 text-center">
        <span className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 size={30} />
        </span>
        <Heading size={2}>{sp.sentTitle}</Heading>
        <Text tone="muted">{sp.sentText}</Text>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={writeAnother}>
            {sp.sentAgain}
          </Button>
          <ButtonLink to={user ? "/" : "/welcome"}>{sp.sentHome}</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-5">
      <PageHeader title={sp.title} subtitle={sp.subtitle} />

      <Section title={sp.typeTitle} description={type ? undefined : sp.pickType}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TYPES.map(({ id, icon: Icon }) => (
            <OptionButton key={id} active={type === id} onClick={() => setType(id)} className="flex items-center gap-3 px-4 py-3 text-left">
              <Icon size={20} className="shrink-0" />
              <span className="grid gap-0.5">
                <span>{sp.types[id]}</span>
                <span className="text-xs font-normal text-muted">{sp.typeHints[id]}</span>
              </span>
            </OptionButton>
          ))}
        </div>
      </Section>

      {type && (
        <form onSubmit={handleSubmit}>
          <Card padding="lg" className="grid grid-cols-1 gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={sp.subject} htmlFor="support-subject">
                <Input
                  id="support-subject"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={sp.subjectPlaceholder}
                />
              </Field>
              <Field label={sp.email} hint={sp.emailHint} htmlFor="support-email">
                <Input
                  id="support-email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Field>
            </div>

            <Field label={sp.message} htmlFor="support-message">
              <Textarea
                id="support-message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={sp.messagePlaceholder}
              />
            </Field>

            {sendFailed && <Alert>{sp.sendError}</Alert>}

            <Button type="submit" size="lg" fullWidth loading={isSubmitting} iconLeft={<Send size={16} />}>
              {sp.send}
            </Button>
            <p className="text-center text-xs leading-snug text-muted">
              <ConsentText template={t.legal.consent.support} />
            </p>
          </Card>
        </form>
      )}
    </div>
  );
}
