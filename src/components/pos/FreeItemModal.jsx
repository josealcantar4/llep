// src/components/pos/FreeItemModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para agregar un artículo de "Venta Libre" — ítem fuera del menú con
// nombre manual, precio manual y cantidad.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import toast from 'react-hot-toast';

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

  const resetAndClose = () => {
    setName(''); setPrice(''); setQty(1); setNotes('');
    onClose();
  };

  const handleConfirm = () => {
    if (!name.trim())               return toast.error('Escribe el nombre del artículo');
    const p = parseFloat(price);
    if (isNaN(p) || p <= 0)         return toast.error('Ingresa un precio válido');

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
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Venta Libre" maxWidth="max-w-md">
      <div className="flex flex-col gap-4">

        {/* Ícono decorativo */}
        <div className="flex items-center gap-3 p-3 rounded-xl mb-1"
             style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <ShoppingBag size={20} color="var(--accent)" />
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Artículo no registrado en el menú. Asigna un nombre y precio manual.
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Nombre del artículo *
          </label>
          <input
            id="free-item-name"
            className="pos-input"
            placeholder="Ej: Orden especial del chef"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Precio y cantidad en fila */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Precio unitario ($) *
            </label>
            <input
              id="free-item-price"
              className="pos-input"
              type="number"
              min="0"
              step="0.50"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Cantidad
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg font-bold flex items-center justify-center"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              >−</button>
              <span className="text-lg font-bold w-6 text-center" style={{ color: 'var(--text-primary)' }}>
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-9 h-9 rounded-lg font-bold flex items-center justify-center"
                style={{ background: 'var(--accent)', color: '#0f172a' }}
              >+</button>
            </div>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Notas (opcional)
          </label>
          <input
            id="free-item-notes"
            className="pos-input"
            placeholder="Instrucciones especiales..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Total */}
        {price && !isNaN(parseFloat(price)) && (
          <div className="flex justify-between items-center p-3 rounded-xl"
               style={{ background: 'var(--bg-primary)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total</span>
            <span className="font-black text-lg" style={{ color: 'var(--accent)' }}>
              ${(parseFloat(price) * qty).toFixed(2)}
            </span>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 mt-1">
          <button onClick={resetAndClose} className="btn-ghost flex-1 text-sm">Cancelar</button>
          <button id="free-item-confirm" onClick={handleConfirm} className="btn-primary flex-1 text-sm">
            Agregar a la cuenta
          </button>
        </div>
      </div>
    </Modal>
  );
}
