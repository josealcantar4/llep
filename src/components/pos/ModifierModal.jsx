// src/components/pos/ModifierModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para agregar notas de cocina y extras a un ítem.
// Permite seleccionar extras predefinidos del platillo o crear extras personalizados.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, X, StickyNote, DollarSign, Tag, CheckSquare, Square } from 'lucide-react';
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

  const predefinedExtras = item?.extras || [];

  const resetAndClose = () => {
    setNotes(''); setExtras([]); setExtraName(''); setExtraPrice(''); setQty(1);
    onClose();
  };

  const togglePredefinedExtra = (extra) => {
    const exists = extras.some(e => e.name === extra.name);
    if (exists) {
      setExtras(prev => prev.filter(e => e.name !== extra.name));
    } else {
      setExtras(prev => [...prev, { name: extra.name, price: extra.price }]);
    }
  };

  const addCustomExtra = () => {
    const price = parseFloat(extraPrice);
    if (!extraName.trim()) return;
    if (isNaN(price) || price < 0) return;
    
    // Evitar duplicados por nombre
    if (extras.some(e => e.name.toLowerCase() === extraName.trim().toLowerCase())) return;

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
        <div className="flex items-center justify-between p-3 rounded-xl border"
             style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Precio base</span>
          <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
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
              className="w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center transition-colors"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >−</button>
            <span className="text-2xl font-black w-10 text-center" style={{ color: 'var(--text-primary)' }}>
              {qty}
            </span>
            <button
              onClick={() => setQty((q) => q + 1)}
              className="w-10 h-10 rounded-xl font-black text-xl flex items-center justify-center transition-colors hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#0f172a' }}
            >+</button>
          </div>
        </div>

        {/* Extras Predefinidos (si el platillo los tiene configurados) */}
        {predefinedExtras.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <Tag size={12} /> Modificadores / Extras del Platillo
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {predefinedExtras.map((extra, idx) => {
                const isSelected = extras.some(e => e.name === extra.name);
                return (
                  <button
                    key={idx}
                    onClick={() => togglePredefinedExtra(extra)}
                    className="flex items-center justify-between p-3 rounded-xl border transition-all text-left"
                    style={{
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                      background: isSelected ? 'rgba(245,158,11,0.1)' : 'var(--bg-primary)'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} color="var(--text-secondary)" />}
                      <span className="text-sm font-semibold truncate" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {extra.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: extra.price > 0 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      +{extra.price > 0 ? `$${extra.price.toFixed(2)}` : 'Gratis'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Notas de cocina */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <StickyNote size={12} /> Notas adicionales para cocina
          </label>
          <textarea
            id="modifier-notes"
            className="pos-input resize-none"
            rows={2}
            placeholder="Ej: Sin cebolla, extra aderezo a un lado..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Extras con costo Personalizados */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            <DollarSign size={12} /> Extras / Cargos Especiales
          </label>

          {/* Lista de extras agregados manualmente */}
          {extras.filter(e => !predefinedExtras.some(pe => pe.name === e.name)).length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {extras.filter(e => !predefinedExtras.some(pe => pe.name === e.name)).map((ex, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-lg"
                     style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{ex.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                      +${ex.price.toFixed(2)}
                    </span>
                    <button onClick={() => removeExtra(extras.findIndex(x => x.name === ex.name))} className="p-0.5 rounded hover:bg-white/10">
                      <X size={14} color="var(--text-secondary)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formulario de nuevo extra manual */}
          <div className="flex gap-2">
            <input
              id="extra-name"
              className="pos-input text-sm flex-1"
              placeholder="Otro extra especial..."
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomExtra()}
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
              onKeyDown={(e) => e.key === 'Enter' && addCustomExtra()}
            />
            <button onClick={addCustomExtra} className="btn-primary px-3 rounded-lg flex-shrink-0">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Total parcial */}
        <div className="flex items-center justify-between p-4 rounded-xl mt-2"
             style={{ background: 'var(--bg-primary)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Subtotal del platillo ({qty}x ${unitTotal.toFixed(2)})
          </span>
          <span className="text-2xl font-black" style={{ color: 'var(--accent)' }}>
            ${(unitTotal * qty).toFixed(2)}
          </span>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button onClick={resetAndClose} className="btn-ghost flex-1 py-3 text-sm">Cancelar</button>
          <button
            id="modifier-confirm"
            onClick={handleConfirm}
            className="btn-primary flex-[2] py-3 text-base"
          >
            Agregar a la cuenta
          </button>
        </div>
      </div>
    </Modal>
  );
}
