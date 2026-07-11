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
import {
  syncCollectionsToFirestore,
  getUserProfile
} from '../firebase/firestore';
import { getLocalCollections } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await getUserProfile(firebaseUser.uid);

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
    await deleteUserData(user.uid);
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
      {!loading && children}
    </AuthContext.Provider>
  );
};
