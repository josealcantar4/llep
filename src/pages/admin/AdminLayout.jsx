// src/pages/admin/AdminLayout.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Layout del panel de administración (Espaciado Optimo para Touch y Mouse)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MinusCircle,
  Scissors, Home, LogOut, Menu as MenuIcon, X, UserPlus, ChevronRight
} from 'lucide-react';
import { logout } from '../../firebase/auth.js';
import useAuthStore from '../../store/useAuthStore.js';

const NAV_ITEMS = [
  { to: '/admin',          label: 'Dashboard',     Icon: BarChart3,      end: true },
  { to: '/admin/menu',     label: 'Menú',          Icon: UtensilsCrossed },
  { to: '/admin/users',    label: 'Usuarios',      Icon: UserPlus },
  { to: '/admin/expenses', label: 'Egresos',       Icon: MinusCircle },
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

  // Áreas de clic masivas: py-5 (arriba/abajo) y mb-4 (separación entre ellos)
  const navLinkClass = ({ isActive }) =>
    `group flex items-center justify-between px-6 py-5 mb-4 rounded-2xl text-base font-bold transition-all duration-300 ease-out cursor-pointer ${
      isActive
        ? 'bg-amber-500/15 text-amber-400 shadow-[inset_0px_0px_0px_1px_rgba(245,158,11,0.3)]'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ paddingTop: '10%', paddingLeft: '3%', paddingRight: '3%' }}>
      {/* ── Logo y Cabecera (Más alta y espaciosa) ───────────────────── */}
      <div className="p-10 border-b transition-all" style={{ borderColor: 'var(--border)', paddingBottom: '5%', paddingLeft: '3%' }}>
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20"
               style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
            <UtensilsCrossed size={28} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-black text-2xl tracking-wide" style={{ color: 'var(--text-primary)' }}>LLEP POS</p>
            <p className="text-base font-medium opacity-60" style={{ color: 'var(--text-secondary)' }}>Admin Panel</p>
          </div>
        </div>
      </div>

      {/* ── Navegación Principal (Más espacio alrededor) ──────────────── */}
      <nav className="flex-1 p-8 overflow-y-auto overflow-x-hidden custom-scrollbar" style={{paddingTop: '3%'}}>
        <p className="text-sm font-bold uppercase tracking-wider mb-8 px-2" style={{ color: 'var(--text-secondary)' }}>
          Menú Principal
        </p>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={navLinkClass}
            onClick={() => setSidebarOpen(false)}
            style={{marginBottom: '1%'}}
          >
            {({ isActive }) => (
              <>
                {/* 1. La animación de deslizamiento ahora está AQUÍ ADENTRO */}
                <div style={{marginLeft: '3%', padding: '3%'}} className={`flex items-center gap-5 transition-transform duration-300 ${isActive ? '' : 'group-hover:translate-x-2'}`}>
                  <Icon size={24} className={isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400 transition-colors'} />
                  {label}
                </div>
                
                {/* 2. Añadido un mr-2 por seguridad para que nunca toque el límite del contenedor */}
                <ChevronRight 
                  size={20} 
                  className={`transition-all duration-300 mr-2 ${isActive ? 'opacity-100 translate-x-0 text-amber-400' : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`} 
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer del Sidebar (Separación de botones ampliada) ───────── */}
      <div 
        className="border-t bg-black/10 flex flex-col" 
        style={{ 
          borderColor: 'var(--border)', 
          paddingTop: '5%', 
          paddingBottom: '5%', 
          paddingLeft: '3%', 
          paddingRight: '3%' 
        }}
      >
        {/* Perfil del Usuario */}
        <div className="flex items-center gap-4" style={{ marginBottom: '5%', paddingLeft: '3%' }}>
          <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg shadow-md">
            {(user?.username?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-base font-bold truncate text-white">
              {user?.username ?? user?.displayName ?? 'Administrador'}
            </p>
            <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {user?.email ?? 'Sesión iniciada'}
            </p>
          </div>
        </div>

        {/* Botones de acción del footer (Misma estructura que tu menú) */}
        <button
          onClick={() => { navigate('/'); setSidebarOpen(false); }}
          className="group w-full rounded-2xl text-base font-bold text-slate-300 bg-white/5 border border-white/5 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all"
          style={{ marginBottom: '3%' }}
        >
          <div style={{ marginLeft: '3%', padding: '5%' }} className="flex items-center gap-4">
            <Home size={22} className="group-hover:scale-110 transition-transform duration-300" /> 
            Ir al Sistema POS
          </div>
        </button>

        <button
          id="admin-logout"
          onClick={handleLogout}
          className="group w-full rounded-2xl text-base font-bold text-red-400 bg-red-500/5 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300"
        >
          <div style={{ marginLeft: '3%', padding: '5%' }} className="flex items-center gap-4">
            <LogOut size={22} className="group-hover:-translate-x-2 transition-transform duration-300" /> 
            Cerrar sesión
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden font-sans">
      {/* ── Sidebar Escritorio (Más ancha para soportar el padding) ────── */}
      <aside className="hidden lg:flex flex-col w-80 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] z-20 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* ── Sidebar Móvil ──────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
          <aside className="relative w-[85vw] max-w-sm flex flex-col bg-[var(--bg-secondary)] h-full shadow-2xl animate-in slide-in-from-left-4 duration-300">
            {/* Botón de cerrar masivo */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-8 right-6 flex items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors backdrop-blur-sm z-50"
              style={{ minHeight: '56px', minWidth: '56px' }}
            >
              <X size={28} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Contenido Principal ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Top bar móvil (Más alta, botón hamburguesa gigante) */}
        <div className="lg:hidden flex-shrink-0 flex items-center gap-5 px-8 py-5 bg-[var(--bg-secondary)]/90 backdrop-blur-lg border-b border-[var(--border)] sticky top-0 z-10 shadow-sm">
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="flex items-center justify-center p-3 -ml-3 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
            style={{ minHeight: '56px', minWidth: '56px' }}
          >
            <MenuIcon size={28} color="var(--text-primary)" />
          </button>
          <span className="font-black text-2xl tracking-tight text-[var(--text-primary)]">
            Panel <span className="text-amber-500">Admin</span>
          </span>
        </div>

        {/* Main area: Aumenté a p-8 en móvil y p-12 en PC para un margen gigante */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12 relative custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}