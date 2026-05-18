// src/components/pos/ModifierModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para agregar notas de cocina y extras a un ítem.
// Estructura visual basada en LoginPage (Glassmorphism, espacios amplios y márgenes indentados).
// Incluye scroll interno para pantallas pequeñas y footer fijo.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { Plus, X, StickyNote, DollarSign, Tag, CheckSquare, Square, ShoppingCart } from 'lucide-react';
import Modal from '../ui/Modal.jsx';

/**
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {Object}   item      - Ítem del menú seleccionado
 * @param {Function} onConfirm - Callback({ notes, extras, qty })
 */
export default function ModifierModal({ isOpen, onClose, item, onConfirm }) {
  const [notes, setNotes] = useState('');
  const [extras, setExtras] = useState([]);
  const [extraName, setExtraName] = useState('');
  const [extraPrice, setExtraPrice] = useState('');
  const [qty, setQty] = useState(1);
  const [extraError, setExtraError] = useState('');

  const predefinedExtras = item?.extras || [];

  const resetAndClose = () => {
    setNotes(''); setExtras([]); setExtraName(''); setExtraPrice(''); setQty(1); setExtraError('');
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
    setExtraError('');

    if (!extraName.trim() && !extraPrice) {
      setExtraError("Por favor, ingresa la descripción y el precio del cargo extra.");
      return;
    }
    if (!extraName.trim()) {
      setExtraError("Debes ingresar una descripción para el extra.");
      return;
    }
    const price = parseFloat(extraPrice);
    if (isNaN(price) || price < 0) {
      setExtraError("Debes ingresar un precio válido (puede ser 0 o mayor).");
      return;
    }
    if (extras.some(e => e.name.toLowerCase() === extraName.trim().toLowerCase())) {
      setExtraError("Este extra ya fue agregado previamente.");
      return;
    }

    setExtras((prev) => [...prev, { name: extraName.trim(), price }]);
    setExtraName('');
    setExtraPrice('');
    setExtraError('');
  };

  const removeExtra = (idx) =>
    setExtras((prev) => prev.filter((_, i) => i !== idx));

  const handleConfirm = () => {
    onConfirm({ notes, extras, qty });
    resetAndClose();
  };

  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
  const unitTotal = (item?.price ?? 0) + extrasTotal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={
        <span style={{ marginLeft: '10px' }}>
          {item?.name ?? 'Personalizar ítem'}
        </span>
      }
      maxWidth="max-w-2xl"
      showClose={false}
      padding="p-10 sm:p-14"
    >
      {/* Contenedor Principal */}
      <div
        className="flex flex-col h-[90vh]"
        style={{
          background: 'radial-gradient(circle at top right, rgba(245,158,11,0.05) 0%, transparent 60%)',
        }}
      >

        {/* --- ÁREA SCROLLABLE --- */}
        <div
          className="flex flex-col gap-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ maxHeight: '60vh', paddingBottom: '5px' }}
        >

          {/* --- DESCRIPCIÓN DEL PLATILLO (Si existe) --- */}
          {item?.description && (
            <div style={{ marginLeft: '5px', marginRight: '5px', marginTop: '1px', marginBottom: '-10px' }}>
              <p className="text-[14.5px] leading-relaxed font-medium opacity-80" style={{ color: 'var(--text-secondary)' }}>
                {item.description}
              </p>
            </div>
          )}

          {/* --- SECCIÓN: CANTIDAD Y PRECIO --- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-[var(--border)]">
            {/* Cantidad */}
            <div className="flex flex-col text-left sm:text-left gap-2" style={{ marginBottom: '5px', marginTop: '5px' }}>
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', marginLeft: '5px' }}>
                Cantidad
              </label>
              <div className="flex items-center gap-4 bg-[var(--bg-primary)] p-2 rounded-2xl border border-[var(--border)] shadow-sm w-fit" style={{ marginLeft: '5px' }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-11 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-95 bg-[var(--bg-elevated)]"
                  style={{ color: 'var(--text-primary)' }}
                >
                  −
                </button>
                <span className="text-2xl font-black w-9 text-center" style={{ color: 'var(--text-primary)' }}>
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-11 h-11 rounded-xl font-black text-xl flex items-center justify-center transition-all active:scale-95 text-[#0f172a]"
                  style={{ background: 'var(--accent)' }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Precio base */}
            <div className="text-left sm:text-right flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)', marginRight: '5px' }}>
                Precio Base
              </label>
              <span className="text-4xl font-black" style={{ color: 'var(--text-primary)', marginRight: '5px' }}>
                ${(item?.price ?? 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* --- SECCIÓN: EXTRAS PREDEFINIDOS --- */}
          {predefinedExtras.length > 0 && (
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Tag size={15} /> Modificadores sugeridos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {predefinedExtras.map((extra, idx) => {
                  const isSelected = extras.some(e => e.name === extra.name);
                  return (
                    <button
                      key={idx}
                      onClick={() => togglePredefinedExtra(extra)}
                      className="flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left shadow-sm min-h-[64px]"
                      style={{
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                        background: isSelected ? 'rgba(245,158,11,0.08)' : 'var(--bg-primary)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected
                          ? <CheckSquare size={20} color="var(--accent)" />
                          : <Square size={20} color="var(--text-secondary)" />
                        }
                        <span className="font-bold text-[15px]" style={{ color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {extra.name}
                        </span>
                      </div>
                      <span className="text-sm font-black opacity-60 ml-4 shrink-0" style={{ color: 'var(--text-primary)' }}>
                        +{extra.price > 0 ? `$${extra.price.toFixed(2)}` : 'Gratis'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* --- SECCIÓN: NOTAS DE COCINA --- */}
          <div className="flex flex-col gap-3" style={{ marginLeft: '10px', marginRight: '5px' }}>
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
              <StickyNote size={15} /> Notas de cocina
            </label>
            <div
              className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all shadow-sm"
            >
              <StickyNote size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)', marginLeft: '10px', marginTop: '12px' }} />
              <textarea
                className="flex-1 bg-transparent outline-none text-[var(--text-primary)] text-[15px] leading-relaxed"
                rows={2}
                placeholder="Sin cebolla, extra salsa, término medio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ color: 'var(--text-secondary)', marginTop: '10px' }}
              />
            </div>
          </div>

          {/* --- SECCIÓN: EXTRAS PERSONALIZADOS --- */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-secondary)', marginLeft: '10px' }}>
              <DollarSign size={15} style={{ color: 'var(--text-secondary)', marginLeft: '10px' }} /> Cargos adicionales
            </label>

            {/* Chips de extras ya agregados (solo los que no son predefinidos) */}
            {extras.filter(e => !predefinedExtras.some(pe => pe.name === e.name)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1" style={{ marginLeft: '12px' }}>
                {extras
                  .filter(e => !predefinedExtras.some(pe => pe.name === e.name))
                  .map((ex, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-2 rounded-xl border border-[var(--accent)] bg-[rgba(245,158,11,0.05)] text-sm font-bold"
                      style={{ paddingLeft: '20px', paddingRight: '12px' }}
                    >
                      <span style={{ color: 'var(--text-primary)' }}>
                        {ex.name} (+${ex.price.toFixed(2)})
                      </span>
                      <button
                        onClick={() => removeExtra(extras.findIndex(x => x.name === ex.name))}
                        className="hover:opacity-60 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Inputs para agregar extra personalizado */}
            <div className="flex gap-3" style={{ marginLeft: '10px', marginRight: '10px' }}>
              <div className="flex-1 flex items-center gap-3 px-5 min-h-[52px] rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
                <Plus size={18} className="shrink-0" style={{ color: 'var(--text-secondary)', marginLeft: '10px' }} />
                <input
                  className="flex-1 bg-transparent outline-none text-[15px] text-[var(--text-primary)]"
                  placeholder="Descripción del extra..."
                  value={extraName}
                  onChange={(e) => setExtraName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomExtra()}
                />
              </div>
              <div className="w-28 flex items-center justify-center px-4 min-h-[52px] rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
                <input
                  className="w-full bg-transparent outline-none text-center font-bold text-lg text-[var(--text-primary)]"
                  placeholder="$0"
                  type="number"
                  value={extraPrice}
                  onChange={(e) => setExtraPrice(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomExtra()}
                />
              </div>
              <button
                onClick={addCustomExtra}
                className="btn-primary w-[52px] h-[52px] flex items-center justify-center rounded-2xl transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <Plus size={22} strokeWidth={3} />
              </button>
            </div>
            {extraError && (
              <div className="text-red-500 text-xs font-bold mt-1" style={{ marginLeft: '15px' }}>
                {extraError}
              </div>
            )}
          </div>

        </div>
        {/* --- FIN ÁREA SCROLLABLE --- */}


        {/* --- FOOTER FIJO --- */}
        <div className="flex flex-col gap-6" style={{ paddingTop: '2px' }}>
          {/* TOTAL FINAL */}
          <div className="px-7 py-6 rounded-[1.5rem] bg-[var(--bg-primary)] border border-[var(--accent)] border-opacity-30 flex items-center justify-between shadow-xl ring-1 ring-[var(--accent)] ring-opacity-10" style={{ marginLeft: '10px', marginRight: '10px' }}>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50" style={{ color: 'var(--text-secondary)', marginLeft: '15px' }}>
                Subtotal ítem
              </span>
              <span className="text-base font-bold" style={{ color: 'var(--text-secondary)', marginLeft: '15px' }}>
                {qty} unidades
              </span>
            </div>

            <span className="text-5xl font-black" style={{ color: 'var(--accent)', marginRight: '15px' }}>
              ${(unitTotal * qty).toFixed(2)}
            </span>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3" style={{ marginLeft: '10px', marginRight: '10px', marginBottom: '10px' }}>
            <button
              onClick={resetAndClose}
              className="flex-1 py-4 text-[14px] font-bold uppercase tracking-widest rounded-2xl transition-colors hover:bg-[rgba(255,255,255,0.05)] border border-[var(--border)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary flex-[2] flex items-center justify-center gap-3 py-4 text-[15px] font-black uppercase tracking-wider rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShoppingCart size={20} strokeWidth={3} />
              Agregar a la cuenta
            </button>
          </div>
        </div>
        {/* --- FIN FOOTER FIJO --- */}

      </div>
    </Modal>
  );
}