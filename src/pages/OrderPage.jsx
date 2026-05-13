// src/pages/OrderPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Pantalla de toma de orden. Layout de dos columnas:
//   izquierda → menú + búsqueda
//   derecha   → carrito de la mesa activa
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ReceiptText, Menu as MenuIcon } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { db } from '../firebase/config.js';
import MenuGrid from '../components/pos/MenuGrid.jsx';
import CartPanel from '../components/pos/CartPanel.jsx';
import ModifierModal from '../components/pos/ModifierModal.jsx';
import FreeItemModal from '../components/pos/FreeItemModal.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

export default function OrderPage() {
  const { tableId } = useParams();
  const navigate    = useNavigate();

  const [table,        setTable]        = useState(null);
  const [items,        setItems]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  // Modales
  const [selectedItem,  setSelectedItem]  = useState(null); // ítem del menú para modificador
  const [modifierOpen,  setModifierOpen]  = useState(false);
  const [freeItemOpen,  setFreeItemOpen]  = useState(false);

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

  if (loading) return <LoadingSpinner fullScreen />;
  if (!table)  return null;

  const cartCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-primary)]">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 z-30 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]/95 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-tables"
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={18} color="var(--text-secondary)" />
          </button>
          <div>
            <h1 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
              {table.name}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Toma de orden
            </p>
          </div>
        </div>

        {/* Botón Venta Libre */}
        <button
          id="btn-free-item"
          onClick={() => setFreeItemOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{
            background: 'rgba(16,185,129,0.12)',
            color: '#10b981',
            border: '1px solid rgba(16,185,129,0.3)',
          }}
        >
          <ShoppingBag size={14} />
          <span className="hidden sm:inline">Venta Libre</span>
          <span className="sm:hidden">Libre</span>
        </button>
      </header>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Menú (escritorio: siempre visible / móvil: tab) ──────────── */}
        <div className={`
          flex-1 min-w-0 overflow-hidden flex flex-col p-4
          ${mobileTab === 'menu' ? 'flex' : 'hidden'} lg:flex
        `}>
          <MenuGrid onSelectItem={handleSelectMenuItem} />
        </div>

        {/* ─── Carrito (escritorio: panel derecho / móvil: tab) ─────────── */}
        <div
          className={`
            lg:w-80 xl:w-96 flex-shrink-0 border-l flex flex-col
            ${mobileTab === 'cart' ? 'flex w-full' : 'hidden'} lg:flex
          `}
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <CartPanel tableId={tableId} items={items} setItems={setItems} />
        </div>
      </div>

      {/* ── Tab bar móvil ────────────────────────────────────────────────── */}
      <div
        className="lg:hidden flex-shrink-0 flex border-t"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <button
          id="mobile-tab-menu"
          onClick={() => setMobileTab('menu')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors"
          style={{ color: mobileTab === 'menu' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <MenuIcon size={16} />
          Menú
        </button>
        <button
          id="mobile-tab-cart"
          onClick={() => setMobileTab('cart')}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative"
          style={{ color: mobileTab === 'cart' ? 'var(--accent)' : 'var(--text-secondary)' }}
        >
          <ReceiptText size={16} />
          Cuenta
          {cartCount > 0 && (
            <span
              className="absolute top-2 right-8 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
              style={{ background: 'var(--accent)', color: '#0f172a' }}
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
    </div>
  );
}
