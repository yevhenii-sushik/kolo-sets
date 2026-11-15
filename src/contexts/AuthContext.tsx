import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
} from '../firebase/auth';
import { deleteUserData } from '../firebase/firestore';
import { cleanupAccount } from '../api/progress';
import {
  syncCollectionsToFirestore,
  getUserProfile
} from '../firebase/firestore';
import { getLocalCollections } from '../utils/storage';
import { hasCachedProfile, hadSignInOnDevice } from '../utils/profileCache';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Показывать ли интерфейс «вошёл»: после ответа Firebase — есть ли пользователь, до ответа —
   *  входили ли на этом устройстве раньше. Публичные страницы по нему решают, ждать ли Firebase */
  expectUser: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncCollections: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Первый вход с этого устройства: дожидаемся профиля — getUserProfile создаст его новичку.
        // Если копия профиля уже есть, документ точно существует, и свежий профиль загрузит
        // DataContext: приложение не ждёт сети перед первым кадром
        if (!hasCachedProfile(firebaseUser.uid)) await getUserProfile(firebaseUser.uid);

        // Синхронизируем локальные данные один раз — при первом входе с этого устройства.
        // При каждом reload не синхронизируем: локальные данные могут быть устаревшими
        // и перезаписать актуальные облачные.
        const syncKey = `collections_synced_${firebaseUser.uid}`;
        if (!localStorage.getItem(syncKey)) {
          const localCollections = getLocalCollections();
          if (localCollections.length > 0) {
            try {
              await syncCollectionsToFirestore(firebaseUser.uid, localCollections);
            } catch (error) {
              console.error('Ошибка синхронизации:', error);
            }
          }
          localStorage.setItem(syncKey, '1');
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    await registerWithEmail(email, password, displayName);
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

  const syncCollections = async () => {
    if (!user) return;
    const localCollections = getLocalCollections();
    await syncCollectionsToFirestore(user.uid, localCollections);
  };

  const deleteAccount = async () => {
    if (!user) return;
    // Журнал тренировок пишет только сервер — он его и удаляет; не вышло — пробуем сами
    const sessionsCleared = await cleanupAccount();
    await deleteUserData(user.uid, { sessionsCleared });
    await firebaseDeleteAccount();
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
    register,
    login,
    loginGoogle,
    logout,
    syncCollections,
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
