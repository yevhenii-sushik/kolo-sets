// Firebase Admin для серверных функций. Ключ — только из переменных окружения (docs/specs/00-server.md).
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const PROJECT_ID = "kolo-sets";

function app(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  // Локальные тесты на эмуляторах: ключ не нужен
  if (process.env.FIRESTORE_EMULATOR_HOST) return initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? PROJECT_ID });

  // На Netlify у функций общий лимит переменных ~4 КБ, поэтому храним только нужные поля ключа.
  // Закрытый ключ в переменной — с «\n» вместо переносов строк.
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) throw new Error("FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY are not set");
  return initializeApp({
    credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID ?? PROJECT_ID, clientEmail, privateKey }),
  });
}

export const db = () => getFirestore(app());
export const adminAuth = () => getAuth(app());
