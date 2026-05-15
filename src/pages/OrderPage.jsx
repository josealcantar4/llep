// src/pages/OrderPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Pantalla de toma de orden. Layout de dos columnas con diseño Premium POS.
//   izquierda → menú + búsqueda
//   derecha   → carrito de la mesa activa
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ReceiptText, Menu as MenuIcon, Trash2 } from 'lucide-react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../firebase/config.js';
import useAuthStore from '../store/useAuthStore.js';
import MenuGrid from '../components/pos/MenuGrid.jsx';
import CartPanel from '../components/pos/CartPanel.jsx';
import ModifierModal from '../components/pos/ModifierModal.jsx';
import FreeItemModal from '../components/pos/FreeItemModal.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

export default function OrderPage() {
  const { tableId } = useParams();
  const navigate    = useNavigate();
  const { role }    = useAuthStore();

  const [table,        setTable]        = useState(null);
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Modales
  const [selectedItem,  setSelectedItem]  = useState(null); // ítem del menú para modificador
  const [modifierOpen,  setModifierOpen]  = useState(false);
  const [freeItemOpen,  setFreeItemOpen]  = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Estado para el Pop-up de confirmación

  // Panel móvil: 'menu' | 'cart'
  const [mobileTab, setMobileTab] = useState('menu');

  /* ── Cargar mesa desde Firestore ─────────────────────────────────────── */
  useEffect(() => {
    const fetchTable = async () => {
      try {
        const snap = await getDoc(doc(db, 'tables', tableId));
        if (!snap.exists()) { navigate('/'); return; }
        const data = snap.data();
        setTable({ id: snap.id, ...data });
        setItems(data.items ?? []);
      } catch (e) {
        toast.error('No se pudo cargar la mesa');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchTable();
  }, [tableId, navigate]);

  /* ── Al seleccionar ítem del menú → abrir modal de modificadores ──────── */
  const handleSelectMenuItem = useCallback((item) => {
    setSelectedItem(item);
    setModifierOpen(true);
  }, []);

  /* ── Confirmar ítem con modificadores y agregarlo al carrito ─────────── */
  const handleModifierConfirm = useCallback(async ({ notes, extras, qty }) => {
    if (!selectedItem) return;

    const newItem = {
      id:     `${selectedItem.id}-${Date.now()}`,
      menuId: selectedItem.id,
      name:   selectedItem.name,
      price:  selectedItem.price,
      qty,
      notes,
      extras,
      isFree: false,
    };

    const updated = [...items, newItem];
    setItems(updated);
    setMobileTab('cart');

    try {
      await updateDoc(doc(db, 'tables', tableId), { items: updated, status: 'open' });
      toast.success(`${selectedItem.name} agregado`);
    } catch (e) {
      toast.error('Error al guardar');
      setItems(items); // revertir
    }
  }, [selectedItem, items, tableId]);

  /* ── Confirmar ítem libre ────────────────────────────────────────────── */
  const handleFreeItemConfirm = useCallback(async (freeItem) => {
    const updated = [...items, freeItem];
    setItems(updated);
    setMobileTab('cart');

    try {
      await updateDoc(doc(db, 'tables', tableId), { items: updated, status: 'open' });
      toast.success(`"${freeItem.name}" agregado`);
    } catch (e) {
      toast.error('Error al guardar');
      setItems(items);
    }
  }, [items, tableId]);

  /* ── Eliminar Mesa Confirmada ──────────────────────────────────────── */
  const confirmDeleteTable = async () => {
    setDeleteModalOpen(false);
    try {
      await deleteDoc(doc(db, 'tables', tableId));
      toast.success('Mesa eliminada correctamente');
      navigate('/');
    } catch (e) {
      toast.error('No se pudo eliminar la mesa');
      console.error(e);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!table)  return null;

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(circle at top left, rgba(245,158,11,0.03) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(245,158,11,0.03) 0%, transparent 40%)'
      }}
    >

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header 
        className="flex-shrink-0 z-30 flex items-center justify-between px-6 py-5 sm:px-8 border-b shadow-sm backdrop-blur-xl transition-all"
        style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
      >
        <div className="flex items-center gap-5 sm:gap-6">
          <button
            id="btn-back-tables"
            onClick={() => navigate('/')}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-95 shadow-sm border border-white/5"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <ArrowLeft size={24} color="var(--text-primary)" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5" style={{ color: 'var(--text-secondary)' }}>
              Toma de orden
            </span>
            <h1 className="font-black text-2xl tracking-wide sm:text-3xl" style={{ color: 'var(--accent)' }}>
              {table.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Botón Eliminar (Solo Admin) abre el Pop-up */}
          {role === 'admin' && (
            <button
              id="btn-delete-table"
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center justify-center w-14 h-14 rounded-2xl transition-all hover:bg-red-500/10 active:scale-95 border border-transparent hover:border-red-500/20"
              style={{ color: '#ef4444' }}
              title="Eliminar Mesa"
            >
              <Trash2 size={22} />
            </button>
          )}

          {/* Botón Venta Libre (Estilo Premium Glass Verde) */}
          <button
            id="btn-free-item"
            onClick={() => setFreeItemOpen(true)}
            className="group flex items-center justify-center gap-3 px-8 h-14 rounded-[1.25rem] text-[13px] sm:text-[14px] font-black uppercase tracking-widest transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.05) 100%)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.4)',
              boxShadow: '0 10px 30px -5px rgba(16,185,129,0.3), inset 0 1px 2px rgba(255,255,255,0.15)'
            }}
          >
            <ShoppingBag 
              size={22} 
              strokeWidth={2.5} 
              className="transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" 
            />
            <span className="hidden sm:inline">Venta Libre</span>
            <span className="sm:hidden">Libre</span>
          </button>
        </div>
      </header>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* ─── Menú (escritorio: siempre visible / móvil: tab) ──────────── */}
        <div className={`
          flex-1 min-w-0 overflow-hidden flex flex-col p-4 sm:p-6 lg:p-8
          ${mobileTab === 'menu' ? 'flex' : 'hidden'} lg:flex
        `}>
          <MenuGrid onSelectItem={handleSelectMenuItem} />
        </div>

        {/* ─── Carrito (escritorio: panel derecho / móvil: tab) ─────────── */}
        <div
          className={`
            lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col shadow-2xl relative z-20
            ${mobileTab === 'cart' ? 'flex w-full' : 'hidden'} lg:flex
          `}
          style={{ 
            borderLeft: '1px solid rgba(255,255,255,0.05)', 
            background: 'rgba(0,0,0,0.15)', // Un fondo ligeramente más oscuro para crear contraste 
            backdropFilter: 'blur(10px)'
          }}
        >
          <CartPanel tableId={tableId} items={items} setItems={setItems} />
        </div>
      </div>

      {/* ── Tab bar móvil (Estilo Dock de iOS) ─────────────────────────── */}
      <div
        className="lg:hidden flex-shrink-0 flex items-center justify-around p-3 pb-6 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(15,23,42,0.85)' }}
      >
        <button
          id="mobile-tab-menu"
          onClick={() => setMobileTab('menu')}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all ${mobileTab === 'menu' ? 'bg-white/10 scale-105' : 'opacity-60 hover:bg-white/5'}`}
        >
          <MenuIcon size={22} color={mobileTab === 'menu' ? 'var(--accent)' : 'var(--text-secondary)'} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: mobileTab === 'menu' ? 'var(--accent)' : 'var(--text-secondary)' }}>
            Menú
          </span>
        </button>
        
        <button
          id="mobile-tab-cart"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl transition-all relative ${mobileTab === 'cart' ? 'bg-white/10 scale-105' : 'opacity-60 hover:bg-white/5'}`}
        >
          <ReceiptText size={22} color={mobileTab === 'cart' ? 'var(--accent)' : 'var(--text-secondary)'} />
          <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: mobileTab === 'cart' ? 'var(--accent)' : 'var(--text-secondary)' }}>
            Cuenta
          </span>
          {cartCount > 0 && (
            <span
              className="absolute top-2 right-1/4 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black animate-pulse"
              style={{ background: 'var(--accent)', color: '#0f172a', boxShadow: '0 0 10px rgba(245,158,11,0.5)' }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────── */}
      <ModifierModal
        isOpen={modifierOpen}
        onClose={() => { setModifierOpen(false); setSelectedItem(null); }}
        item={selectedItem}
        onConfirm={handleModifierConfirm}
      />

      <FreeItemModal
        isOpen={freeItemOpen}
        onClose={() => setFreeItemOpen(false)}
        onConfirm={handleFreeItemConfirm}
      />

      {/* ── Modal Pop-up: Confirmar Eliminación de Mesa ─────────────────── */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl relative overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
            // Espaciado interno generoso para que el modal respire
            style={{ padding: '40px 30px' }} 
          >
            {/* Glow decorativo de fondo */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-red-500/20 blur-3xl rounded-full pointer-events-none" />

            <div className="flex flex-col items-center text-center relative z-10">
              
              {/* Ícono de advertencia con margin inferior */}
              <div 
                className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center ring-4 ring-red-500/5"
                style={{ marginBottom: '24px' }}
              >
                <Trash2 size={32} className="text-red-500" />
              </div>
              
              {/* Título espaciado */}
              <h2 
                className="text-2xl font-black text-white"
                style={{ marginBottom: '16px' }}
              >
                ¿Eliminar Mesa?
              </h2>
              
              {/* Texto explicativo con line-height para que se lea fácil y margin bottom para separarlo de los botones */}
              <p 
                className="text-slate-300 text-sm"
                style={{ marginBottom: '35px', lineHeight: '1.6' }}
              >
                Estás a punto de eliminar definitivamente la <strong className="text-white">"{table.name}"</strong>. 
                <span className="text-red-400 font-semibold block mt-2">Esta acción no se puede deshacer.</span>
              </p>

              {/* Contenedor de botones con gap explícito */}
              <div className="flex items-center w-full" style={{ gap: '16px' }}>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 rounded-2xl text-slate-300 font-bold bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  // Padding interno amplio en el botón
                  style={{ padding: '16px 20px', fontSize: '15px' }} 
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteTable}
                  className="flex-1 rounded-2xl text-white font-bold bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all active:scale-95"
                  // Padding interno amplio en el botón
                  style={{ padding: '16px 20px', fontSize: '15px' }} 
                >
                  Sí, Eliminar
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}