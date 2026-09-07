// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlwZex4cZ9u8Wcrc8-uuugaARsHfRwEnE",
  authDomain: "defect---residensi-damai.web.app",
  projectId: "defect---residensi-damai",
  storageBucket: "defect---residensi-damai.appspot.com",
  messagingSenderId: "737848406419",
  appId: "1:737848406419:web:..." // Your real App ID from Firebase Console
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
