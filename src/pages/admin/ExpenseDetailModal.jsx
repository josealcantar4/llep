// src/pages/admin/ExpenseDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar un egreso específico.
// Altura controlada con Scroll interno y Botón de Acción Fijo en la Base.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  Calendar, User, Clock, Hash, FileText, DollarSign,
  TrendingDown, ArrowLeft
} from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';

export default function ExpenseDetailModal({ isOpen, onClose, expense }) {
  if (!expense) return null;

  const date = expense.createdAt?.toDate?.() ?? new Date();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Egreso"
      maxWidth="max-w-xl"
      showClose={false}
    >
      {/* Contenedor Maestro: Limitamos su altura máxima al 75% del alto de la pantalla (75vh)
        y lo configuramos como un Flexbox vertical rígido para separar el Scroll del Botón Fijo.
      */}
      <div
        className="flex flex-col animate-fadeIn"
        style={{
          maxHeight: '80vh',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >

        {/* ── ZONA CON SCROLL INDEPENDIENTE ───────────────────────────────── */}
        <div
          className="flex-1 custom-scrollbar"
          style={{
            overflowY: 'auto',          /* 👈 Habilita el scroll vertical solo aquí */
            padding: '32px 40px 16px 40px', /* Bajamos el padding inferior para no separar de más */
          }}
        >
          {/* ── HEADER INFO CARDS ─────────────────────────────────────────── */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2"
            style={{ gap: '16px', marginBottom: '32px' }}
          >
            {/* Tarjeta de Monto */}
            <div
              className="bg-white/5 border border-white/5 flex items-center"
              style={{ padding: '20px', borderRadius: '24px', gap: '16px' }}
            >
              <div
                className="bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner"
                style={{ width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0 }}
              >
                <TrendingDown size={24} style={{ flexShrink: 0 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p
                  className="font-black uppercase text-white/40"
                  style={{ fontSize: '10px', letterSpacing: '0.2em', marginBottom: '4px', whiteSpace: 'nowrap' }}
                >
                  Monto Salida
                </p>
                <p
                  className="font-black text-red-500"
                  style={{ fontSize: '24px', lineHeight: '1', whiteSpace: 'nowrap' }}
                >
                  -${expense.amount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tarjeta de ID */}
            <div
              className="bg-white/5 border border-white/5 flex items-center"
              style={{ padding: '20px', borderRadius: '24px', gap: '16px' }}
            >
              <div
                className="bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner"
                style={{ width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0 }}
              >
                <Hash size={24} style={{ flexShrink: 0 }} />
              </div>
              <div style={{ minWidth: 0, width: '100%' }}>
                <p
                  className="font-black uppercase text-white/40"
                  style={{ fontSize: '10px', letterSpacing: '0.2em', marginBottom: '4px', whiteSpace: 'nowrap' }}
                >
                  ID Egreso
                </p>
                <p
                  className="font-black text-white"
                  style={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  #{expense.id?.slice(-8).toUpperCase() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* ── CONCEPT AREA ─────────────────────────────────────────────── */}
          <div
            className="bg-white/[0.03] border border-white/5"
            style={{ padding: '28px', borderRadius: '28px', marginBottom: '36px' }}
          >
            <div className="flex items-center" style={{ gap: '12px', marginBottom: '16px' }}>
              <div
                className="bg-amber-500/10 flex items-center justify-center text-amber-500"
                style={{ width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }}
              >
                <FileText size={18} style={{ flexShrink: 0 }} />
              </div>
              <p
                className="font-black uppercase text-white/40"
                style={{ fontSize: '11px', letterSpacing: '0.2em' }}
              >
                Concepto del Egreso
              </p>
            </div>
            <p
              className="font-bold text-white leading-relaxed"
              style={{ fontSize: '18px', wordBreak: 'break-word' }}
            >
              {expense.concept || 'Sin concepto registrado.'}
            </p>
          </div>

          {/* ── META INFO STRIP ───────────────────────────────────────────── */}
          <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

            <div className="flex items-center justify-between font-bold border-b border-white/5" style={{ padding: '16px 0' }}>
              <div className="flex items-center text-white/40" style={{ gap: '12px' }}>
                <Calendar size={18} className="text-amber-500" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Fecha de Registro</span>
              </div>
              <span className="text-white text-right" style={{ fontSize: '14px', marginLeft: '16px' }}>
                {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center justify-between font-bold border-b border-white/5" style={{ padding: '16px 0' }}>
              <div className="flex items-center text-white/40" style={{ gap: '12px' }}>
                <Clock size={18} className="text-amber-500" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Hora de Registro</span>
              </div>
              <span className="text-white text-right" style={{ fontSize: '14px', marginLeft: '16px' }}>
                {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center justify-between font-bold border-b border-white/5" style={{ padding: '16px 0' }}>
              <div className="flex items-center text-white/40" style={{ gap: '12px' }}>
                <User size={18} className="text-amber-500" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Registrado Por</span>
              </div>
              <span className="text-white text-right" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '16px', maxWidth: '150px' }}>
                {expense.registeredByName || 'Usuario Desconocido'}
              </span>
            </div>

            <div className="flex items-center justify-between font-bold border-b border-white/5" style={{ padding: '16px 0' }}>
              <div className="flex items-center text-white/40" style={{ gap: '12px' }}>
                <DollarSign size={18} className="text-amber-500" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>Vínculo a Turno</span>
              </div>
              <span className="text-white/60 text-right" style={{ fontSize: '14px', marginLeft: '16px' }}>
                {expense.shift ? `Shift ${expense.shift}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* ── FIJO ABAJO: BOTÓN DE ACCIÓN INDEPENDIENTE ───────────────────── */}
        <div
          className=" relative"
          style={{
            padding: '10px 10px',
          }}

        >
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center bg-white/5 border border-white/10 text-white font-black uppercase hover:bg-white/10 transition-all active:scale-95"
            style={{
              padding: '18px',
              borderRadius: '20px',
              gap: '12px',
              fontSize: '12px',
              letterSpacing: '0.3em'
            }}
          >
            <ArrowLeft size={18} />
            <span>Cerrar Detalle</span>
          </button>
        </div>

      </div>
    </Modal>
  );
}