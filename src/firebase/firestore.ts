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

// Обновить статистику после завершения flashcard сессии
export const updateFlashcardStats = async (
  userId: string,
  cardsCount: number,
  duration: number
) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return;
  
  const profile = docSnap.data();
  const today = new Date().toISOString().split('T')[0];
  
  // Обновляем studyHistory
  const studyHistory = profile.studyHistory || [];
  const todayIndex = studyHistory.findIndex((d: any) => d.date === today);
  
  if (todayIndex >= 0) {
    studyHistory[todayIndex].sessions += 1;
    studyHistory[todayIndex].cardsStudied += cardsCount;
    studyHistory[todayIndex].timeSpent += duration;
  } else {
    studyHistory.push({
      date: today,
      sessions: 1,
      cardsStudied: cardsCount,
      timeSpent: duration
    });
  }
  
  // Обновляем стрик
  const lastStudyDate = profile.lastStudyDate?.toDate?.();
  let currentStreak = profile.currentStreak || 0;
  let longestStreak = profile.longestStreak || 0;
  
  if (lastStudyDate) {
    const lastDate = new Date(lastStudyDate);
    const todayDate = new Date();
    lastDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Сегодня уже занимались - стрик не меняется
    } else if (diffDays === 1) {
      // Вчера занимались - увеличиваем стрик
      currentStreak += 1;
    } else {
      // Пропустили дни - стрик сбрасывается
      currentStreak = 1;
    }
  } else {
    // Первая сессия
    currentStreak = 1;
  }
  
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  // Обновляем stats
  const stats = profile.stats || {};
  stats.flashcardSessions = (stats.flashcardSessions || 0) + 1;
  stats.totalStudyTime = (stats.totalStudyTime || 0) + duration;
  
  await updateUserProfile(userId, {
    studyHistory,
    currentStreak,
    longestStreak,
    lastStudyDate: Timestamp.now(),
    stats
  });
};

// Обновить статистику после завершения quiz
export const updateQuizStats = async (
  userId: string,
  questionsCount: number,
  correctAnswers: number,
  duration: number
) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return;
  
  const profile = docSnap.data();
  const today = new Date().toISOString().split('T')[0];
  const isPerfect = correctAnswers === questionsCount;
  
  // Обновляем studyHistory
  const studyHistory = profile.studyHistory || [];
  const todayIndex = studyHistory.findIndex((d: any) => d.date === today);
  
  if (todayIndex >= 0) {
    studyHistory[todayIndex].sessions += 1;
    studyHistory[todayIndex].cardsStudied += questionsCount;
    studyHistory[todayIndex].timeSpent += duration;
  } else {
    studyHistory.push({
      date: today,
      sessions: 1,
      cardsStudied: questionsCount,
      timeSpent: duration
    });
  }
  
  // Обновляем стрик (аналогично flashcards)
  const lastStudyDate = profile.lastStudyDate?.toDate?.();
  let currentStreak = profile.currentStreak || 0;
  let longestStreak = profile.longestStreak || 0;
  
  if (lastStudyDate) {
    const lastDate = new Date(lastStudyDate);
    const todayDate = new Date();
    lastDate.setHours(0, 0, 0, 0);
    todayDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Сегодня уже занимались
    } else if (diffDays === 1) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 1;
  }
  
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }
  
  // Обновляем stats
  const stats = profile.stats || {};
  stats.quizzesTaken = (stats.quizzesTaken || 0) + 1;
  stats.totalStudyTime = (stats.totalStudyTime || 0) + duration;
  if (isPerfect) {
    stats.perfectQuizzes = (stats.perfectQuizzes || 0) + 1;
  }
  
  await updateUserProfile(userId, {
    studyHistory,
    currentStreak,
    longestStreak,
    lastStudyDate: Timestamp.now(),
    stats
  });
};

// Проверить и разблокировать достижения
export const checkAndUnlockAchievements = async (
  userId: string,
  totalCards: number
) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return [];
  
  const profile = docSnap.data();
  const unlockedIds = profile.achievements || [];
  const newAchievements: string[] = [];
  
  // Проверяем достижения
  const checks = [
    { id: 'first_collection', condition: totalCards > 0 },
    { id: 'first_study', condition: (profile.stats?.flashcardSessions || 0) > 0 || (profile.stats?.quizzesTaken || 0) > 0 },
    { id: 'streak_3', condition: (profile.currentStreak || 0) >= 3 },
    { id: 'streak_7', condition: (profile.currentStreak || 0) >= 7 },
    { id: 'streak_30', condition: (profile.currentStreak || 0) >= 30 },
    { id: 'cards_50', condition: totalCards >= 50 },
    { id: 'cards_100', condition: totalCards >= 100 },
    { id: 'cards_500', condition: totalCards >= 500 },
    { id: 'quiz_10', condition: (profile.stats?.quizzesTaken || 0) >= 10 },
    { id: 'quiz_50', condition: (profile.stats?.quizzesTaken || 0) >= 50 },
    { id: 'flashcards_10', condition: (profile.stats?.flashcardSessions || 0) >= 10 },
    { id: 'flashcards_50', condition: (profile.stats?.flashcardSessions || 0) >= 50 },
    { id: 'perfect_quiz', condition: (profile.stats?.perfectQuizzes || 0) > 0 }
  ];
  
  for (const check of checks) {
    if (check.condition && !unlockedIds.includes(check.id)) {
      newAchievements.push(check.id);
    }
  }
  
  if (newAchievements.length > 0) {
    await updateUserProfile(userId, {
      achievements: [...unlockedIds, ...newAchievements]
    });
  }
  
  return newAchievements;
};
