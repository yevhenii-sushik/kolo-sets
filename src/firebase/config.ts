import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Ключ теперь берется из файла .env.local
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "kolo-sets.firebaseapp.com",
  projectId: "kolo-sets",
  storageBucket: "kolo-sets.firebasestorage.app",
  messagingSenderId: "34261297782",
  appId: "1:34261297782:web:a6296e9153d07643920d57",
  measurementId: "G-QSS4CEBGMS"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Сервисы Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;