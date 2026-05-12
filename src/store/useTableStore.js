// src/store/useTableStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Store global de mesas con Zustand.
// Mantiene la lista de mesas en tiempo real y la mesa actualmente seleccionada.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

const useTableStore = create((set) => ({
  // Array de mesas del restaurante (sincronizadas con Firestore)
  tables: [],
  // ID de la mesa seleccionada actualmente para toma de orden
  activeTableId: null,

  setTables: (tables) => set({ tables }),

  setActiveTable: (tableId) => set({ activeTableId: tableId }),

  clearActiveTable: () => set({ activeTableId: null }),

  /**
   * Actualiza los ítems de una mesa específica en el store local
   * (antes de sincronizar con Firestore).
   */
  updateTableItems: (tableId, items) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, items } : t
      ),
    })),
}));

export default useTableStore;
