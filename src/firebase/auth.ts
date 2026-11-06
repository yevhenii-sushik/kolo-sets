import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification,
  ActionCodeSettings,
  User
} from 'firebase/auth';
import { auth, googleProvider } from './config';

// После подтверждения почты или сброса пароля кнопка «Продолжить» на странице Firebase ведёт обратно в Kolo.
// Адрес должен быть в разрешённых доменах Firebase Auth; если нет (например, тестовая выкладка Netlify),
// отправляем письмо без кнопки, а не теряем его.
async function withContinueUrl(send: (settings?: ActionCodeSettings) => Promise<void>): Promise<void> {
  try {
    await send({ url: `${window.location.origin}/` });
  } catch (err: any) {
    if (err?.code === 'auth/unauthorized-continue-uri' || err?.code === 'auth/invalid-continue-uri') {
      await send();
    } else {
      throw err;
    }
  }
}

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
    withContinueUrl((settings) => sendEmailVerification(userCredential.user, settings)).catch(() => {});
  }

  return userCredential.user;
};

export const loginWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const loginWithGoogle = async (): Promise<User> => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const deleteAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await deleteUser(user);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const resetPassword = async (email: string): Promise<void> => {
  await withContinueUrl((settings) => sendPasswordResetEmail(auth, email, settings));
};

export const resendVerificationEmail = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await withContinueUrl((settings) => sendEmailVerification(user, settings));
};
