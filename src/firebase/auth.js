// src/firebase/auth.js
// ─────────────────────────────────────────────────────────────────────────────
// Helpers de autenticación: login con email/password y logout.
// ─────────────────────────────────────────────────────────────────────────────
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Login con email y password.
 * Retorna el usuario de Firebase Auth.
 */
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

/**
 * Cerrar sesión.
 */
export const logout = () => signOut(auth);

/**
 * Obtener datos del perfil del usuario (incluye el rol) desde Firestore.
 * @param {string} uid - UID del usuario autenticado
 * @returns {Promise<Object|null>} - Datos del usuario o null
 */
export const getUserProfile = async (uid) => {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { uid, ...snap.data() } : null;
};

/**
 * Suscribirse a cambios en el estado de autenticación.
 * @param {Function} callback - Llamada con el usuario o null
 * @returns {Function} - Función para cancelar la suscripción
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
