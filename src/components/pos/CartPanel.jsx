// src/components/pos/CartPanel.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Panel lateral del carrito de la mesa activa.
// Muestra ítems, subtotal, y botones de acción (cobrar / limpiar).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, CreditCard, StickyNote, Tag, AlertTriangle } from 'lucide-react';
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
  
  // Estado para controlar nuestro pop-up personalizado
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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

  /* ── Vaciar carrito (Pop-up personalizado) ────────────────────────────── */
  const requestClearCart = () => {
    setIsConfirmOpen(true); // Abrimos el pop-up en lugar del alert nativo
  };

  const confirmClearCart = async () => {
    setIsConfirmOpen(false); // Cerramos el pop-up
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
    <div className="flex flex-col h-full relative" style={{ color: 'var(--text-primary)' }}>

      {/* --- HEADER --- */}
      <div className="flex items-center justify-between border-b"
           style={{ 
             borderColor: 'var(--border)',
             paddingLeft: '24px', 
             paddingRight: '24px',
             paddingTop: '20px',
             paddingBottom: '20px'
           }}>
        <div className="flex items-center gap-3">
          <ShoppingCart size={20} color="var(--accent)" />
          <span className="font-black text-lg tracking-wide uppercase">Cuenta</span>
          {items.length > 0 && (
            <span className="text-sm rounded-xl font-black shadow-sm"
                  style={{ background: 'var(--accent)', color: '#0f172a', paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '4px' }}>
              {items.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button 
            onClick={requestClearCart} 
            className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-red-500/10 transition-colors flex-shrink-0" 
            title="Vaciar cuenta"
          >
            <Trash2 size={20} className="text-red-500 opacity-80 hover:opacity-100" />
          </button>
        )}
      </div>

      {/* --- LISTA DE ÍTEMS --- */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4" 
           style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '10px', paddingBottom: '10px' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-60" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
            <ShoppingCart size={48} color="var(--text-secondary)" />
            <p className="text-sm text-center font-medium" style={{ color: 'var(--text-secondary)', paddingLeft: '20px', paddingRight: '20px' }}>
              La cuenta está vacía.<br />Agrega ítems del menú para comenzar.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
            const lineTotal   = (item.price + extrasTotal) * item.qty;

            return (
              <div key={item.id}
                   className="rounded-2xl animate-fadeIn flex flex-col shadow-sm"
                   style={{
                     background: item.isFree ? 'rgba(16,185,129,0.04)' : 'var(--bg-elevated)',
                     border: `1px solid ${item.isFree ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                     paddingLeft: '10px',  
                     paddingRight: '10px',  
                     paddingTop: '10px',
                     paddingBottom: '10px',
                     marginBottom: '8px'   
                   }}>

                {/* Nombre + Botón Eliminar */}
                <div className="flex items-start justify-between gap-3" style={{ paddingLeft: '4px', paddingRight: '4px' }}>
                  <div className="flex items-start gap-2 flex-1 min-w-0 mt-1">
                    {item.isFree && (
                      <Tag size={14} color="#10b981" className="flex-shrink-0 mt-1" />
                    )}
                    <span className="text-[16px] font-bold leading-tight">{item.name}</span>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                          className="w-10 h-10 flex items-center justify-center flex-shrink-0 hover:bg-white/5 rounded-xl transition-colors">
                    <Trash2 size={16} color="var(--text-secondary)" className="opacity-70 hover:opacity-100" />
                  </button>
                </div>

                {/* Contenedor de Notas y Extras */}
                <div className="flex flex-col gap-2" style={{ marginLeft: '12px', marginRight: '12px', marginTop: '8px', marginBottom: '8px' }}>
                  {item.notes && (
                    <div className="flex items-start gap-2">
                      <StickyNote size={13} className="mt-0.5" style={{ color: 'var(--text-secondary)' }} />
                      <span className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.notes}
                      </span>
                    </div>
                  )}

                  {(item.extras ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(item.extras ?? []).map((ex, i) => (
                        <span key={i} 
                              className="text-[11px] font-bold rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)]" 
                              style={{ color: 'var(--accent)', paddingLeft: '4px', paddingRight: '4px', paddingTop: '4px', paddingBottom: '4px' }}>
                          + {ex.name} (${ex.price.toFixed(2)})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Controles cantidad + precio */}
                <div className="flex items-center justify-between border-t border-[var(--border)] border-opacity-50"
                     style={{ paddingTop: '10px', marginTop: '8px', paddingLeft: '4px', paddingRight: '4px' }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-11 h-11 rounded-xl text-xl font-black flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                      style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    >−</button>
                    <span className="text-lg font-black w-8 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-11 h-11 rounded-xl text-xl font-black flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                      style={{ background: 'var(--accent)', color: '#0f172a' }}
                    >+</button>
                  </div>
                  <span className="font-black text-lg" style={{ color: 'var(--accent)' }}>
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Línea separadora */}
        <div className="w-full h-px" style={{ background: 'var(--border)', marginTop: '10px', marginBottom: '10px' }} />

      {/* --- FOOTER: SUBTOTAL Y BOTÓN COBRAR --- */}
      <div className="rounded-t-[2.5rem] shadow-[0_-5px_30px_rgba(0,0,0,0.06)] flex flex-col gap-5" 
           style={{ 
             background: 'var(--bg-elevated)', 
             borderTop: '1px solid var(--border)',
             paddingLeft: '10px',    
             paddingRight: '10px',
             paddingTop: '10px',
             paddingBottom: '10px'
           }}>
        
        <div className="flex justify-between items-center" style={{ paddingLeft: '8px', paddingRight: '8px' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            Subtotal
          </span>
          <span className="font-black text-3xl" style={{ color: 'var(--text-primary)' }}>
            ${subtotal.toFixed(2)}
          </span>
        </div>
        
        <button
          id="btn-checkout"
          onClick={handleCheckout}
          disabled={items.length === 0}
          className="btn-primary w-full text-[15px] font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{ 
            opacity: items.length === 0 ? 0.5 : 1,
            paddingTop: '10px',
            paddingBottom: '10px'
          }}
        >
          <CreditCard size={20} strokeWidth={2.5} />
          Cobrar mesa
        </button>
      </div>

      {/* --- POP-UP MODAL DE CONFIRMACIÓN (VACIAR CUENTA) --- */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[2rem] max-w-sm w-full shadow-2xl animate-fadeIn flex flex-col gap-4 overflow-hidden"
               style={{ paddingLeft: '32px', paddingRight: '32px', paddingTop: '32px', paddingBottom: '32px' }}>
            
            <div className="flex items-center gap-4 mb-1" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertTriangle size={24} color="#ef4444" />
              </div>
              <h3 className="text-xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                ¿Vaciar la cuenta?
              </h3>
            </div>
            
            <p className="text-[14px] leading-relaxed font-medium mb-2" style={{ color: 'var(--text-secondary)', marginLeft: '10px', marginRight: '10px' }}>
              Esta acción eliminará todos los ítems agregados de esta mesa. No podrás deshacer este cambio.
            </p>
            
            <div className="flex gap-3 mt-4" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 font-bold uppercase tracking-widest rounded-xl border border-[var(--border)] transition-colors hover:bg-white/5"
                style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '14px', paddingBottom: '14px' }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmClearCart}
                className="flex-[1.5] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-sm border"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                  fontSize: '13px', 
                  paddingTop: '14px', 
                  paddingBottom: '14px' 
                }}
              >
                Sí, vaciar
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}