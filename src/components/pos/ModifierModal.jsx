// src/components/pos/ModifierModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para agregar notas de cocina y extras con costo adicional a un ítem.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, X, StickyNote, DollarSign } from 'lucide-react';
import Modal from '../ui/Modal.jsx';

/**
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {Object}   item      - Ítem del menú seleccionado
 * @param {Function} onConfirm - Callback({ notes, extras, qty })
 */
export default function ModifierModal({ isOpen, onClose, item, onConfirm }) {
  const [notes,     setNotes]     = useState('');
  const [extras,    setExtras]    = useState([]);       // [{ name, price }]
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [qty, setQty]             = useState(1);

  const resetAndClose = () => {
    setNotes(''); setExtras([]); setExtraName(''); setExtraPrice(''); setQty(1);
    onClose();
  };

  const addExtra = () => {
    const price = parseFloat(extraPrice);
    if (!extraName.trim())      return;
    if (isNaN(price) || price < 0) return;
    setExtras((prev) => [...prev, { name: extraName.trim(), price }]);
    setExtraName(''); setExtraPrice('');
  };

  const removeExtra = (idx) =>
    setExtras((prev) => prev.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    onConfirm({ notes, extras, qty });
    resetAndClose();
  };

  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
  const unitTotal   = (item?.price ?? 0) + extrasTotal;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={item?.name ?? 'Personalizar ítem'} maxWidth="max-w-lg">
      <div className="flex flex-col gap-5">

        {/* Precio base */}
        <div className="flex items-center justify-between p-3 rounded-xl"
             style={{ background: 'var(--bg-primary)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Precio base</span>
          <span className="font-bold" style={{ color: 'var(--accent)' }}>
            ${(item?.price ?? 0).toFixed(2)}
          </span>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Cantidad
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >−</button>
            <span className="text-xl font-bold w-8 text-center" style={{ color: 'var(--text-primary)' }}>
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-9 h-9 rounded-lg font-bold text-lg flex items-center justify-center"
              style={{ background: 'var(--accent)', color: '#0f172a' }}
            >+</button>
          </div>
        </div>

        {/* Notas de cocina */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-2"
                 style={{ color: 'var(--text-secondary)' }}>
            <StickyNote size={12} /> Notas de cocina
          </label>
          <textarea
            id="modifier-notes"
            className="pos-input resize-none"
            rows={2}
            placeholder="Sin cebolla, extra aderezo, término 3/4..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Extras con costo */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-2"
                 style={{ color: 'var(--text-secondary)' }}>
            <DollarSign size={12} /> Extras con costo adicional
          </label>

          {/* Lista de extras agregados */}
          {extras.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {extras.map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg"
                     style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                      +${ex.price.toFixed(2)}
                    </span>
                    <button onClick={() => removeExtra(idx)} className="p-0.5 rounded hover:bg-white/10">
                      <X size={12} color="var(--text-secondary)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de nuevo extra */}
          <div className="flex gap-2">
            <input
              id="extra-name"
              className="pos-input text-sm flex-1"
              placeholder="Nombre del extra"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExtra()}
            />
            <input
              id="extra-price"
              className="pos-input text-sm w-24"
              placeholder="$0.00"
              type="number"
              min="0"
              step="0.5"
              value={extraPrice}
              onChange={(e) => setExtraPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExtra()}
            />
            <button onClick={addExtra} className="btn-primary px-3">
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Total parcial */}
        <div className="flex items-center justify-between p-3 rounded-xl border"
             style={{ background: 'var(--bg-primary)', borderColor: 'rgba(245,158,11,0.3)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Total ({qty}x ${unitTotal.toFixed(2)})
          </span>
          <span className="text-lg font-black" style={{ color: 'var(--accent)' }}>
            ${(unitTotal * qty).toFixed(2)}
          </span>
        </div>

        {/* Botones */}
        <div className="flex gap-2">
          <button onClick={resetAndClose} className="btn-ghost flex-1 text-sm">Cancelar</button>
          <button
            id="modifier-confirm"
            onClick={handleConfirm}
            className="btn-primary flex-1 text-sm"
          >
            Agregar al carrito
          </button>
        </div>
      </div>
    </Modal>
  );
}
