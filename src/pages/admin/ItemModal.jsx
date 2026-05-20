// src/pages/admin/ItemModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para crear o editar un Platillo del menú.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { UtensilsCrossed, Plus, Pencil, Trash2, X, Tag } from 'lucide-react';
import { Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
  );
}

export default function ItemModal({ initial, categories, onSave, onClose }) {
  const [name,       setName]       = useState(initial?.name        ?? '');
  const [price,      setPrice]      = useState(initial?.price?.toString() ?? '');
  const [desc,       setDesc]       = useState(initial?.description  ?? '');
  const [imageUrl,   setImageUrl]   = useState(initial?.imageUrl     ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId  ?? categories[0]?.id ?? '');
  const [extras,     setExtras]     = useState(initial?.extras      ?? []);
  const [busy,       setBusy]       = useState(false);

  const addExtra    = () => setExtras([...extras, { name: '', price: 0 }]);
  const updateExtra = (index, field, value) => {
    const newExtras = [...extras];
    newExtras[index][field] = value;
    setExtras(newExtras);
  };
  const removeExtra = (index) => setExtras(extras.filter((_, i) => i !== index));

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (!name.trim())        return toast.error('Escribe el nombre del platillo');
    if (isNaN(p) || p < 0)  return toast.error('Ingresa un precio base válido');
    if (!categoryId)         return toast.error('Selecciona una categoría');

    const cleanExtras = extras.filter(ex => ex.name.trim() !== '');

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        price: p,
        description: desc.trim(),
        imageUrl: imageUrl.trim(),
        categoryId,
        extras: cleanExtras,
        available: initial?.id ? initial.available : true,
      };

      if (initial?.id) {
        await updateDoc(doc(db, 'menuItems', initial.id), payload);
        toast.success('Platillo actualizado');
      } else {
        await addDoc(collection(db, 'menuItems'), { ...payload, createdAt: serverTimestamp() });
        toast.success('Platillo creado');
      }
      onSave();
    } catch (err) { console.error(err); toast.error('Error al guardar'); }
    finally { setBusy(false); }
  };

  return createPortal(
    /* ── Overlay ── */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease',
        overflowY: 'auto',
      }}
    >
      {/* ── Panel ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '28px',
          padding: '36px',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          margin: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {initial?.id
              ? <Pencil size={20} color="var(--accent)" />
              : <UtensilsCrossed size={20} color="var(--accent)" />}
            {initial?.id ? 'Editar Platillo' : 'Nuevo Platillo'}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Categoría *
            </label>
            <select
              className="pos-input"
              style={{ background: 'var(--bg-primary)', cursor: 'pointer', padding: '12px 16px' }}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Nombre + Precio */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Nombre del Platillo *
              </label>
              <input
                className="pos-input"
                style={{ padding: '12px 16px', fontWeight: 600 }}
                placeholder="Ej: Hamburguesa Clásica"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Precio Base *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>$</span>
                <input
                  className="pos-input"
                  style={{ padding: '12px 16px 12px 28px', fontWeight: 700, color: 'var(--accent)' }}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              Descripción (Opcional)
            </label>
            <textarea
              className="pos-input resize-none"
              rows="2"
              style={{ padding: '12px 16px' }}
              placeholder="Ingredientes, preparación, etc..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* URL Imagen */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
              URL de la Imagen (Opcional)
            </label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {imageUrl
                  ? <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  : <ImageIcon size={16} color="var(--text-secondary)" />
                }
              </div>
              <input
                className="pos-input"
                style={{ flex: 1, padding: '12px 16px' }}
                placeholder="https://ejemplo.com/imagen.jpg"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Modificadores / Extras */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tag size={14} color="var(--accent)" />
                  Modificadores / Extras
                </h3>
                <p style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  Opciones extra para este platillo (Ej: Queso extra +$15)
                </p>
              </div>
              <button
                type="button"
                onClick={addExtra}
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
              >
                <Plus size={13} /> Agregar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {extras.length === 0 && (
                <div style={{
                  padding: '16px', borderRadius: '12px', textAlign: 'center',
                  border: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)',
                }}>
                  No hay extras configurados
                </div>
              )}
              {extras.map((extra, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex', gap: '12px', alignItems: 'center',
                    padding: '12px 16px', borderRadius: '12px',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <input
                    className="pos-input"
                    style={{ flex: 1, padding: '8px 12px', minWidth: '120px' }}
                    placeholder="Nombre (Ej: Doble carne)"
                    value={extra.name}
                    onChange={e => updateExtra(idx, 'name', e.target.value)}
                    required
                  />
                  <div style={{ position: 'relative', width: '110px', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>+$</span>
                    <input
                      type="number"
                      className="pos-input"
                      style={{ paddingLeft: '36px', padding: '8px 8px 8px 32px' }}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={extra.price}
                      onChange={e => updateExtra(idx, 'price', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtra(idx)}
                    style={{
                      minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)',
                      background: 'transparent', cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {busy ? <LoadingSpinner size="sm" /> : <SaveIcon />}
              {initial?.id ? 'Guardar Cambios del Platillo' : 'Crear Nuevo Platillo'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
}
