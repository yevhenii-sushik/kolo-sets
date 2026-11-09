import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, CheckCircle2, CircleHelp, Compass, Lightbulb, Mail, MessageSquareHeart, Rocket, Send } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useI18n } from "../../contexts/I18nContext";
import ConsentText from "../../components/legal/ConsentText";
import { ONBOARDING_STORAGE_KEY } from "../../components/OnboardingModal";
import { Alert, Button, ButtonLink, Card, Field, Heading, Switch, Text, Textarea, cx } from "../../ui";
import { PageHeader } from "../../components/other/PageSection";
import { SettingsGroup, SettingsRow } from "../../components/other/SettingsList";
import { LEGAL } from "../legal/legalInfo";
import { sendSupport, type SupportTopic as Topic } from "../../api/support";

// Темы — в том же порядке, что и на сервере (server/core/support.ts)
const TOPICS: readonly { id: Topic; icon: typeof Bug }[] = [
  { id: "problem", icon: Bug },
  { id: "question", icon: CircleHelp },
  { id: "idea", icon: Lightbulb },
  { id: "feedback", icon: MessageSquareHeart },
];

// Поддержка — как настройки: одна карточка-форма (тема, сообщение, ответ на почту аккаунта)
// и ниже список других способов: почта для скриншотов, «Что нового», знакомство с приложением
export default function SupportPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const sp = t.other.supportPage;
  const email = user?.email ?? "";

  const [topic, setTopic] = useState<Topic | null>(null);
  const [topicMissing, setTopicMissing] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [sentReplyTo, setSentReplyTo] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) {
      setTopicMissing(true);
      return;
    }
    setIsSubmitting(true);
    setSendFailed(false);
    const replyTo = reply && email ? email : null;

    // Почту сервер берёт из аккаунта сам; отсюда — только тема, текст и нужен ли ответ
    const ok = await sendSupport(topic, message.trim(), replyTo !== null);
    setIsSubmitting(false);
    if (!ok) {
      setSendFailed(true);
      return;
    }
    setSentReplyTo(replyTo);
    setIsSent(true);
  };

  const writeAnother = () => {
    setTopic(null);
    setMessage("");
    setIsSent(false);
  };

  if (isSent) {
    return (
      <Card padding="lg" className="mx-auto grid max-w-md justify-items-center gap-3 py-12 text-center">
        <span className="mb-2 grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 size={30} />
        </span>
        <Heading size={2}>{sp.sentTitle}</Heading>
        <Text tone="muted">
          {sp.sentText}
          {sentReplyTo && <> {sp.sentReply.replace("{email}", sentReplyTo)}</>}
        </Text>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={writeAnother}>
            {sp.sentAgain}
          </Button>
          <ButtonLink to="/">{sp.sentHome}</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-7">
      <PageHeader title={sp.title} subtitle={sp.subtitle} />

      <form onSubmit={handleSubmit} className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {/* ── Тема: без неё команде трудно разобрать входящие ── */}
        <div className="grid gap-3 p-4">
          <p id="support-topic" className="text-sm font-medium text-fg">
            {sp.topicTitle}
          </p>
          <div role="radiogroup" aria-labelledby="support-topic" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TOPICS.map(({ id, icon: Icon }) => {
              const active = topic === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setTopic(id);
                    setTopicMissing(false);
                  }}
                  className={cx(
                    "flex h-11 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-semibold transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    active ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-muted hover:bg-inset hover:text-fg",
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="truncate">{sp.topics[id]}</span>
                </button>
              );
            })}
          </div>
          {topicMissing && (
            <p className="text-xs text-danger" role="alert">
              {sp.topicRequired}
            </p>
          )}
        </div>

        <div className="p-4">
          <Field label={sp.message} htmlFor="support-message">
            <Textarea
              id="support-message"
              required
              rows={6}
              maxLength={3000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={topic ? sp.placeholders[topic] : sp.messagePlaceholder}
            />
          </Field>
        </div>

        {email && (
          <SettingsRow
            icon={<Mail size={16} />}
            tone="info"
            title={sp.reply}
            description={email}
            control={<Switch checked={reply} onChange={setReply} label={sp.reply} />}
          />
        )}

        <div className="grid gap-3 p-4">
          {sendFailed && <Alert>{sp.sendError}</Alert>}
          <Button type="submit" size="lg" fullWidth loading={isSubmitting} iconLeft={<Send size={16} />}>
            {sp.send}
          </Button>
          <p className="text-center text-xs leading-snug text-muted">
            <ConsentText template={t.legal.consent.support} />
          </p>
        </div>
      </form>

      {/* ── Другие способы: почта — когда нужен скриншот; остальное помогает без письма ── */}
      <SettingsGroup title={sp.otherTitle}>
        <SettingsRow
          icon={<Mail size={16} />}
          tone="accent"
          title={sp.mail}
          description={sp.mailHint.replace("{email}", LEGAL.email.support)}
          href={`mailto:${LEGAL.email.support}`}
        />
        <SettingsRow icon={<Rocket size={16} />} tone="success" title={t.other.updates} description={sp.updatesHint} to="/other/updates" />
        <SettingsRow
          icon={<Compass size={16} />}
          tone="special"
          title={t.settings.tour.title}
          description={t.settings.tour.hint}
          onClick={() => {
            localStorage.removeItem(ONBOARDING_STORAGE_KEY);
            navigate("/");
          }}
        />
      </SettingsGroup>
    </div>
  );
}
