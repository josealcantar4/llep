// src/firebase/users.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './config';

// Usamos la misma configuración
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// TRUCO: Inicializamos una app secundaria para crear usuarios 
// sin desconectar a nuestro Administrador de la sesión principal.
const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
const secondaryAuth = getAuth(secondaryApp);

/**
 * Crea un empleado nuevo (Auth + Firestore).
 * Solo el Administrador debería invocar esto.
 */
export const createEmployee = async (username, email, password, role, displayName = '') => {
  try {
    // Si no hay email y es de ventas, usamos el dummy. Si es admin, el email debe venir.
    const finalEmail = email ? email : `${username}@llep.pos`;

    // 1. Crear el usuario en Auth (usando la app secundaria)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, finalEmail, password);
    const newUid = userCredential.user.uid;

    // 2. Crear el documento en la colección 'users' (usando la DB principal)
    await setDoc(doc(db, 'users', newUid), {
      username,
      email: finalEmail, // Guardamos el email usado en Auth
      role, // 'admin' o 'sales'
      displayName,
      createdAt: new Date().toISOString(),
      active: true
    });

    // 3. Cerrar la sesión secundaria
    await signOut(secondaryAuth);

    return { success: true, uid: newUid };
  } catch (error) {
    console.error("Error creating employee:", error);
    throw error;
  }
};

/**
 * Actualiza los datos de un empleado en Firestore.
 */
export const updateEmployee = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

/**
 * Envía un correo de restablecimiento de contraseña.
 * Nota: Solo funciona si el correo es real.
 */
import { sendPasswordResetEmail } from 'firebase/auth';
export const resetEmployeePassword = async (email) => {
  // Usamos el auth principal para enviar correos
  const mainAuth = getAuth();
  await sendPasswordResetEmail(mainAuth, email);
};
