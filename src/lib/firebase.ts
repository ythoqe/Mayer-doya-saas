import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyMockDemoMayerDoyaAppletKey2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mayer-doya-erp.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mayer-doya-erp",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mayer-doya-erp.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "383839911118",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:383839911118:web:8jPKMayerDoyaDaing2026"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
