// src/pages/admin/OrderDetailModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Modal detallado para visualizar una orden específica desde el Dashboard.
// Estética Premium unificada con el resto del sistema LLEP POS.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  Printer, Calendar, User, Clock, ShoppingBag, CreditCard,
  Receipt, Hash, Layers
} from 'lucide-react';
import Modal from '../../components/ui/Modal.jsx';

export default function OrderDetailModal({ isOpen, onClose, order, onReprint }) {
  if (!order) return null;

  const date = order.createdAt?.toDate?.() ?? new Date();
  const methodLabels = {
    cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', split: 'Combinado'
  };
  const methodKey = order.paymentType === 'split' ? 'split' : order.paymentMethod;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Venta"
      maxWidth="max-w-2xl"
      showClose={false}
    >
      <div className="flex flex-col h-[85vh] max-h-[900px] animate-fadeIn p-4 lg:p-8">

        {/* ── HEADER INFO CARDS ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6 mb-10" style={{ padding: '10px' }}>
          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
              <Hash size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Folio de Venta</p>
              <p className="text-lg font-black text-white">#{order.id?.slice(-6).toUpperCase()}</p>
            </div>
          </div>

          <div className="p-5 rounded-[24px] bg-white/5 border border-white/5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
              <Layers size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mb-1">Mesa / Área</p>
              <p className="text-lg font-black text-white">{order.tableName}</p>
            </div>
          </div>
        </div>

        {/* ── META INFO STRIP ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-8 px-4 mb-10 text-[11px] font-bold uppercase tracking-[0.25em] opacity-40 border-b border-white/10 pb-8" style={{ padding: '5px' }}>
          <div className="flex items-center gap-3 hover:opacity-100 transition-opacity">
            <Calendar size={15} className="text-amber-500" />
            {date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-3 hover:opacity-100 transition-opacity">
            <Clock size={15} className="text-amber-500" />
            {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center gap-3 hover:opacity-100 transition-opacity">
            <User size={15} className="text-amber-500" />
            {order.cashierName}
          </div>
        </div>

        {/* ── SCROLLABLE ITEMS AREA ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar-modal" style={{ padding: '5px' }}>
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">
              Artículos del Cliente
            </p>
          </div>

          <div className="space-y-5 mb-6" style={{ padding: '5px' }}>
            {order.items.map((item, idx) => {
              const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
              const lineTotal = (item.price + extrasTotal) * item.qty;

              return (
                <div key={idx} className="p-6 rounded-[24px] bg-white/[0.03] border border-white/[0.05] transition-all hover:bg-white/[0.06] hover:translate-x-1 group" style={{ padding: '10px', marginBottom: '10px' }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1" >
                      <div className="flex items-center gap-5" >
                        <span className="flex items-center justify-center min-w-[32px] h-8 rounded-xl bg-amber-500/20 text-[11px] font-black text-amber-500 border border-amber-500/20 shadow-lg">
                          {item.qty}
                        </span>
                        <p className="font-bold text-lg text-white tracking-tight group-hover:text-amber-200 transition-colors">{item.name}</p>
                      </div>

                      {(item.extras ?? []).length > 0 && (
                        <div className="ml-12 mt-4 space-y-2 border-l-2 border-amber-500/10 pl-5" style={{ padding: '10px' }}>
                          {(item.extras ?? []).map((ex, ei) => (
                            <div key={ei} className="text-[12px] flex justify-between text-amber-400/50 font-bold tracking-wide" >
                              <span>+ {ex.name}</span>
                              <span className="opacity-80">${ex.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <div className="ml-12 mt-5 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 border-dashed" style={{ padding: '10px' }}>
                          <p className="text-[12px] text-blue-400/70 italic leading-relaxed">
                            <span className="font-black not-italic mr-2 uppercase text-[9px] tracking-widest text-blue-300">Nota Especial:</span>
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-8">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Precio</p>
                      <p className="font-black text-lg text-white">
                        ${lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TOTALS & PAYMENT SECTION ───────────────────────────────────── */}
        <div className="mt-6 pt-10 border-t border-white/10" style={{ padding: '5px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10" style={{ padding: '5px' }}>
            {/* Totales */}
            <div className="space-y-4 p-6 rounded-[28px] bg-white/[0.03] border border-white/5 flex flex-col justify-center" style={{ padding: '10px' }}>
              <div className="flex justify-between text-[11px] font-black opacity-30 uppercase tracking-[0.2em]">
                <span>Subtotal</span>
                <span className="text-white">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                  <span>Propina</span>
                  <span>${order.tip.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-5 mt-2 border-t border-white/5 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-2">Total Final</span>
                  <span className="text-4xl font-black text-amber-500 leading-none drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Información de Pago */}
            <div className="p-6 rounded-[28px] bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 flex flex-col justify-center shadow-xl shadow-amber-500/5" style={{ padding: '10px' }}>
              <div className="flex items-center gap-4 mb-4" >
                <div className="w-10 h-10 rounded-[14px] bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <CreditCard size={18} className="text-[#0f172a]" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-500">Transacción</p>
              </div>
              <p className="text-2xl font-black text-white mb-4" style={{ textAlign: 'center' }}>
                {methodLabels[methodKey] || 'N/A'}
              </p>
              {order.paymentType === 'split' && (
                <div className="grid grid-cols-1 gap-3 p-4 rounded-2xl bg-black/30 border border-white/10">
                  {order.payments?.cash > 0 && (
                    <div className="flex justify-between text-[11px] font-bold opacity-50 uppercase tracking-widest">
                      <span>Efectivo:</span> <span>${order.payments.cash.toFixed(2)}</span>
                    </div>
                  )}
                  {order.payments?.card > 0 && (
                    <div className="flex justify-between text-[11px] font-bold opacity-50 uppercase tracking-widest">
                      <span>Tarjeta:</span> <span>${order.payments.card.toFixed(2)}</span>
                    </div>
                  )}
                  {order.payments?.transfer > 0 && (
                    <div className="flex justify-between text-[11px] font-bold opacity-50 uppercase tracking-widest">
                      <span>Transf:</span> <span>${order.payments.transfer.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción con más aire */}
          <div className="flex gap-6">
            <button
              onClick={onClose}
              className="flex-1 py-5 flex items-center justify-center gap-3 rounded-[22px] border border-white/10 text-white/40 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-lg"
            >
              Cerrar
            </button>
            <button
              onClick={() => onReprint(order)}
              className="flex-[2] btn-primary py-5 flex items-center justify-center gap-5 rounded-[22px] shadow-2xl shadow-amber-500/30 active:scale-95 transition-all group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12" />
              <Printer size={24} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform relative z-10" />
              <span className="font-black uppercase tracking-[0.3em] text-[11px] relative z-10">Reimprimir Ticket</span>
            </button>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .custom-scrollbar-modal::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar-modal::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.01);
            border-radius: 20px;
          }
          .custom-scrollbar-modal::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }
          .custom-scrollbar-modal::-webkit-scrollbar-thumb:hover {
            background: #f59e0b;
            border-color: rgba(255,255,255,0.05);
          }
        ` }} />
      </div>
    </Modal>
  );
}
