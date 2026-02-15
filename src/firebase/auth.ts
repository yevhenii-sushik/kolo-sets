import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './config';

// Регистрация через Email/Password
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Обновляем профиль с именем
  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  
  return userCredential.user;
};

// Вход через Email/Password
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Вход через Google
export const loginWithGoogle = async (): Promise<User> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
};

// Выход
export const logout = async (): Promise<void> => {
  await signOut(auth);
};

// Получить текущего пользователя
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
