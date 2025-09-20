import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyCFdbSFYfjh9UIvrfFJZr60U7OAZIUNU8I",
  authDomain: "goods-ab8b5.firebaseapp.com",
  projectId: "goods-ab8b5",
  storageBucket: "goods-ab8b5.firebasestorage.app",
  messagingSenderId: "1084647770453",
  appId: "1:1084647770453:web:53d5c957527728c6fd47dc",
  measurementId: "G-5SXG6Y87Y1"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };