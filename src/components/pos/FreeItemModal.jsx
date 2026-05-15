// src/components/pos/FreeItemModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para agregar un artículo de "Venta Libre" — ítem fuera del menú con
// nombre manual, precio manual y cantidad.
// Incluye scroll interno para pantallas pequeñas y footer fijo.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';

/**
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {Function} onConfirm - Callback recibe el ítem libre { id, name, price, qty, notes, extras, isFree }
 */
export default function FreeItemModal({ isOpen, onClose, onConfirm }) {
  const [name,  setName]  = useState('');
  const [price, setPrice] = useState('');
  const [qty,   setQty]   = useState(1);
  const [notes, setNotes] = useState('');
  
  // Agregamos el estado para manejar los errores de validación dinámicos
  const [error, setError] = useState('');

  const resetAndClose = () => {
    setName(''); setPrice(''); setQty(1); setNotes(''); setError('');
    onClose();
  };

  const handleConfirm = () => {
    setError(''); // Limpiar errores previos

    if (!name.trim()) {
      return setError('Por favor, escribe el nombre del artículo.');
    }
    
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) {
      return setError('Ingresa un precio unitario válido mayor a $0.');
    }

    onConfirm({
      id:     `free-${Date.now()}`,
      name:   name.trim(),
      price:  p,
      qty,
      notes:  notes.trim(),
      extras: [],
      isFree: true,             // marca visual en el carrito
    });
    resetAndClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={resetAndClose} 
      title={<span style={{ marginLeft: '10px' }}>Venta Libre</span>} 
      maxWidth="max-w-md"
      showClose={false}
    >
      {/* Contenedor Principal */}
      <div className="flex flex-col h-full">

        {/* --- ÁREA SCROLLABLE --- */}
        <div 
          className="flex flex-col gap-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
          style={{ maxHeight: '65vh', paddingTop: '10px', paddingBottom: '24px' }}
        >

          {/* --- ÍCONO Y MENSAJE DECORATIVO --- */}
          <div className="flex items-center gap-4 rounded-2xl shadow-sm"
               style={{ 
                 background: 'rgba(245,158,11,0.08)', 
                 border: '1px solid rgba(245,158,11,0.2)',
                 paddingLeft: '20px', paddingRight: '20px', paddingTop: '18px', paddingBottom: '18px',
                 marginLeft: '10px', marginRight: '10px'
               }}>
            <ShoppingBag size={24} color="var(--accent)" className="shrink-0" />
            <p className="text-[13px] leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              Artículo no registrado en el menú. Asigna un nombre y precio manual para agregarlo a la cuenta.
            </p>
          </div>

          {/* --- INPUT: NOMBRE --- */}
          <div style={{ marginLeft: '10px', marginRight: '10px' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)', paddingLeft: '5px' }}>
              Nombre del artículo *
            </label>
            <input
              id="free-item-name"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all shadow-sm text-[15px]"
              style={{ color: 'var(--text-primary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
              placeholder="Ej: Orden especial del chef"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* --- FILA: PRECIO Y CANTIDAD --- */}
          <div className="flex gap-4" style={{ marginLeft: '10px', marginRight: '10px' }}>
            
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)', paddingLeft: '5px' }}>
                Precio unitario *
              </label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold" style={{ color: 'var(--text-secondary)' }}>$</span>
                <input
                  id="free-item-price"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all shadow-sm text-[15px] font-bold"
                  style={{ color: 'var(--text-primary)', paddingLeft: '35px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
                  type="number"
                  min="0"
                  step="0.50"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-center" style={{ color: 'var(--text-secondary)' }}>
                Cantidad
              </label>
              <div className="flex items-center gap-2 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-sm" 
                   style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '6px', paddingBottom: '6px' }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-xl text-xl font-black flex items-center justify-center transition-all active:scale-95"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >−</button>
                <span className="text-lg font-black w-8 text-center" style={{ color: 'var(--text-primary)' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 rounded-xl text-xl font-black flex items-center justify-center transition-all active:scale-95"
                  style={{ background: 'var(--accent)', color: '#0f172a' }}
                >+</button>
              </div>
            </div>
          </div>

          {/* --- INPUT: NOTAS --- */}
          <div style={{ marginLeft: '10px', marginRight: '10px' }}>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)', paddingLeft: '5px' }}>
              Notas (opcional)
            </label>
            <textarea
              id="free-item-notes"
              className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all shadow-sm text-[15px] resize-y"
              style={{ color: 'var(--text-primary)', paddingLeft: '20px', paddingRight: '20px', paddingTop: '16px', paddingBottom: '16px' }}
              placeholder="Instrucciones especiales..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* --- RENDERIZADO DINÁMICO DE ERRORES --- */}
          {error && (
            <div className="flex items-center gap-2" style={{ marginLeft: '15px', marginRight: '15px', marginTop: '-5px' }}>
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span className="text-red-500 text-xs font-bold">{error}</span>
            </div>
          )}

        </div>
        {/* --- FIN ÁREA SCROLLABLE --- */}


        {/* --- FOOTER FIJO --- */}
        <div className="flex flex-col gap-4" style={{ paddingTop: '16px' }}>
          
          {/* --- CAJA DE TOTAL --- */}
          {price && !isNaN(parseFloat(price)) && (
            <div className="flex justify-between items-center rounded-2xl shadow-sm"
                 style={{ 
                   background: 'var(--bg-elevated)', 
                   border: '1px solid rgba(245,158,11,0.3)',
                   paddingLeft: '24px', paddingRight: '24px', paddingTop: '20px', paddingBottom: '20px',
                   marginLeft: '10px', marginRight: '10px'
                 }}>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60" style={{ color: 'var(--text-secondary)' }}>
                Total calculado
              </span>
              <span className="font-black text-2xl" style={{ color: 'var(--accent)' }}>
                ${(parseFloat(price) * qty).toFixed(2)}
              </span>
            </div>
          )}

          {/* --- BOTONES DE ACCIÓN --- */}
          <div className="flex gap-3" style={{ marginLeft: '10px', marginRight: '10px', marginBottom: '10px' }}>
            <button 
              onClick={resetAndClose} 
              className="flex-1 font-bold uppercase tracking-widest rounded-2xl border border-[var(--border)] transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)', fontSize: '13px', paddingTop: '16px', paddingBottom: '16px' }}
            >
              Cancelar
            </button>
            <button 
              id="free-item-confirm" 
              onClick={handleConfirm} 
              className="btn-primary flex-[2] font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ fontSize: '14px', paddingTop: '16px', paddingBottom: '16px' }}
            >
              Agregar a la cuenta
            </button>
          </div>
        </div>
        {/* --- FIN FOOTER FIJO --- */}

      </div>
    </Modal>
  );
}