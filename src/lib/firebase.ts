import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyANnSIWiJOFMpx-P9xseIS8mkDkzTjvZa0",
  authDomain: "gen-lang-client-0196493200.firebaseapp.com",
  projectId: "gen-lang-client-0196493200",
  storageBucket: "gen-lang-client-0196493200.firebasestorage.app",
  messagingSenderId: "399807437677",
  appId: "1:399807437677:web:9c4f7e900b7ebda4b81864"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Database IDs found in project
export const KNOWN_DATABASES = [
  'ai-studio-28a58811-454c-4ade-adca-10f453bdea4b',
  'ai-studio-bf3c4e94-3fcc-4e62-bbff-e573694a3643',
  'ai-studio-criticalthinking-4485b563-92f9-47dd-9786-8d7ea5d082c9'
];

export const getSavedDatabaseId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mayer_doya_firebase_db_id');
    if (saved) return saved;
  }
  return 'ai-studio-28a58811-454c-4ade-adca-10f453bdea4b';
};

export const createFirestoreInstance = (databaseId: string = getSavedDatabaseId()): Firestore => {
  return getFirestore(app, databaseId);
};

export const db = createFirestoreInstance();
export const auth = getAuth(app);

export default app;

