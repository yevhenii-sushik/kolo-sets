import { createContext, useContext, useState, useEffect, useReducer, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout as firebaseLogout,
  deleteAccount as firebaseDeleteAccount,
  resetPassword as firebaseResetPassword,
  resendVerificationEmail as firebaseResendVerification,
  startTrial as firebaseStartTrial,
  linkGoogle,
  linkEmail,
  type LinkResult,
} from '../firebase/auth';
import { recordTrialStart } from '../firebase/firestore';
import { LEGAL } from '../pages/legal/legalInfo';
import { standing as standingOf, verifyDaysLeft as daysLeftOf, type AccountFacts, type Standing } from '../../server/core/access';

// Факты об аккаунте для правила доступа (server/core/access.ts) — те же, что видит сервер
function factsOf(user: User): AccountFacts {
  const ids = user.providerData.map((p) => p.providerId);
  const provider = user.isAnonymous ? 'anonymous' : ids.includes('google.com') ? 'google.com' : ids.includes('password') ? 'password' : ids[0] ?? null;
  const created = user.metadata.creationTime ? Date.parse(user.metadata.creationTime) : NaN;
  return { provider, emailVerified: user.emailVerified, createdAt: Number.isFinite(created) ? new Date(created).toISOString() : null };
}
import { deleteUserData } from '../firebase/firestore';
import { cleanupAccount } from '../api/progress';
import { getUserProfile } from '../firebase/firestore';
import { hasCachedProfile, hadSignInOnDevice } from '../utils/profileCache';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Показывать ли интерфейс «вошёл»: после ответа Firebase — есть ли пользователь, до ответа —
   *  входили ли на этом устройстве раньше. Публичные страницы по нему решают, ждать ли Firebase */
  expectUser: boolean;
  /** Пробный режим: вошёл без аккаунта (анонимный вход), прогресс — только на этом устройстве */
  isTrial: boolean;
  /** Кто это для правил доступа: проба, почта ждёт подтверждения (неделя), «стоп», подтверждён, старый аккаунт */
  standing: Standing | null;
  /** Сколько дней осталось подтвердить почту (у standing === 'pending') */
  verifyDaysLeft: number;
  /** Перечитать аккаунт после письма: true — почта подтверждена (токен обновлён, сервер это тоже увидит) */
  refreshVerification: () => Promise<boolean>;
  /** «Попробовать без регистрации»: анонимный вход и согласие, данное строкой под кнопкой */
  startTrial: () => Promise<void>;
  /** «Сохранить прогресс»: привязать Google или почту к пробному аккаунту — uid тот же, ничего не теряется */
  saveWithGoogle: () => Promise<LinkResult>;
  saveWithEmail: (email: string, password: string) => Promise<LinkResult>;
  register: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadSignIn] = useState(hadSignInOnDevice);
  // Привязка почты или Google меняет тот же объект User, и onAuthStateChanged не срабатывает —
  // перерисовываем сами, чтобы пробный режим пропал с экрана сразу
  const [, userChanged] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Первый вход с этого устройства: дожидаемся профиля — getUserProfile создаст его новичку.
        // Если копия профиля уже есть, документ точно существует, и свежий профиль загрузит
        // DataContext: приложение не ждёт сети перед первым кадром
        if (!hasCachedProfile(firebaseUser.uid)) await getUserProfile(firebaseUser.uid);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const startTrial = async () => {
    const trialUser = await firebaseStartTrial();
    // Сбой записи согласия не мешает попробовать: строка под кнопкой уже показана
    recordTrialStart(trialUser.uid, LEGAL.version).catch((err) => console.error('Failed to record trial start', err));
  };

  const saveWithGoogle = async () => {
    const result = await linkGoogle();
    if (result.ok) userChanged();
    return result;
  };

  const saveWithEmail = async (email: string, password: string) => {
    const result = await linkEmail(email, password);
    if (result.ok) userChanged();
    return result;
  };

  const refreshVerification = async () => {
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    if (current.emailVerified) await current.getIdToken(true);
    userChanged();
    return current.emailVerified;
  };

  const register = async (email: string, password: string) => {
    await registerWithEmail(email, password);
  };

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password);
  };

  const loginGoogle = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    await firebaseLogout();
  };

  const deleteAccount = async () => {
    if (!user) return;
    // Журнал тренировок пишет только сервер — он его и удаляет; не вышло — пробуем сами
    const sessionsCleared = await cleanupAccount();
    await deleteUserData(user.uid, { sessionsCleared });
    try {
      await firebaseDeleteAccount();
    } catch (err) {
      // Firebase удаляет аккаунт, только если вход был недавно. Пробный аккаунт войти заново не может, а его
      // данные уже удалены выше — просто выходим; пустой аккаунт удалит плановая уборка (server/trial.ts)
      if (!user.isAnonymous || (err as { code?: string })?.code !== 'auth/requires-recent-login') throw err;
      await firebaseLogout();
    }
  };

  const resetPassword = async (email: string) => {
    await firebaseResetPassword(email);
  };

  const sendVerificationEmail = async () => {
    await firebaseResendVerification();
  };

  const value = {
    user,
    loading,
    expectUser: loading ? hadSignIn : !!user,
    isTrial: !!user?.isAnonymous,
    standing: user ? standingOf(factsOf(user), new Date()) : null,
    verifyDaysLeft: user ? daysLeftOf(factsOf(user), new Date()) : 0,
    refreshVerification,
    startTrial,
    saveWithGoogle,
    saveWithEmail,
    register,
    login,
    loginGoogle,
    logout,
    deleteAccount,
    resetPassword,
    sendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Не ждём Firebase здесь: на телефонах и в Safari он перед ответом грузит скрипты входа Google
          (так окно входа не блокируется), и лендинг ждал бы их. Ждут только маршруты, которым нужен
          пользователь, — ProtectedRoute и PublicRoute в App.tsx */}
      {children}
    </AuthContext.Provider>
  );
};
