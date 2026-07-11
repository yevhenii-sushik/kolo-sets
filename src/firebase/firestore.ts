import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  Timestamp,
  writeBatch,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './config';
import { Collection } from '../types';
import { calcUpdatedStreak } from '../utils/streak';

// Firestore отвергает undefined ('Unsupported field value: undefined').
// Optional-поля (folderId, isFavorite, order) могут прийти как явный undefined
// из spread'ов вида {...col, folderId: undefined} — вырезаем такие ключи.
const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
};

// Преобразование Collection в формат Firestore
const collectionToFirestore = (coll: Collection) => {
  return stripUndefined({
    ...coll,
    createdAt: Timestamp.fromDate(coll.createdAt),
    lastStudied: coll.lastStudied ? Timestamp.fromDate(coll.lastStudied) : null,
    cards: coll.cards.map(card => stripUndefined({
      ...card,
      createdAt: Timestamp.fromDate(card.createdAt),
      srsData: stripUndefined({
        ...card.srsData,
        nextReview: Timestamp.fromDate(card.srsData.nextReview),
        lastReviewed: card.srsData.lastReviewed
          ? Timestamp.fromDate(card.srsData.lastReviewed)
          : null
      })
    }))
  });
};

// Преобразование из Firestore в Collection
const firestoreToCollection = (data: any): Collection => {
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    lastStudied: data.lastStudied ? data.lastStudied.toDate() : undefined,
    cards: data.cards.map((card: any) => ({
      ...card,
      createdAt: card.createdAt.toDate(),
      srsData: {
        ...card.srsData,
        nextReview: card.srsData.nextReview.toDate(),
        lastReviewed: card.srsData.lastReviewed
          ? card.srsData.lastReviewed.toDate()
          : undefined
      }
    }))
  };
};

// Получить все коллекции пользователя
export const getUserCollections = async (userId: string): Promise<Collection[]> => {
  const collectionsRef = collection(db, 'users', userId, 'collections');
  const snapshot = await getDocs(collectionsRef);
  
  return snapshot.docs.map(doc => firestoreToCollection(doc.data()));
};

// Получить одну коллекцию
export const getUserCollection = async (
  userId: string,
  collectionId: string
): Promise<Collection | null> => {
  const docRef = doc(db, 'users', userId, 'collections', collectionId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return firestoreToCollection(docSnap.data());
  }
  return null;
};

// Сохранить коллекцию
export const saveUserCollection = async (
  userId: string,
  coll: Collection
): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'collections', coll.id);
  await setDoc(docRef, collectionToFirestore(coll));
};

// Точечно обновить метаданные коллекции (isFavorite, folderId, ...)
// без перезаписи всего документа с карточками.
// undefined в значении поля = удалить поле из документа.
export const updateUserCollectionFields = async (
  userId: string,
  collectionId: string,
  fields: Partial<Pick<Collection, 'isFavorite' | 'folderId' | 'order' | 'name' | 'language'>>
): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'collections', collectionId);
  const payload: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    payload[k] = v === undefined ? deleteField() : v;
  }
  await updateDoc(docRef, payload);
};

// Удалить коллекцию
export const deleteUserCollection = async (
  userId: string,
  collectionId: string
): Promise<void> => {
  const docRef = doc(db, 'users', userId, 'collections', collectionId);
  await deleteDoc(docRef);
};

// Синхронизировать все коллекции (из localStorage в Firestore)
export const syncCollectionsToFirestore = async (
  userId: string,
  collections: Collection[]
): Promise<void> => {
  const batch = writeBatch(db);
  
  collections.forEach(coll => {
    const docRef = doc(db, 'users', userId, 'collections', coll.id);
    batch.set(docRef, collectionToFirestore(coll));
  });
  
  await batch.commit();
};

// Получить или создать профиль пользователя
export const getUserProfile = async (userId: string) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  }
  
  // Создаем новый профиль
  const newProfile = {
    createdAt: Timestamp.now(),
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    achievements: [],
    studyHistory: [],
    stats: {
      totalCards: 0,
      cardsLearned: 0,
      quizzesTaken: 0,
      flashcardSessions: 0,
      totalStudyTime: 0,
      perfectQuizzes: 0
    },
    photoURL: null,
    displayName: null,
    username: null
  };
  
  await setDoc(docRef, newProfile);
  return newProfile;
};

// Обновить профиль пользователя
export const updateUserProfile = async (userId: string, data: any) => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, data, { merge: true });
};

// Общий хелпер для обновления статистики учебной сессии
const updateStudySession = async (
  userId: string,
  count: number,
  duration: number,
  statsUpdate: (stats: any) => void
) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return;

  const profile = docSnap.data();
  const today = new Date().toISOString().split('T')[0];

  const studyHistory = profile.studyHistory || [];
  const todayIndex = studyHistory.findIndex((d: any) => d.date === today);
  if (todayIndex >= 0) {
    studyHistory[todayIndex].sessions += 1;
    studyHistory[todayIndex].cardsStudied += count;
    studyHistory[todayIndex].timeSpent += duration;
  } else {
    studyHistory.push({ date: today, sessions: 1, cardsStudied: count, timeSpent: duration });
  }

  const currentStreak = calcUpdatedStreak(profile.currentStreak || 0, profile.lastStudyDate);
  const longestStreak = Math.max(currentStreak, profile.longestStreak || 0);

  const stats = { ...(profile.stats || {}) };
  stats.totalStudyTime = (stats.totalStudyTime || 0) + duration;
  statsUpdate(stats);

  await updateUserProfile(userId, {
    studyHistory,
    currentStreak,
    longestStreak,
    lastStudyDate: Timestamp.now(),
    stats
  });
};

export const updateFlashcardStats = (userId: string, cardsCount: number, duration: number) =>
  updateStudySession(userId, cardsCount, duration, (stats) => {
    stats.flashcardSessions = (stats.flashcardSessions || 0) + 1;
  });

// Удалить все данные пользователя (коллекции + профиль)
export const deleteUserData = async (userId: string): Promise<void> => {
  const collectionsRef = collection(db, 'users', userId, 'collections');
  const snapshot = await getDocs(query(collectionsRef));
  const batch = writeBatch(db);
  snapshot.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db, 'users', userId));
  await batch.commit();
};

export const updateQuizStats = (
  userId: string,
  questionsCount: number,
  correctAnswers: number,
  duration: number
) =>
  updateStudySession(userId, questionsCount, duration, (stats) => {
    stats.quizzesTaken = (stats.quizzesTaken || 0) + 1;
    if (correctAnswers === questionsCount) {
      stats.perfectQuizzes = (stats.perfectQuizzes || 0) + 1;
    }
  });

// ── Folders (stored in user profile doc as `folders` array) ─────────────

import { Folder } from '../types';

export const getUserFolders = async (userId: string): Promise<Folder[]> => {
  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return [];
  const raw: any[] = snap.data().folders ?? [];
  return raw.map(f => ({ ...f, createdAt: f.createdAt?.toDate?.() ?? new Date(f.createdAt) }));
};

export const saveFolders = async (userId: string, folders: Folder[]): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, {
    folders: folders.map(f => ({ ...f, createdAt: Timestamp.fromDate(f.createdAt) })),
  }, { merge: true });
};

// ── Daily Game Leaderboard ────────────────────────────────────────────────

export interface GameScore {
  userId: string;
  displayName: string;
  photoURL: string | null;
  score: number;
  wordsFound: number;
  foundPangram: boolean;
  timestamp: Date;
}

export const submitGameScore = async (
  dateKey: string,
  userId: string,
  displayName: string,
  photoURL: string | null,
  score: number,
  wordsFound: number,
  foundPangram: boolean,
): Promise<void> => {
  const docRef = doc(db, 'dailyGame', dateKey, 'scores', userId);
  const existing = await getDoc(docRef);

  // Only update if new score is higher
  if (existing.exists() && existing.data().score >= score) return;

  await setDoc(docRef, {
    userId,
    displayName,
    photoURL: photoURL ?? null,
    score,
    wordsFound,
    foundPangram,
    timestamp: Timestamp.now(),
  });
};

export const getGameLeaderboard = async (
  dateKey: string,
  topN = 20,
): Promise<GameScore[]> => {
  const scoresRef = collection(db, 'dailyGame', dateKey, 'scores');
  const q = query(scoresRef, orderBy('score', 'desc'), limit(topN));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      userId: data.userId,
      displayName: data.displayName,
      photoURL: data.photoURL,
      score: data.score,
      wordsFound: data.wordsFound,
      foundPangram: data.foundPangram,
      timestamp: data.timestamp.toDate(),
    };
  });
};

export const getMyGameScore = async (
  dateKey: string,
  userId: string,
): Promise<GameScore | null> => {
  const docRef = doc(db, 'dailyGame', dateKey, 'scores', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    userId: data.userId,
    displayName: data.displayName,
    photoURL: data.photoURL,
    score: data.score,
    wordsFound: data.wordsFound,
    foundPangram: data.foundPangram,
    timestamp: data.timestamp.toDate(),
  };
};

