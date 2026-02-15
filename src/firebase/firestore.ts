import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';
import { Collection, Card } from '../types';

// Преобразование Collection в формат Firestore
const collectionToFirestore = (coll: Collection) => {
  return {
    ...coll,
    createdAt: Timestamp.fromDate(coll.createdAt),
    lastStudied: coll.lastStudied ? Timestamp.fromDate(coll.lastStudied) : null,
    cards: coll.cards.map(card => ({
      ...card,
      createdAt: Timestamp.fromDate(card.createdAt),
      srsData: {
        ...card.srsData,
        nextReview: Timestamp.fromDate(card.srsData.nextReview),
        lastReviewed: card.srsData.lastReviewed
          ? Timestamp.fromDate(card.srsData.lastReviewed)
          : null
      }
    }))
  };
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
    totalStudySessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    achievements: [],
    stats: {
      totalCards: 0,
      cardsLearned: 0,
      quizzesTaken: 0,
      flashcardSessions: 0
    }
  };
  
  await setDoc(docRef, newProfile);
  return newProfile;
};

// Обновить профиль пользователя
export const updateUserProfile = async (userId: string, data: any) => {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, data, { merge: true });
};
