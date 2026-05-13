// src/components/pos/CartPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Panel lateral del carrito de la mesa activa.
// Muestra ítems, subtotal, y botones de acción (cobrar / limpiar).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, CreditCard, StickyNote, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config.js';

/**
 * @param {string} tableId  - ID de la mesa
 * @param {Array}  items    - Ítems en el carrito
 * @param {Function} setItems - Setter local (sync inmediato)
 */
export default function CartPanel({ tableId, items, setItems }) {
  const navigate = useNavigate();

  /* ── Calcular totales ─────────────────────────────────────────────────── */
  const subtotal = items.reduce((sum, it) => {
    const extrasTotal = (it.extras ?? []).reduce((s, e) => s + e.price, 0);
    return sum + (it.price + extrasTotal) * it.qty;
  }, 0);

  /* ── Actualizar cantidad de un ítem ──────────────────────────────────── */
  const updateQty = async (id, delta) => {
    const updated = items
      .map((it) => it.id === id ? { ...it, qty: it.qty + delta } : it)
      .filter((it) => it.qty > 0);
    setItems(updated);
    try { await updateDoc(doc(db, 'tables', tableId), { items: updated, status: updated.length > 0 ? 'open' : 'available' }); }
    catch { toast.error('Error al actualizar'); }
  };

  /* ── Eliminar un ítem ─────────────────────────────────────────────────── */
  const removeItem = async (id) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    try { await updateDoc(doc(db, 'tables', tableId), { items: updated, status: updated.length > 0 ? 'open' : 'available' }); }
    catch { toast.error('Error al eliminar'); }
  };

  /* ── Vaciar carrito ───────────────────────────────────────────────────── */
  const clearCart = async () => {
    if (!window.confirm('¿Vaciar toda la cuenta?')) return;
    setItems([]);
    try { await updateDoc(doc(db, 'tables', tableId), { items: [], status: 'available' }); }
    catch { toast.error('Error al limpiar'); }
  };

  /* ── Ir a cobrar ──────────────────────────────────────────────────────── */
  const handleCheckout = () => {
    if (items.length === 0) return toast.error('Agrega al menos un artículo');
    navigate(`/checkout/${tableId}`);
  };

  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--text-primary)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
           style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} color="var(--accent)" />
          <span className="font-bold text-sm">Cuenta</span>
          {items.length > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'var(--accent)', color: '#0f172a' }}>
              {items.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button onClick={clearCart} className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors flex-shrink-0" title="Vaciar cuenta">
            <Trash2 size={20} color="var(--danger)" />
          </button>
        )}
      </div>

      {/* Lista de ítems */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
            <ShoppingCart size={32} color="var(--text-secondary)" />
            <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
              La cuenta está vacía.<br />Agrega ítems del menú.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
            const lineTotal   = (item.price + extrasTotal) * item.qty;

            return (
              <div key={item.id}
                   className="rounded-xl p-3 animate-fadeIn"
                   style={{
                     background: item.isFree
                       ? 'rgba(16,185,129,0.06)'
                       : 'var(--bg-elevated)',
                     border: `1px solid ${item.isFree ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                   }}>

                {/* Nombre + eliminar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {item.isFree && (
                      <Tag size={11} color="#10b981" className="flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold truncate">{item.name}</span>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                          className="w-12 h-12 flex items-center justify-center flex-shrink-0 hover:bg-white/10 rounded-lg transition-colors">
                    <Trash2 size={18} color="var(--text-secondary)" />
                  </button>
                </div>

                {/* Notas */}
                {item.notes && (
                  <div className="flex items-center gap-1 mt-1">
                    <StickyNote size={10} color="var(--text-secondary)" />
                    <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      {item.notes}
                    </span>
                  </div>
                )}

                {/* Extras */}
                {(item.extras ?? []).map((ex, i) => (
                  <div key={i} className="text-xs mt-0.5 ml-3" style={{ color: 'var(--accent)' }}>
                    + {ex.name} ${ex.price.toFixed(2)}
                  </div>
                ))}

                {/* Controles cantidad + precio */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-12 h-12 rounded-xl text-lg font-bold flex items-center justify-center transition-transform active:scale-95 flex-shrink-0"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >−</button>
                    <span className="text-base font-bold w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-12 h-12 rounded-xl text-lg font-bold flex items-center justify-center transition-transform active:scale-95 flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.2)', color: 'var(--accent)' }}
                    >+</button>
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--accent)' }}>
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: subtotal + botón cobrar */}
      <div className="border-t p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
          <span className="font-black text-xl" style={{ color: 'var(--text-primary)' }}>
            ${subtotal.toFixed(2)}
          </span>
        </div>
        <button
          id="btn-checkout"
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          style={{ opacity: items.length === 0 ? 0.5 : 1 }}
        >
          <CreditCard size={16} />
          Cobrar mesa
        </button>
      </div>
    </div>
  );
}
