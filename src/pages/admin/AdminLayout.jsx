// src/pages/admin/AdminLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout del panel de administración con sidebar de navegación.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MinusCircle,
  Scissors, Home, LogOut, Menu as MenuIcon, X, UserPlus,
} from 'lucide-react';
import { logout } from '../../firebase/auth.js';
import useAuthStore from '../../store/useAuthStore.js';

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',   Icon: BarChart3,      end: true },
  { to: '/admin/menu',     label: 'Menú',        Icon: UtensilsCrossed },
  { to: '/admin/users',    label: 'Usuarios',    Icon: UserPlus },
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
          {user?.displayName ?? user?.name ?? user?.email}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* ── Sidebar escritorio ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] z-20">
        <SidebarContent />
      </aside>

      {/* ── Sidebar móvil (overlay) ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-[var(--bg-secondary)] h-full shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Contenido principal ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar móvil */}
        <div className="lg:hidden flex-shrink-0 flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="flex items-center justify-center p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ minHeight: '48px', minWidth: '48px' }}
          >
            <MenuIcon size={24} color="var(--text-primary)" />
          </button>
          <span className="font-bold text-lg text-[var(--text-primary)]">
            Administración
          </span>
        </div>

        {/* Main area with overflow-y-auto */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
