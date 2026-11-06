import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { Alert, Button, ButtonLink, Field, Input } from '../../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useI18n();
  const f = t.auth.forgot;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      // Не выдаём, есть ли такой аккаунт: на «нет пользователя» отвечаем так же, как на успех
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setSent(true);
      } else {
        setError(t.auth.errors.generic);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        title={f.sentTitle}
        subtitle={f.sentText.split('{email}').map((part, i) => (
          <span key={i}>
            {i > 0 && <strong className="font-semibold text-fg">{email}</strong>}
            {part}
          </span>
        ))}
      >
        <div className="grid gap-6">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-success-soft text-success">
            <MailCheck size={26} />
          </span>
          <ButtonLink to="/login" size="lg" variant="secondary" fullWidth iconLeft={<ArrowLeft size={18} />}>
            {f.back}
          </ButtonLink>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={f.title}
      subtitle={f.subtitle}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-accent-ink hover:underline underline-offset-2">
          <ArrowLeft size={16} />
          {f.back}
        </Link>
      }
    >
      <div className="grid gap-6">
        {error && <Alert>{error}</Alert>}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label={t.auth.email} htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
              required
              iconLeft={<Mail size={18} />}
            />
          </Field>
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? f.loading : f.submit}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
