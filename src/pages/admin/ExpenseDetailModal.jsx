// src/pages/admin/ExpenseDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar un egreso específico.
// Estética Premium unificada con el resto del sistema LLEP POS.
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
      <div className="flex flex-col animate-fadeIn p-6 lg:p-10">

        {/* ── HEADER INFO CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shadow-inner">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">Monto Salida</p>
              <p className="text-xl font-black text-red-500">-${expense.amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
              <Hash size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">ID Egreso</p>
              <p className="text-sm font-black text-white truncate w-24">#{expense.id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* ── CONCEPT AREA ─────────────────────────────────────────────── */}
        <div className="p-6 rounded-[28px] bg-white/[0.03] border border-white/5 mb-8">
           <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <FileText size={16} />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40">Concepto del Egreso</p>
           </div>
           <p className="text-lg font-bold text-white leading-relaxed">
             {expense.concept}
           </p>
        </div>

        {/* ── META INFO STRIP ───────────────────────────────────────────── */}
        <div className="space-y-4 px-2 mb-10">
          <div className="flex items-center justify-between text-[12px] font-bold py-3 border-b border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <Calendar size={16} className="text-amber-500" />
              <span>Fecha de Registro</span>
            </div>
            <span className="text-white">
              {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center justify-between text-[12px] font-bold py-3 border-b border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <Clock size={16} className="text-amber-500" />
              <span>Hora de Registro</span>
            </div>
            <span className="text-white">
              {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center justify-between text-[12px] font-bold py-3 border-b border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <User size={16} className="text-amber-500" />
              <span>Registrado Por</span>
            </div>
            <span className="text-white">
              {expense.registeredByName}
            </span>
          </div>

          <div className="flex items-center justify-between text-[12px] font-bold py-3 border-b border-white/5">
            <div className="flex items-center gap-3 text-white/40">
              <DollarSign size={16} className="text-amber-500" />
              <span>Vínculo a Turno</span>
            </div>
            <span className="text-white/60">
              Shift {expense.shift}
            </span>
          </div>
        </div>

        {/* ── ACTIONS ───────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="w-full py-5 flex items-center justify-center gap-3 rounded-[22px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
          <ArrowLeft size={18} />
          Cerrar Detalle
        </button>

      </div>
    </Modal>
  );
}
