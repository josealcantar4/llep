// src/pages/admin/AdminLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout del panel de administración con sidebar de navegación.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MinusCircle,
  Scissors, Home, LogOut, Menu as MenuIcon, X,
} from 'lucide-react';
import { logout } from '../../firebase/auth.js';
import useAuthStore from '../../store/useAuthStore.js';

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',   Icon: BarChart3,      end: true },
  { to: '/admin/menu',     label: 'Menú',        Icon: UtensilsCrossed },
  { to: '/admin/expenses', label: 'Egresos',     Icon: MinusCircle },
  { to: '/admin/shift',    label: 'Corte de Caja', Icon: Scissors },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-dark))' }}>
            <UtensilsCrossed size={16} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>LLEP POS</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Administración</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => { navigate('/'); setSidebarOpen(false); }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Home size={17} /> Ir al POS
        </button>
        <button
          id="admin-logout"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={17} /> Cerrar sesión
        </button>
        <p className="text-xs px-4 pt-2" style={{ color: 'var(--text-secondary)' }}>
          {user?.name ?? user?.email}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Sidebar escritorio ───────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
      >
        <SidebarContent />
      </aside>

      {/* ── Sidebar móvil (overlay) ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside
            className="relative w-60 flex flex-col"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5"
            >
              <X size={18} color="var(--text-secondary)" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar móvil */}
        <div
          className="lg:hidden flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-white/5">
            <MenuIcon size={18} color="var(--text-secondary)" />
          </button>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Administración
          </span>
        </div>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
