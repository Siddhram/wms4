import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
   apiKey: "AIzaSyBAPaaMmYknumBIAnH37FHvzi2jB3lM1YU",
  authDomain: "todoapp-c9ac2.firebaseapp.com",
  projectId: "todoapp-c9ac2",
  storageBucket: "todoapp-c9ac2.firebasestorage.app",
  messagingSenderId: "378909307345",
  appId: "1:378909307345:web:0b382724153a1dc91ef0f0",
  measurementId: "G-9V29FKEXNY"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };