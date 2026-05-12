// src/pages/TablesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard principal de mesas del restaurante.
// Muestra todas las mesas, su estado y acceso rápido al panel admin.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed, LogOut, LayoutDashboard, Plus,
  Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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

  // Monitorear conectividad
  React.useEffect(() => {
    const on  = () => { setOnline(true);  toast.success('Conexión restaurada'); };
    const off = () => { setOnline(false); toast('Sin conexión — modo offline', { icon: '📡' }); };
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

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
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent-dark))' }}>
            <UtensilsCrossed size={16} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>LLEP POS</span>
            <span className="hidden sm:inline text-xs ml-2" style={{ color: 'var(--text-secondary)' }}>
              — {user?.name ?? user?.email}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Indicador de conexión */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
               style={{
                 background: online ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                 color: online ? '#10b981' : '#ef4444',
                 border: `1px solid ${online ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
               }}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{online ? 'En línea' : 'Offline'}</span>
          </div>

          {/* Panel admin (solo admin) */}
          {role === 'admin' && (
            <button
              id="btn-admin-panel"
              onClick={() => navigate('/admin')}
              className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* Nueva mesa (solo admin) */}
          {role === 'admin' && (
            <button
              id="btn-add-table"
              onClick={() => setAddModalOpen(true)}
              className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Mesa</span>
            </button>
          )}

          {/* Logout */}
          <button
            id="btn-logout"
            onClick={handleLogout}
            className="btn-ghost text-xs flex items-center gap-1.5 px-3 py-2"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <main className="p-4 max-w-7xl mx-auto">
        {/* Estadísticas rápidas */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{openCount}</span> en servicio
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{closedCount}</span> disponibles
            </span>
          </div>
          <div className="ml-auto text-xs" style={{ color: 'var(--text-secondary)' }}>
            <RefreshCw size={11} className="inline mr-1" />
            Actualización en tiempo real
          </div>
        </div>

        {/* Grid de mesas */}
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <UtensilsCrossed size={48} color="var(--text-secondary)" />
            <p style={{ color: 'var(--text-secondary)' }}>No hay mesas configuradas.</p>
            {role === 'admin' && (
              <button onClick={() => setAddModalOpen(true)} className="btn-primary text-sm">
                + Agregar primera mesa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
        )}
      </main>

      {/* ── Modal: Agregar mesa ──────────────────────────────────────────── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Nueva Mesa"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre de la mesa
            </label>
            <input
              id="new-table-name"
              className="pos-input"
              placeholder="Ej: Mesa 7, Terraza, Barra..."
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAddModalOpen(false)} className="btn-ghost text-sm px-4">
              Cancelar
            </button>
            <button
              id="confirm-add-table"
              onClick={handleAddTable}
              disabled={adding}
              className="btn-primary text-sm px-4 flex items-center gap-2"
            >
              {adding ? <LoadingSpinner size="sm" /> : <Plus size={14} />}
              Crear mesa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
