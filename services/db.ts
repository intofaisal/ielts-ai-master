import { 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    orderBy,
    doc,
    setDoc
  } from "firebase/firestore";
  import { db } from "./firebase";
  import { WritingTopic, ReadingTest, Flashcard, User } from "../types";
  
  // --- REAL-TIME LISTENERS (Subscribers) ---
  
  export const subscribeToWritingTopics = (callback: (topics: WritingTopic[]) => void) => {
    const q = query(collection(db, "writing_topics"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WritingTopic));
      callback(topics);
    });
  };
  
  export const subscribeToReadingTests = (callback: (tests: ReadingTest[]) => void) => {
    // Ordering by a timestamp would be better, but we'll default to natural order for now
    const q = query(collection(db, "reading_tests"));
    return onSnapshot(q, (snapshot) => {
      const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingTest));
      callback(tests);
    });
  };
  
  export const subscribeToFlashcards = (userId: string, callback: (cards: Flashcard[]) => void) => {
    const q = query(
      collection(db, "flashcards"), 
      where("userId", "==", userId) // Only fetch user's own cards
    );
    return onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
      callback(cards);
    });
  };
  
  // --- WRITE OPERATIONS ---
  
  export const addWritingTopic = async (topic: WritingTopic) => {
    // We remove ID because Firestore generates it, or we use setDoc if we want to force an ID
    const { id, ...data } = topic; 
    await addDoc(collection(db, "writing_topics"), data);
  };
  
  export const addReadingTest = async (test: ReadingTest) => {
    const { id, ...data } = test;
    await addDoc(collection(db, "reading_tests"), data);
  };
  
  export const addFlashcard = async (card: Flashcard, userId: string) => {
    const { id, ...data } = card;
    // Add userId so we can filter later
    await addDoc(collection(db, "flashcards"), { ...data, userId });
  };
  
  export const saveWritingSubmission = async (submission: any, userId: string) => {
    await addDoc(collection(db, "student_results"), {
      ...submission,
      userId,
      type: 'writing'
    });
  };