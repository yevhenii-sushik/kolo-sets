import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logout as firebaseLogout
} from '../firebase/auth';
import {
  syncCollectionsToFirestore,
  getUserProfile
} from '../firebase/firestore';
import { getCollections } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncCollections: () => Promise<void>;
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
        // Пользователь вошел - проверяем профиль
        await getUserProfile(firebaseUser.uid);
        
        // Синхронизируем локальные данные с Firestore
        const localCollections = await getCollections();
        if (localCollections.length > 0) {
          // Если есть локальные данные, синхронизируем их
          try {
            await syncCollectionsToFirestore(firebaseUser.uid, localCollections);
            console.log('Локальные данные синхронизированы с облаком');
          } catch (error) {
            console.error('Ошибка синхронизации:', error);
          }
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
    
    const localCollections = await getCollections();
    await syncCollectionsToFirestore(user.uid, localCollections);
  };

  const value = {
    user,
    loading,
    register,
    login,
    loginGoogle,
    logout,
    syncCollections
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
