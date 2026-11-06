import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Alert, Button, Field, Input } from '../../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import ConsentText from '../../components/legal/ConsentText';
import AuthLayout, { AuthDivider } from '../../components/auth/AuthLayout';
import GoogleButton from '../../components/auth/GoogleButton';
import PasswordField from '../../components/auth/PasswordField';

// Коды Firebase Auth → ключи переведённых ошибок
const AUTH_ERRORS: Record<string, 'emailInUse' | 'invalidEmail' | 'weakPassword' | 'wrongCredentials' | 'tooManyRequests'> = {
  'auth/email-already-in-use': 'emailInUse',
  'auth/invalid-email': 'invalidEmail',
  'auth/weak-password': 'weakPassword',
  'auth/user-not-found': 'wrongCredentials',
  'auth/wrong-password': 'wrongCredentials',
  'auth/invalid-credential': 'wrongCredentials',
  'auth/too-many-requests': 'tooManyRequests',
};

const LINK = 'font-semibold text-accent-ink hover:underline underline-offset-2';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginGoogle } = useAuth();
  const { t } = useI18n();
  const a = t.auth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(a.errors[AUTH_ERRORS[err.code] ?? 'generic']);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginGoogle();
      navigate('/');
    } catch {
      setError(a.errors.google);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={a.login.title}
      subtitle={a.login.subtitle}
      footer={
        <>
          {a.login.noAccount}{' '}
          <Link to="/register" className={LINK}>
            {a.login.register}
          </Link>
        </>
      }
    >
      <div className="grid gap-6">
        {error && <Alert>{error}</Alert>}

        <form onSubmit={handleEmailLogin} className="grid gap-4">
          <Field label={a.email} htmlFor="email">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder={a.emailPlaceholder}
              required
              iconLeft={<Mail size={18} />}
            />
          </Field>
          <PasswordField id="password" label={a.password} value={password} onChange={setPassword} autoComplete="current-password" />
          <Link to="/forgot-password" className="-mt-1 justify-self-end text-sm font-medium text-accent-ink hover:underline underline-offset-2">
            {a.login.forgot}
          </Link>
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? a.login.loading : a.login.submit}
          </Button>
        </form>

        <AuthDivider>{a.or}</AuthDivider>

        <div className="grid gap-3">
          <GoogleButton onClick={handleGoogleLogin} disabled={loading}>
            {a.google}
          </GoogleButton>
          {/* Вход через Google может создать новый аккаунт — показываем, с чем соглашается пользователь */}
          <p className="text-center text-xs leading-snug text-faint">
            <ConsentText template={t.legal.consent.google} labels={t.legal.consent.labels} />
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
