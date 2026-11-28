import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Alert, Button, Field, Input } from '../../ui';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { afterSignInPath } from '../../sharedSets/pending';
import { auth } from '../../firebase/config';
import { recordLegalAcceptance } from '../../firebase/firestore';
import ConsentText from '../../components/legal/ConsentText';
import { LEGAL } from '../legal/legalInfo';
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginGoogle } = useAuth();
  const { t } = useI18n();
  const c = t.legal.consent;
  const a = t.auth;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Сохраняем факт согласия; сбой записи не должен мешать регистрации
  const saveAcceptance = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await recordLegalAcceptance(uid, LEGAL.version);
    } catch (err) {
      console.error('Failed to record legal acceptance', err);
    }
  };

  // Регистрация короче (шаг 17 в docs/specs/06-audit-fixes.md): почта и пароль — и всё. Пароль не повторяем
  // (его можно показать кнопкой в поле), имя — потом, в профиле; галочки нет — согласие строкой под кнопками,
  // как у пробного входа (решение пользователя 2026-11-28). Факт и версия согласия записываются, как раньше
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(a.errors.passwordTooShort);
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      await saveAcceptance();
      navigate(afterSignInPath());
    } catch (err: any) {
      setError(a.errors[AUTH_ERRORS[err.code] ?? 'generic']);
    } finally {
      setLoading(false);
    }
  };

  // Согласие строкой под обеими кнопками — оно и для Google
  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await loginGoogle();
      await saveAcceptance();
      navigate(afterSignInPath());
    } catch {
      setError(a.errors.google);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={a.register.title}
      subtitle={a.register.subtitle}
      footer={
        <>
          {a.register.haveAccount}{' '}
          <Link to="/login" className="font-semibold text-accent-ink hover:underline underline-offset-2">
            {a.register.login}
          </Link>
        </>
      }
    >
      <div className="grid gap-6">
        {error && <Alert>{error}</Alert>}

        <form onSubmit={handleRegister} className="grid gap-4">
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
          <PasswordField id="password" label={a.password} value={password} onChange={setPassword} autoComplete="new-password" />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? a.register.loading : a.register.submit}
          </Button>
        </form>

        <AuthDivider>{a.or}</AuthDivider>

        <GoogleButton onClick={handleGoogleRegister} disabled={loading}>
          {a.google}
        </GoogleButton>

        <p className="text-center text-xs leading-snug text-faint">
          <ConsentText template={c.register} labels={c.labels} />
        </p>
      </div>
    </AuthLayout>
  );
}
