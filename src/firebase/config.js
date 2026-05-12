// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// Inicialización de Firebase con soporte offline-first usando persistentLocalCache.
// Las credenciales se cargan desde variables de entorno (.env).
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase App
const app = initializeApp(firebaseConfig);

// Inicializar Firestore con caché persistente (offline-first)
// persistentMultipleTabManager permite usar la app en múltiples pestañas
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Inicializar Firebase Auth
export const auth = getAuth(app);

export default app;
