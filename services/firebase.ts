import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION FROM THE FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyD7pFqrAwbzlS3erOymclw6w1w45SV8xCQ",
  authDomain: "ielts-ai-master.firebaseapp.com",
  projectId: "ielts-ai-master",
  storageBucket: "ielts-ai-master.firebasestorage.app",
  messagingSenderId: "741421190464",
  appId: "1:741421190464:web:d3544c49f4a10051bdfea5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);