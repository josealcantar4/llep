// src/hooks/useRealTimeTables.js
// ─────────────────────────────────────────────────────────────────────────────
// Hook que se suscribe en tiempo real a la colección `tables` de Firestore.
// Actualiza el store de mesas automáticamente.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import useTableStore from '../store/useTableStore.js';

export default function useRealTimeTables() {
  const setTables = useTableStore((s) => s.setTables);

  useEffect(() => {
    const q = query(collection(db, 'tables'), orderBy('number', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const tables = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTables(tables);
    });
    return unsubscribe;
  }, [setTables]);
}
