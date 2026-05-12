// src/App.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Router principal de la aplicación.
// Define rutas públicas (Login) y protegidas (según rol).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore.js';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';

// Páginas
import LoginPage       from './pages/LoginPage.jsx';
import TablesPage      from './pages/TablesPage.jsx';
import OrderPage       from './pages/OrderPage.jsx';
import CheckoutPage    from './pages/CheckoutPage.jsx';
import AdminLayout     from './pages/admin/AdminLayout.jsx';
import DashboardPage   from './pages/admin/DashboardPage.jsx';
import MenuAdminPage   from './pages/admin/MenuAdminPage.jsx';
import ExpensesPage    from './pages/admin/ExpensesPage.jsx';
import ShiftClosePage  from './pages/admin/ShiftClosePage.jsx';

/* ── Guarda de autenticación ─────────────────────────────────────────────── */
function AuthGuard({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

/* ── Guarda exclusiva para Administrador ─────────────────────────────────── */
function AdminGuard({ children }) {
  const { user, loading, role } = useAuthStore();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Pública ─────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />

        {/* ── Protegidas (cualquier rol autenticado) ───────────── */}
        <Route path="/" element={<AuthGuard><TablesPage /></AuthGuard>} />
        <Route path="/order/:tableId" element={<AuthGuard><OrderPage /></AuthGuard>} />
        <Route path="/checkout/:tableId" element={<AuthGuard><CheckoutPage /></AuthGuard>} />

        {/* ── Admin ────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<DashboardPage />} />
          <Route path="menu"    element={<MenuAdminPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="shift"   element={<ShiftClosePage />} />
        </Route>

        {/* ── Fallback ─────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
