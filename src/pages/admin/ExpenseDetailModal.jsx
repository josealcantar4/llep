// src/pages/admin/ExpenseDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar un egreso específico.
// Altura controlada con Scroll interno y Botón de Acción Fijo en la Base.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, User, Clock, Hash, FileText, DollarSign,
  TrendingDown, ArrowLeft, X
} from 'lucide-react';

export default function ExpenseDetailModal({ isOpen, onClose, expense }) {
  // Cerrar con Escape y bloquear scroll del body
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { 
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = ''; 
    };
  }, [isOpen, onClose]);

  if (!isOpen || !expense) return null;

  const date = expense.createdAt?.toDate?.() ?? new Date();

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
      {/* ── Panel Maestro (Flexbox Vertical) ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', 
          flexDirection: 'column',
          maxHeight: '85vh', // Límite de altura para activar el scroll interno
          overflow: 'hidden' // Cortar las esquinas y contener el scroll
        }}
      >
        
        {/* ── HEADER FIJO SUPERIOR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 36px 20px 36px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingDown size={20} color="#ef4444" />
            Detalle de Egreso
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

        {/* ── ZONA DE SCROLL INTERNO ────────────────────────────────────── */}
        <div 
          className="custom-scrollbar"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '28px 36px' 
          }}
        >
          
          {/* HEADER INFO CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            {/* Tarjeta de Monto */}
            <div style={{
              display: 'flex', gap: '16px', alignItems: 'center',
              padding: '20px', borderRadius: '24px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <TrendingDown size={24} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                  Monto Salida
                </p>
                <p style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', lineHeight: 1, whiteSpace: 'nowrap' }}>
                  -${expense.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tarjeta de ID */}
            <div style={{
              display: 'flex', gap: '16px', alignItems: 'center',
              padding: '20px', borderRadius: '24px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <Hash size={24} />
              </div>
              <div style={{ minWidth: 0, width: '100%' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                  ID Egreso
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  #{expense.id?.slice(-8).toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* CONCEPT AREA */}
          <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.1)', color: 'var(--accent)' }}>
                <FileText size={18} />
              </div>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-secondary)' }}>
                Concepto del Egreso
              </p>
            </div>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: 1.5 }}>
              {expense.concept || 'Sin concepto registrado.'}
            </p>
          </div>

          {/* META INFO STRIP */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Calendar size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Fecha de Registro</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <Clock size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Hora de Registro</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right' }}>
                {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <User size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Registrado Por</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                {expense.registeredByName || 'Usuario Desconocido'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 8px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <DollarSign size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Vínculo a Turno</span>
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>
                {expense.shift ? `Corte ${expense.shift}` : 'N/A'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
}