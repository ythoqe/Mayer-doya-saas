import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, setLogLevel, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Silence Firestore internal network connection error logs when operating in offline or local mode
setLogLevel('silent');

export const firebaseConfig = {
  apiKey: "AIzaSyANnSIWiJOFMpx-P9xseIS8mkDkzTjvZa0",
  authDomain: "gen-lang-client-0196493200.firebaseapp.com",
  projectId: "gen-lang-client-0196493200",
  storageBucket: "gen-lang-client-0196493200.firebasestorage.app",
  messagingSenderId: "399807437677",
  appId: "1:399807437677:web:9c4f7e900b7ebda4b81864"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Known Firestore Database IDs
export const KNOWN_DATABASES = [
  '(default)'
];

export const getSavedDatabaseId = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mayer_doya_firebase_db_id');
    // Clear legacy invalid mock database IDs
    if (saved && !saved.startsWith('ai-studio-28a58811') && !saved.startsWith('ai-studio-bf3c4e94') && !saved.startsWith('ai-studio-criticalthinking')) {
      return saved;
    }
  }
  return '(default)';
};

export const createFirestoreInstance = (databaseId: string = getSavedDatabaseId()): Firestore => {
  if (!databaseId || databaseId === '(default)') {
    return getFirestore(app);
  }
  return getFirestore(app, databaseId);
};

export const db = createFirestoreInstance();
export const auth = getAuth(app);

/**
 * Recursively sanitizes data objects before writing to Firestore.
 * Firestore strictly rejects objects containing `undefined` values.
 * This function strips object keys with `undefined` values and converts `undefined` array elements to `null`.
 */
export const cleanFirestoreData = <T,>(data: T): T => {
  if (data === null || data === undefined) {
    return (data === undefined ? null : data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => (item === undefined ? null : cleanFirestoreData(item))) as unknown as T;
  }
  if (typeof data === 'object') {
    // Preserve special non-plain objects like Date, Timestamp, FieldValue, etc.
    const proto = Object.getPrototypeOf(data);
    if (proto !== null && proto !== Object.prototype) {
      return data;
    }
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return data;
};

// Function to test if Firestore backend is actually provisioned and reachable
export const testFirestoreConnection = async (timeoutMs: number = 2000): Promise<boolean> => {
  try {
    const probeDoc = doc(db, '__probe', 'ping');
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Attach catch directly to the probe promise so it never triggers an unhandled promise rejection
    const probePromise = getDocFromServer(probeDoc)
      .then(() => true)
      .catch((_err) => {
        // Silently swallow abort/network/permission errors on the probe document
        return false;
      });

    const timeoutPromise = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });

    const isConnected = await Promise.race([probePromise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return isConnected;
  } catch (_err) {
    return false;
  }
};

export default app;

