import {
  AuthCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  signInAnonymously,
  signInWithCredential,
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

// Регистрация — только почта и пароль (шаг 17 в docs/specs/06-audit-fixes.md): имя потом, в профиле
export const registerWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  if (userCredential.user) {
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

// ── Пробный режим (шаг 16 в docs/specs/06-audit-fixes.md) ──────────────────
// Пробный аккаунт — анонимный вход Firebase: тот же uid, те же правила базы и серверные функции.
// «Сохранить прогресс» привязывает к нему почту или Google — uid не меняется, ничего не переносится

export const startTrial = async (): Promise<User> => (await signInAnonymously(auth)).user;

// Чем закончилась попытка сохранить прогресс. taken — этот Google или эта почта уже у другого аккаунта Kolo:
// войти можно только в него (credential — готовый вход для Google; для почты нужен её пароль)
export type LinkResult =
  | { ok: true }
  | { ok: false; taken: 'google'; credential: AuthCredential; email: string | null }
  | { ok: false; taken: 'email'; email: string };

const errorCode = (err: unknown) => (err as { code?: string })?.code ?? '';

export const linkGoogle = async (): Promise<LinkResult> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  try {
    const result = await linkWithPopup(user, googleProvider);
    // Имя и фото из Google — как у тех, кто сразу вошёл через Google
    const google = result.user.providerData.find((p) => p.providerId === 'google.com');
    if (google && (!result.user.displayName || !result.user.photoURL)) {
      await updateProfile(result.user, {
        displayName: result.user.displayName || google.displayName,
        photoURL: result.user.photoURL || google.photoURL,
      }).catch(() => {});
    }
    return { ok: true };
  } catch (err) {
    const code = errorCode(err);
    if (code === 'auth/credential-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(err as never);
      if (credential) return { ok: false, taken: 'google', credential, email: (err as any)?.customData?.email ?? null };
    }
    // Почта этого Google уже занята аккаунтом с паролем — войти можно паролем
    if (code === 'auth/email-already-in-use') {
      const email = (err as any)?.customData?.email;
      if (typeof email === 'string') return { ok: false, taken: 'email', email };
    }
    throw err;
  }
};

export const linkEmail = async (email: string, password: string): Promise<LinkResult> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  try {
    const result = await linkWithCredential(user, EmailAuthProvider.credential(email, password));
    withContinueUrl((settings) => sendEmailVerification(result.user, settings)).catch(() => {});
    return { ok: true };
  } catch (err) {
    if (errorCode(err) === 'auth/email-already-in-use') return { ok: false, taken: 'email', email };
    throw err;
  }
};

// Войти в уже существующий аккаунт вместо пробного (пробный остаётся и удалится сам через 30 дней)
export const signInExisting = async (
  how: { credential: AuthCredential } | { email: string; password: string },
): Promise<User> =>
  'credential' in how
    ? (await signInWithCredential(auth, how.credential)).user
    : (await signInWithEmailAndPassword(auth, how.email, how.password)).user;
