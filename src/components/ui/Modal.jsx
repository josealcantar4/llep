// src/components/ui/Modal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal reutilizable con glassmorphism y cierre por Escape / click fuera.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * @param {boolean}  isOpen    - Controla visibilidad
 * @param {Function} onClose   - Callback para cerrar
 * @param {string}   title     - Título del modal
 * @param {string}   maxWidth  - Tailwind max-w-* class (default 'max-w-md')
 * @param {ReactNode} children
 */
export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md', showClose = true }) {
  // Cerrar con tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`glass rounded-2xl w-full ${maxWidth} mx-4 animate-slideUp shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(245,158,11,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}>
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
