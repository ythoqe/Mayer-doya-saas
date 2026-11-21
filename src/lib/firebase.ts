import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import appletConfig from '../../firebase-applet-config.json';

interface ResolvedFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

const env = import.meta.env;

const resolveFirebaseConfig = (): ResolvedFirebaseConfig => {
  const config: ResolvedFirebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
    appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId || '',
    firestoreDatabaseId:
      env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId || undefined,
  };

  const requiredEnvMap: Array<[keyof ResolvedFirebaseConfig, string]> = [
    ['apiKey', 'VITE_FIREBASE_API_KEY'],
    ['authDomain', 'VITE_FIREBASE_AUTH_DOMAIN'],
    ['projectId', 'VITE_FIREBASE_PROJECT_ID'],
    ['storageBucket', 'VITE_FIREBASE_STORAGE_BUCKET'],
    ['messagingSenderId', 'VITE_FIREBASE_MESSAGING_SENDER_ID'],
    ['appId', 'VITE_FIREBASE_APP_ID'],
  ];

  const missingVars = requiredEnvMap
    .filter(([key]) => !config[key] || String(config[key]).trim() === '')
    .map(([, envName]) => envName);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase configuration environment variables: ${missingVars.join(', ')}. ` +
        'Please copy .env.example to .env and provide your Firebase project credentials.'
    );
  }

  return config;
};

export const firebaseConfig = resolveFirebaseConfig();

export const app: FirebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth: Auth = getAuth(app);

export const KNOWN_DATABASES: string[] = Array.from(
  new Set(
    [firebaseConfig.firestoreDatabaseId, '(default)'].filter(
      (id): id is string => Boolean(id)
    )
  )
);

export const getSavedDatabaseId = (): string => {
  if (firebaseConfig.firestoreDatabaseId) {
    return firebaseConfig.firestoreDatabaseId;
  }
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mayer_doya_firebase_db_id');
    if (saved) {
      return saved;
    }
  }
  return '(default)';
};

export const createFirestoreInstance = (
  databaseId: string = getSavedDatabaseId()
): Firestore => {
  if (!databaseId || databaseId === '(default)') {
    return getFirestore(app);
  }
  return getFirestore(app, databaseId);
};

export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const storage: FirebaseStorage = getStorage(app);

/**
 * Structured Firestore error types & handler for diagnosing security rule and permission failures.
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Recursively sanitizes data objects before writing to Firestore.
 * Strips keys with `undefined` values and converts `undefined` array items to `null`.
 */
export const cleanFirestoreData = <T,>(data: T): T => {
  if (data === null || data === undefined) {
    return (data === undefined ? null : data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) =>
      item === undefined ? null : cleanFirestoreData(item)
    ) as unknown as T;
  }
  if (typeof data === 'object') {
    const proto = Object.getPrototypeOf(data);
    if (proto !== null && proto !== Object.prototype) {
      return data;
    }
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }
  return data;
};

/**
 * Startup connectivity check against Firestore server.
 */
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export const testFirestoreConnection = async (timeoutMs: number = 2000): Promise<boolean> => {
  try {
    const probeDoc = doc(db, 'test', 'connection');
    let timer: ReturnType<typeof setTimeout> | undefined;

    const probePromise = getDocFromServer(probeDoc)
      .then(() => true)
      .catch((error: unknown) => {
        // Permission denied still confirms the Firestore backend is reachable and online
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.toLowerCase().includes('permission')) {
          return true;
        }
        return false;
      });

    const timeoutPromise = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), timeoutMs);
    });

    const isConnected = await Promise.race([probePromise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return isConnected;
  } catch {
    return false;
  }
};

export default app;
