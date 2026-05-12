// src/pages/CheckoutPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Pantalla de cobro / cierre de cuenta de una mesa.
// Soporta propinas, pago único y PAGO COMBINADO (Efectivo + Tarjeta + Transf).
// Calcula el cambio a regresar cuando hay efectivo involucrado.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
  ArrowLeft, Banknote, CreditCard, Smartphone,
  Receipt, CheckCircle, AlertCircle, Split
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  doc, getDoc, updateDoc, addDoc,
  collection, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import useAuthStore from '../store/useAuthStore.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import TicketPrint from '../components/print/TicketPrint.jsx';

/* ── Métodos de pago base ─────────────────────────────────────────── */
const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Efectivo',       Icon: Banknote,    color: '#10b981' },
  { id: 'card',     label: 'Tarjeta',        Icon: CreditCard,  color: '#3b82f6' },
  { id: 'transfer', label: 'Transferencia',  Icon: Smartphone,  color: '#8b5cf6' },
];

export default function CheckoutPage() {
  const { tableId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuthStore();
  const ticketRef   = useRef(null);

  const [table,         setTable]         = useState(null);
  const [items,         setItems]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [processing,    setProcessing]    = useState(false);

  // Propina y Total
  const [tipAmount,  setTipAmount]  = useState('');
  const [tipPreset,  setTipPreset]  = useState(null);

  // Estados de Pago
  const [isSplit, setSplit] = useState(false);
  const [method, setMethod] = useState('cash'); // Para pago único
  const [splitAmounts, setSplitAmounts] = useState({ cash: '', card: '', transfer: '' }); // Para pago combinado
  
  const [reference, setReference] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  // Ticket para imprimir
  const [completedOrder, setCompletedOrder] = useState(null);

  /* ── Cargar datos de la mesa ─────────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'tables', tableId));
        if (!snap.exists()) { navigate('/'); return; }
        const data = snap.data();
        setTable({ id: snap.id, ...data });
        setItems(data.items ?? []);
      } catch {
        toast.error('No se pudo cargar la mesa');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tableId, navigate]);

  /* ── Cálculos de Total ───────────────────────────────────────────────── */
  const subtotal = items.reduce((sum, it) => {
    const extrasTotal = (it.extras ?? []).reduce((s, e) => s + e.price, 0);
    return sum + (it.price + extrasTotal) * it.qty;
  }, 0);

  const tip = tipPreset != null ? subtotal * (tipPreset / 100) : parseFloat(tipAmount) || 0;
  const total = subtotal + tip;

  /* ── Cálculos de Pago y Cambio ───────────────────────────────────────── */
  const requiredCash     = isSplit ? (parseFloat(splitAmounts.cash) || 0)     : (method === 'cash' ? total : 0);
  const requiredCard     = isSplit ? (parseFloat(splitAmounts.card) || 0)     : (method === 'card' ? total : 0);
  const requiredTransfer = isSplit ? (parseFloat(splitAmounts.transfer) || 0) : (method === 'transfer' ? total : 0);

  const totalSplit = requiredCash + requiredCard + requiredTransfer;
  const isSplitValid = Math.abs(totalSplit - total) < 0.01; // Tolerancia de decimales

  const received = parseFloat(amountReceived) || 0;
  const change = received - requiredCash;

  const needsReference = requiredCard > 0 || requiredTransfer > 0;

  // Validación final del botón confirmar
  const isValid = items.length > 0 && 
                  (isSplit ? isSplitValid : true) && 
                  (!needsReference || reference.trim() !== '') && 
                  (requiredCash === 0 || received >= requiredCash);

  /* ── Manejadores ─────────────────────────────────────────────────────── */
  const handleTipPreset = (pct) => {
    setTipPreset((prev) => prev === pct ? null : pct);
    setTipAmount('');
  };

  const handleSplitChange = (field, val) => {
    setSplitAmounts(prev => ({ ...prev, [field]: val }));
  };

  const printTicket = () => {
    setTimeout(() => { window.print(); }, 300);
  };

  const handleConfirm = async () => {
    if (!isValid) return;

    setProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      const payments = {
        cash: requiredCash,
        card: requiredCard,
        transfer: requiredTransfer
      };

      const orderData = {
        tableId,
        tableName:    table.name,
        items,
        subtotal,
        tip,
        total,
        paymentType:   isSplit ? 'split' : 'single',
        payments, // Nueva estructura requerida
        reference:     reference.trim(),
        amountReceived: received,
        changeReturned: change > 0 ? change : 0,
        cashierId:     user.uid,
        cashierName:   user.displayName ?? user.email,
        createdAt:     serverTimestamp(),
        shift:         today,
      };

      // Guardar orden
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Cerrar mesa y limpiar
      await updateDoc(doc(db, 'tables', tableId), {
        status:   'available',
        items:    [],
        openedAt: null,
        openedBy: null,
      });

      // Ticket
      setCompletedOrder({ ...orderData, createdAt: { toDate: () => new Date() }, id: orderRef.id });

      toast.success('¡Pago registrado con éxito!');
      printTicket();
      setTimeout(() => navigate('/'), 2500);

    } catch (e) {
      console.error(e);
      toast.error('Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!table)  return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
              style={{ background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <button onClick={() => navigate(`/order/${tableId}`)} className="p-2 rounded-xl hover:bg-white/5">
          <ArrowLeft size={18} color="var(--text-secondary)" />
        </button>
        <div>
          <h1 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
            Cobrar — {table.name}
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-10">

        {/* ── Resumen de cuenta ────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={16} color="var(--accent)" />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Resumen</h2>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
              const lineTotal   = (item.price + extrasTotal) * item.qty;
              return (
                <div key={idx} className="flex justify-between items-start text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <span style={{ color: 'var(--text-primary)' }}>{item.qty}× {item.name}</span>
                    {(item.extras ?? []).map((ex, ei) => (
                      <div key={ei} className="text-xs ml-3" style={{ color: 'var(--accent)' }}>+ {ex.name} ${ex.price.toFixed(2)}</div>
                    ))}
                  </div>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>${lineTotal.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Propina ──────────────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Propina (Opcional)</h2>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[0, 10, 15, 20].map((pct) => (
              <button key={pct} onClick={() => pct === 0 ? (setTipPreset(null), setTipAmount('')) : handleTipPreset(pct)}
                className="py-2 rounded-xl text-sm font-bold transition-all border"
                style={{
                  background: ((pct===0 && !tipPreset && !tipAmount) || tipPreset===pct) ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)',
                  borderColor: ((pct===0 && !tipPreset && !tipAmount) || tipPreset===pct) ? 'var(--accent)' : 'transparent',
                  color: ((pct===0 && !tipPreset && !tipAmount) || tipPreset===pct) ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                {pct === 0 ? 'Nada' : `${pct}%`}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
            <input className="pos-input pl-7" type="number" min="0" step="5" placeholder="Ingresar monto manual"
                   value={tipAmount} onChange={(e) => { setTipAmount(e.target.value); setTipPreset(null); }} />
          </div>
        </section>

        {/* ── Método de Pago ───────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Distribución del Pago</h2>
          </div>

          {/* Toggle de Pago Combinado */}
          <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed mb-5 cursor-pointer transition-colors"
               style={{ borderColor: isSplit ? 'var(--accent)' : 'var(--border)', background: isSplit ? 'rgba(245,158,11,0.05)' : 'transparent' }}
               onClick={() => { setSplit(!isSplit); setSplitAmounts({cash:'', card:'', transfer:''}); }}>
            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSplit ? 'bg-amber-500' : 'bg-slate-700'}`}>
              {isSplit && <CheckCircle size={14} color="#0f172a" />}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: isSplit ? 'var(--accent)' : 'var(--text-primary)' }}>Pago Combinado (Dividir cuenta)</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Repartir el total entre efectivo y tarjetas.</p>
            </div>
          </div>

          {!isSplit ? (
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, Icon, color }) => (
                <button key={id} onClick={() => { setMethod(id); setReference(''); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                  style={{ borderColor: method === id ? color : 'var(--border)', background: method === id ? `${color}15` : 'var(--bg-elevated)' }}>
                  <Icon size={20} color={method === id ? color : 'var(--text-secondary)'} />
                  <span className="text-xs font-semibold" style={{ color: method === id ? color : 'var(--text-secondary)' }}>{label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--bg-elevated)' }}>
              <div className="flex items-center gap-3">
                <Banknote size={18} color="#10b981" />
                <span className="text-sm flex-1 font-semibold">Efectivo</span>
                <input type="number" className="pos-input text-right w-28 text-sm font-bold" placeholder="0.00" 
                       value={splitAmounts.cash} onChange={e => handleSplitChange('cash', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <CreditCard size={18} color="#3b82f6" />
                <span className="text-sm flex-1 font-semibold">Tarjeta</span>
                <input type="number" className="pos-input text-right w-28 text-sm font-bold" placeholder="0.00" 
                       value={splitAmounts.card} onChange={e => handleSplitChange('card', e.target.value)} />
              </div>
              <div className="flex items-center gap-3">
                <Smartphone size={18} color="#8b5cf6" />
                <span className="text-sm flex-1 font-semibold">Transferencia</span>
                <input type="number" className="pos-input text-right w-28 text-sm font-bold" placeholder="0.00" 
                       value={splitAmounts.transfer} onChange={e => handleSplitChange('transfer', e.target.value)} />
              </div>
              <div className="flex justify-between items-center pt-3 border-t mt-3" style={{ borderColor: 'var(--border)' }}>
                 <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                   Total asignado: ${totalSplit.toFixed(2)} / ${total.toFixed(2)}
                 </span>
                 <span className="text-xs font-black uppercase tracking-wide" style={{ color: isSplitValid ? '#10b981' : '#ef4444' }}>
                   {isSplitValid ? '✅ Cuadra Perfecto' : `Faltan: $${(total - totalSplit).toFixed(2)}`}
                 </span>
              </div>
            </div>
          )}

          {/* Referencia (Si hay tarjeta o transferencia) */}
          {needsReference && (
            <div className="mt-5 animate-slideUp">
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                <AlertCircle size={12} color="var(--accent)" /> Referencia de Pago *
              </label>
              <input className="pos-input" placeholder="Folio del voucher o CLABE..."
                     value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          )}
        </section>

        {/* ── Monto Recibido y Cambio (Solo si hay Efectivo) ───────────── */}
        {requiredCash > 0 && (
          <section className="animate-slideUp p-5 rounded-xl border-2" 
                   style={{ background: 'rgba(16,185,129,0.06)', borderColor: received >= requiredCash ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)' }}>
            <label className="block text-sm font-bold mb-3" style={{ color: '#10b981' }}>
              Monto entregado por el cliente (Efectivo) *
            </label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black" style={{ color: '#10b981' }}>$</span>
              <input 
                className="pos-input pl-9 py-4 font-black text-2xl text-white" 
                style={{ background: 'var(--bg-primary)', borderColor: 'rgba(16,185,129,0.3)' }}
                type="number" min={requiredCash} step="0.5" 
                value={amountReceived} onChange={e => setAmountReceived(e.target.value)} 
                placeholder="0.00" 
              />
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20">
              <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Cambio a entregar:</span>
              <span className="text-4xl font-black" style={{ color: change >= 0 ? '#10b981' : '#ef4444' }}>
                ${change >= 0 ? change.toFixed(2) : '0.00'}
              </span>
            </div>
            {change < 0 && (
              <p className="text-xs text-right mt-1 font-bold text-red-500">Falta cobrar ${Math.abs(change).toFixed(2)}</p>
            )}
          </section>
        )}

        {/* ── Total Final y Botón ──────────────────────────────────────── */}
        <section className="pos-card p-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>TOTAL A COBRAR</span>
            <span className="font-black text-3xl" style={{ color: 'var(--accent)' }}>${total.toFixed(2)}</span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isValid || processing}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 transition-all"
            style={{ opacity: (!isValid || processing) ? 0.5 : 1, filter: (!isValid || processing) ? 'grayscale(100%)' : 'none' }}
          >
            {processing ? <LoadingSpinner size="sm" /> : <><CheckCircle size={22} /> Confirmar Transacción</>}
          </button>
        </section>

      </div>

      {/* ── Portal de ticket ───────────────────────────────────────────── */}
      {completedOrder && ReactDOM.createPortal(
        <TicketPrint ref={ticketRef} order={completedOrder} />,
        document.getElementById('ticket-print-root')
      )}
    </div>
  );
}
