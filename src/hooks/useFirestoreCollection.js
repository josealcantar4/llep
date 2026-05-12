// src/hooks/useFirestoreCollection.js
// ─────────────────────────────────────────────────────────────────────────────
// Hook genérico para leer colecciones de Firestore en tiempo real.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.js';

/**
 * @param {string}  collectionName - Nombre de la colección en Firestore
 * @param {Array}   constraints    - Constraints adicionales de Firestore (where, orderBy, etc.)
 * @returns {{ data: Array, loading: boolean, error: Error|null }}
 */
export default function useFirestoreCollection(collectionName, constraints = []) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(`Firestore error [${collectionName}]:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [collectionName]);

  return { data, loading, error };
}
