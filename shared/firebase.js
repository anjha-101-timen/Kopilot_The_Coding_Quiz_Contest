import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBTXNdFPIkgRAMSN8FYvSgaiyQ0ylz-6Ko",
  authDomain: "coding-quiz-contest-platform.firebaseapp.com",
  projectId: "coding-quiz-contest-platform",
  storageBucket: "coding-quiz-contest-platform.firebasestorage.app",
  messagingSenderId: "823102752389",
  appId: "1:823102752389:web:4e3db47f8b6234ae1c8bec",
  measurementId: "G-3YHZX8QDB9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const api = {
  collection,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
};

export const COL = {
  QUESTIONS: "questions",
  EXAMS: "exams",
  ATTEMPTS: "attempts",
  SESSIONS: "sessions",
  ANALYTICS: "analytics",
  PROFILES: "profiles",
  BOOKMARKS: "bookmarks",
  NOTIFICATIONS: "notifications",
  ANNOUNCEMENTS: "announcements"
};
