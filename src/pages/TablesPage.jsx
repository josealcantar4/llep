// src/pages/TablesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard principal de mesas del restaurante.
// Diseño Premium Glassmorphism, espaciados estrictos y botones amplios.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, LogOut, LayoutDashboard, Plus,
  Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { logout } from '../firebase/auth.js';
import useAuthStore from '../store/useAuthStore.js';
import useTableStore from '../store/useTableStore.js';
import useRealTimeTables from '../hooks/useRealTimeTables.js';
import TableCard from '../components/pos/TableCard.jsx';
import Modal from '../components/ui/Modal.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

export default function TablesPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const { tables } = useTableStore();

  // Suscribirse a cambios en tiempo real
  useRealTimeTables();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [adding, setAdding] = useState(false);
  const [online, setOnline]   = useState(navigator.onLine);

  // Monitorear conectividad de forma más robusta
  React.useEffect(() => {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      setOnline(isOnline);
      if (isOnline) {
        toast.success('Conexión restaurada', { id: 'online-toast' });
      } else {
        toast('Sin conexión — modo offline', { id: 'offline-toast', icon: '📡' });
      }
    };

    window.addEventListener('online',  updateStatus);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('focus',   updateStatus); // Re-verificar al volver a la ventana

    // Verificación manual periódica por si los eventos del navegador fallan
    const interval = setInterval(() => {
      if (navigator.onLine !== online) {
        setOnline(navigator.onLine);
      }
    }, 5000);

    return () => { 
      window.removeEventListener('online',  updateStatus); 
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('focus',   updateStatus);
      clearInterval(interval);
    };
  }, [online]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /** Agregar una nueva mesa a Firestore */
  const handleAddTable = async () => {
    if (!newTableName.trim()) return toast.error('Ingresa un nombre para la mesa');
    setAdding(true);
    try {
      await addDoc(collection(db, 'tables'), {
        name:     newTableName.trim(),
        number:   tables.length + 1,
        status:   'closed',
        items:    [],
        openedAt: null,
        openedBy: null,
      });
      toast.success(`Mesa "${newTableName}" creada`);
      setNewTableName('');
      setAddModalOpen(false);
    } catch (e) {
      toast.error('No se pudo crear la mesa');
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const openCount   = tables.filter((t) => t.status === 'open').length;
  const closedCount = tables.filter((t) => t.status !== 'open').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 z-40 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-md shadow-sm"
              style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px' }}>
        
        {/* Logo y Usuario */}
        <div className="flex items-center" style={{ gap: '14px' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
               style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-dark))' }}>
            <UtensilsCrossed size={20} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[15px] tracking-wide" style={{ color: 'var(--text-primary)' }}>LLEP POS</span>
            <span className="text-[12px] font-medium opacity-80" style={{ color: 'var(--text-secondary)', marginTop: '-2px' }}>
              {user?.username ?? user?.displayName ?? user?.name ?? user?.email}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Indicador de conexión */}
          <div className="flex items-center rounded-2xl text-[12px] font-bold transition-all duration-500"
               style={{
                 gap: '8px',
                 paddingLeft: '14px', paddingRight: '14px', paddingTop: '8px', paddingBottom: '8px',
                 color: online ? '#10b981' : '#ef4444',
                 background: online ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                 border: `1px solid ${online ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
               }}>
            <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-[#10b981]' : 'bg-[#ef4444] animate-pulse shadow-[0_0_8px_#ef4444]'}`} />
            {online ? <Wifi size={14} strokeWidth={2.5} /> : <WifiOff size={14} strokeWidth={2.5} />}
            <span className="hidden sm:inline uppercase tracking-wider">{online ? 'En línea' : 'Offline'}</span>
          </div>

          {/* Panel admin (solo admin) */}
          {role === 'admin' && (
            <button
              id="btn-admin-panel"
              onClick={() => navigate('/admin')}
              className="flex items-center justify-center rounded-2xl font-bold transition-all hover:bg-white/5 border border-transparent hover:border-[var(--border)]"
              style={{ gap: '8px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', color: 'var(--text-primary)', fontSize: '13px' }}
            >
              <LayoutDashboard size={16} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Nueva mesa (solo admin) */}
          {role === 'admin' && (
            <button
              id="btn-add-table"
              onClick={() => setAddModalOpen(true)}
              className="btn-primary flex items-center justify-center rounded-2xl font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md"
              style={{ gap: '8px', paddingLeft: '20px', paddingRight: '20px', paddingTop: '10px', paddingBottom: '10px', fontSize: '13px' }}
            >
              <Plus size={16} strokeWidth={3} />
              <span className="hidden sm:inline">Mesa</span>
            </button>
          )}

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="flex items-center justify-center rounded-2xl font-bold transition-all hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            style={{ gap: '8px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px', color: '#ef4444', fontSize: '13px' }}
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ paddingLeft: '24px', paddingRight: '24px', paddingTop: '32px', paddingBottom: '32px' }}>
        <div className="max-w-7xl mx-auto">
          
          {/* Estadísticas rápidas */}
          <div className="flex items-center flex-wrap rounded-2xl border border-[var(--border)] shadow-sm bg-[var(--bg-elevated)]" 
               style={{ gap: '24px', paddingLeft: '24px', paddingRight: '24px', paddingTop: '16px', paddingBottom: '16px', marginBottom: '32px' }}>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-black text-[15px]" style={{ color: 'var(--text-primary)', marginRight: '4px' }}>{openCount}</span> 
                en servicio
              </span>
            </div>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-black text-[15px]" style={{ color: 'var(--text-primary)', marginRight: '4px' }}>{closedCount}</span> 
                disponibles
              </span>
            </div>
            <div className="ml-auto text-[12px] font-bold flex items-center" style={{ color: 'var(--text-secondary)', gap: '6px' }}>
              <RefreshCw size={14} />
              Actualización en tiempo real
            </div>
          </div>

          {/* Grid de mesas */}
          {tables.length === 0 ? (
            <div className="flex flex-col items-center justify-center opacity-60" style={{ paddingTop: '100px', paddingBottom: '100px', gap: '20px' }}>
              <UtensilsCrossed size={64} strokeWidth={1.5} color="var(--text-secondary)" />
              <p className="text-[16px] font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                No hay mesas configuradas actualmente.
              </p>
              {role === 'admin' && (
                <button 
                  onClick={() => setAddModalOpen(true)} 
                  className="btn-primary rounded-2xl font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 shadow-md mt-4"
                  style={{ paddingLeft: '28px', paddingRight: '28px', paddingTop: '14px', paddingBottom: '14px', fontSize: '13px' }}
                >
                  <Plus size={16} className="inline mr-2" strokeWidth={3} />
                  Agregar primera mesa
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" style={{ gap: '20px' }}>
              {tables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── Modal: Agregar mesa ──────────────────────────────────────────── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={<span style={{ marginLeft: '10px' }}>Nueva Mesa</span>}
        maxWidth="max-w-md"
        showClose={false}
      >
        <div className="flex flex-col h-full" style={{ paddingTop: '10px' }}>
          
          {/* --- INPUT: NOMBRE DE LA MESA --- */}
          <div style={{ marginLeft: '10px', marginRight: '10px', marginBottom: '32px' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)', paddingLeft: '5px' }}>
              Nombre de la mesa *
            </label>
            <input
              id="new-table-name"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all shadow-sm text-[15px]"
              style={{ color: 'var(--text-primary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
              placeholder="Ej: Mesa 7, Terraza, VIP..."
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
              autoFocus
            />
          </div>

          {/* --- BOTONES DE ACCIÓN --- */}
          <div className="flex gap-3" style={{ marginLeft: '10px', marginRight: '10px', marginBottom: '10px' }}>
            <button 
              onClick={() => setAddModalOpen(false)} 
              className="flex-1 font-bold uppercase tracking-widest rounded-2xl border border-[var(--border)] transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '16px', paddingBottom: '16px' }}
            >
              Cancelar
            </button>
            <button
              id="confirm-add-table"
              onClick={handleAddTable}
              disabled={adding}
              className="btn-primary flex-[1.5] flex items-center justify-center gap-2 font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ fontSize: '14px', paddingTop: '16px', paddingBottom: '16px', opacity: adding ? 0.7 : 1 }}
            >
              {adding ? <LoadingSpinner size="sm" /> : <Plus size={18} strokeWidth={3} />}
              Crear mesa
            </button>
          </div>

        </div>
      </Modal>
    </div>
  );
}