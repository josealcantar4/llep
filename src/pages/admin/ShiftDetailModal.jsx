// src/pages/admin/ShiftDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar un corte de caja pasado.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { 
  Calendar, User, Scissors, TrendingUp, TrendingDown, 
  Wallet, CheckCircle, ArrowLeft, Hash 
} from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';

export default function ShiftDetailModal({ isOpen, onClose, shift }) {
  if (!shift) return null;

  const fmt = (n) => `$${(n || 0).toFixed(2)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Corte"
      maxWidth="max-w-2xl"
      showClose={false}
    >
      <div className="flex flex-col animate-fadeIn p-6 lg:p-10">
        
        {/* ── HEADER CARDS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
           <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">Fecha del Corte</p>
              <p className="text-lg font-black text-white">{shift.date}</p>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-0.5">Efectivo en Cajón</p>
              <p className="text-lg font-black text-emerald-500">{fmt(shift.cashInDrawer)}</p>
            </div>
          </div>
        </div>

        {/* ── DESGLOSE FINANCIERO ───────────────────────────────────────── */}
        <div className="space-y-4 mb-8">
          <div className="pos-card p-6 border-l-4 border-l-amber-500 bg-white/[0.02]">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-amber-500" /> Resumen de Ingresos
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Total Ventas</p>
                <p className="font-black text-xl text-white">{fmt(shift.totalSales)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Efectivo</p>
                <p className="font-black text-xl text-emerald-500">{fmt(shift.cashSales)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Tarjeta</p>
                <p className="font-black text-xl text-blue-500">{fmt(shift.cardSales)}</p>
              </div>
            </div>
          </div>

          <div className="pos-card p-6 border-l-4 border-l-red-500 bg-white/[0.02]">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
              <TrendingDown size={14} className="text-red-500" /> Egresos y Salidas
            </h3>
            <div className="flex justify-between items-center">
               <div>
                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Total Egresos</p>
                <p className="font-black text-xl text-red-500">-{fmt(shift.totalExpenses)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-white/20 uppercase mb-1">Órdenes Procesadas</p>
                <p className="font-black text-xl text-white">{shift.orderCount || 0} cuentas</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── META INFO ────────────────────────────────────────────────── */}
        <div className="p-5 rounded-[24px] bg-black/20 border border-white/5 space-y-3 mb-10">
           <div className="flex justify-between text-xs font-bold">
             <span className="text-white/30 uppercase tracking-widest">Realizado por</span>
             <span className="text-white flex items-center gap-2">
               <User size={14} className="text-amber-500" /> {shift.closedByName}
             </span>
           </div>
           <div className="flex justify-between text-xs font-bold pt-3 border-t border-white/5">
             <span className="text-white/30 uppercase tracking-widest">ID del Sistema</span>
             <span className="text-white/60 font-mono">#{shift.id?.toUpperCase()}</span>
           </div>
        </div>

        {/* ── ACTIONS ───────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="w-full py-5 flex items-center justify-center gap-3 rounded-[22px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[11px] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
        >
          <ArrowLeft size={18} />
          Volver al Historial
        </button>

      </div>
    </Modal>
  );
}
