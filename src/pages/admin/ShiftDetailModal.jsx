// src/pages/admin/ShiftDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar un corte de caja pasado.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar, User, Scissors, TrendingUp, TrendingDown,
  Wallet, ArrowLeft, X
} from 'lucide-react';

export default function ShiftDetailModal({ isOpen, onClose, shift }) {
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

  if (!isOpen || !shift) return null;

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

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
            <Scissors size={20} color="var(--accent)" />
            Detalle de Corte
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

        {/* Contenido principal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Fecha y Efectivo en Cajón */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '16px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ color: 'var(--accent)', display: 'flex' }}>
                <Calendar size={24} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Fecha del Corte
                </label>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {shift.date}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', gap: '12px', alignItems: 'center',
              padding: '16px', borderRadius: '12px',
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ color: '#10b981', display: 'flex' }}>
                <Wallet size={24} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                  Efectivo en Cajón
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>
                  {fmt(shift.cashInDrawer)}
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de Ingresos */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={16} color="var(--accent)" />
              Resumen de Ingresos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Total Ventas
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {fmt(shift.totalSales)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Efectivo
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                  {fmt(shift.cashSales)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Tarjeta
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>
                  {fmt(shift.cardSales)}
                </div>
              </div>
            </div>
          </div>

          {/* Egresos y Salidas */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingDown size={16} color="#ef4444" />
              Egresos y Salidas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Total Egresos
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>
                  -{fmt(shift.totalExpenses)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Órdenes Procesadas
                </label>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {shift.orderCount || 0} cuentas
                </div>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '12px',
              padding: '16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Realizado por</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="var(--accent)" /> {shift.closedByName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID del Sistema</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>#{shift.id?.toUpperCase()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}