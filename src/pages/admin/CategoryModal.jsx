// src/pages/admin/CategoryModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal para crear o editar una Categoría del menú.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore';
import { Plus, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
  );
}

export default function CategoryModal({ initial, onSave, onClose }) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🍽️');
  const [busy,  setBusy]  = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Escribe el nombre de la categoría');
    setBusy(true);
    try {
      if (initial?.id) {
        await updateDoc(doc(db, 'menuCategories', initial.id), { name: name.trim(), emoji });
        toast.success('Categoría actualizada');
      } else {
        await addDoc(collection(db, 'menuCategories'), {
          name: name.trim(), emoji, order: Date.now(), createdAt: serverTimestamp(),
        });
        toast.success('Categoría creada');
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
          maxWidth: '480px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {initial?.id
              ? <Pencil size={20} color="var(--accent)" />
              : <Plus size={20} color="var(--accent)" />}
            {initial?.id ? 'Editar Categoría' : 'Nueva Categoría'}
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
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Emoji */}
            <div style={{ width: '96px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Emoji
              </label>
              <input
                className="pos-input"
                style={{ textAlign: 'center', fontSize: '1.5rem', padding: '12px 8px' }}
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={2}
              />
            </div>
            {/* Nombre */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Nombre *
              </label>
              <input
                className="pos-input"
                style={{ padding: '12px 16px', fontWeight: 600 }}
                placeholder="Ej: Entradas, Bebidas..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Divider + Submit */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <button
              type="submit"
              disabled={busy}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700 }}
            >
              {busy ? <LoadingSpinner size="sm" /> : <SaveIcon />}
              {initial?.id ? 'Guardar Cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
