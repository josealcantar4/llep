// src/store/useAuthStore.js
// ─────────────────────────────────────────────────────────────────────────────
// Store global de autenticación con Zustand.
// Mantiene: usuario actual, su rol, y estado de carga inicial.
// ─────────────────────────────────────────────────────────────────────────────
import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // Usuario completo (uid + datos de Firestore)
  user: null,
  // 'admin' | 'sales' | null
  role: null,
  // true mientras se verifica el estado de auth al inicio
  loading: true,

  setUser: (user) =>
    set({
      user,
      role: user?.role ?? null,
      loading: false,
    }),

  clearUser: () =>
    set({
      user: null,
      role: null,
      loading: false,
    }),

  setLoading: (loading) => set({ loading }),
}));

export default useAuthStore;
