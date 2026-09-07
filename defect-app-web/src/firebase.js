// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlvZzs4cZ9uBVcrcB-uuugaARsHTRwEnE",
  authDomain: "defect---residensi-damai.firebaseapp.com",
  projectId: "defect---residensi-damai",
  storageBucket: "defect---residensi-damai.firebasestorage.app",
  messagingSenderId: "737848406419",
  appId: "1:737848406419:web:0192a9d53b3a928dfe7866",
  measurementId: "G-CSNLC9XP1Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Authentication & Firestore Database
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

