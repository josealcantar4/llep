// src/pages/CheckoutPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Pantalla de cobro / cierre de cuenta de una mesa.
// Permite seleccionar método de pago, ingresar referencia (tarjeta/transferencia),
// registrar propina y finalizar la venta guardando en Firestore.
// Al confirmar, imprime el ticket automáticamente.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
  ArrowLeft, Banknote, CreditCard, Smartphone,
  Receipt, CheckCircle, AlertCircle,
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

/* ── Métodos de pago disponibles ─────────────────────────────────────────── */
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

  // Pago
  const [method,     setMethod]     = useState('cash');
  const [reference,  setReference]  = useState('');
  const [tipAmount,  setTipAmount]  = useState('');
  const [tipPreset,  setTipPreset]  = useState(null); // 10 | 15 | 20 | null

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

  /* ── Calcular totales ────────────────────────────────────────────────── */
  const subtotal = items.reduce((sum, it) => {
    const extrasTotal = (it.extras ?? []).reduce((s, e) => s + e.price, 0);
    return sum + (it.price + extrasTotal) * it.qty;
  }, 0);

  const tip = tipPreset != null
    ? subtotal * (tipPreset / 100)
    : parseFloat(tipAmount) || 0;

  const total = subtotal + tip;

  /* ── Manejar presets de propina ──────────────────────────────────────── */
  const handleTipPreset = (pct) => {
    setTipPreset((prev) => prev === pct ? null : pct);
    setTipAmount('');
  };

  /* ── Validación ──────────────────────────────────────────────────────── */
  const needsReference = method === 'card' || method === 'transfer';
  const isValid = items.length > 0 && (!needsReference || reference.trim() !== '');

  /* ── Imprimir ticket ─────────────────────────────────────────────────── */
  const printTicket = () => {
    setTimeout(() => {
      window.print();
    }, 300);
  };

  /* ── Confirmar pago ──────────────────────────────────────────────────── */
  const handleConfirm = async () => {
    if (!isValid) {
      if (needsReference && !reference.trim())
        toast.error('El número de referencia es obligatorio');
      return;
    }

    setProcessing(true);
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      const orderData = {
        tableId,
        tableName:    table.name,
        items,
        subtotal,
        tip,
        total,
        paymentMethod: method,
        reference:     reference.trim(),
        cashierId:     user.uid,
        cashierName:   user.name ?? user.email,
        createdAt:     serverTimestamp(),
        shift:         today,
      };

      // Guardar orden en colección `orders`
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Cerrar mesa y limpiar
      await updateDoc(doc(db, 'tables', tableId), {
        status:   'closed',
        items:    [],
        openedAt: null,
        openedBy: null,
      });

      // Guardar orden para el ticket (con fecha local para impresión inmediata)
      setCompletedOrder({ ...orderData, createdAt: { toDate: () => new Date() }, id: orderRef.id });

      toast.success('¡Pago registrado! 🎉');

      // Imprimir ticket
      printTicket();

      // Regresar a mesas después de un momento
      setTimeout(() => navigate('/'), 2500);

    } catch (e) {
      console.error(e);
      toast.error('Error al registrar el pago');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!table)  return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
        style={{
          background: 'rgba(15,23,42,0.98)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--border)',
        }}
      >
        <button onClick={() => navigate(`/order/${tableId}`)} className="p-2 rounded-xl hover:bg-white/5">
          <ArrowLeft size={18} color="var(--text-secondary)" />
        </button>
        <div>
          <h1 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>
            Cobrar — {table.name}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Selecciona el método de pago
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5 pb-10">

        {/* ── Resumen de ítems ─────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Receipt size={16} color="var(--accent)" />
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Resumen de cuenta
            </h2>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => {
              const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
              const lineTotal   = (item.price + extrasTotal) * item.qty;
              return (
                <div key={idx} className="flex justify-between items-start text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <span style={{ color: 'var(--text-primary)' }}>
                      {item.qty}× {item.name}
                    </span>
                    {(item.extras ?? []).map((ex, ei) => (
                      <div key={ei} className="text-xs ml-3" style={{ color: 'var(--accent)' }}>
                        + {ex.name} ${ex.price.toFixed(2)}
                      </div>
                    ))}
                    {item.notes && (
                      <div className="text-xs ml-3 italic" style={{ color: 'var(--text-secondary)' }}>
                        {item.notes}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Método de pago ───────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Método de pago
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map(({ id, label, Icon, color }) => (
              <button
                key={id}
                id={`pay-${id}`}
                onClick={() => { setMethod(id); setReference(''); }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: method === id ? color : 'var(--border)',
                  background:  method === id ? `${color}15` : 'var(--bg-elevated)',
                }}
              >
                <Icon size={20} color={method === id ? color : 'var(--text-secondary)'} />
                <span className="text-xs font-semibold"
                      style={{ color: method === id ? color : 'var(--text-secondary)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Referencia obligatoria para tarjeta/transferencia */}
          {needsReference && (
            <div className="mt-4">
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                <AlertCircle size={12} color="var(--accent)" />
                Número de referencia / Folio de voucher *
              </label>
              <input
                id="payment-reference"
                className="pos-input"
                placeholder={method === 'card' ? 'Folio del voucher...' : 'CLABE / folio de transferencia...'}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                autoFocus
              />
              {!reference.trim() && (
                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                  Este campo es obligatorio para {method === 'card' ? 'tarjeta' : 'transferencia'}
                </p>
              )}
            </div>
          )}
        </section>

        {/* ── Propina ──────────────────────────────────────────────────── */}
        <section className="pos-card p-4">
          <h2 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Propina (opcional)
          </h2>
          {/* Presets rápidos */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[0, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                id={`tip-${pct}`}
                onClick={() => pct === 0 ? (setTipPreset(null), setTipAmount('')) : handleTipPreset(pct)}
                className="py-2 rounded-xl text-sm font-bold transition-all border"
                style={{
                  background: (pct === 0 && tipPreset == null && !tipAmount)
                    || tipPreset === pct
                    ? 'rgba(245,158,11,0.15)'
                    : 'var(--bg-elevated)',
                  borderColor: (pct === 0 && tipPreset == null && !tipAmount)
                    || tipPreset === pct
                    ? 'var(--accent)'
                    : 'transparent',
                  color: (pct === 0 && tipPreset == null && !tipAmount)
                    || tipPreset === pct
                    ? 'var(--accent)'
                    : 'var(--text-secondary)',
                }}
              >
                {pct === 0 ? 'Sin propina' : `${pct}%`}
              </button>
            ))}
          </div>
          {/* Monto manual */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--text-secondary)' }}>$</span>
            <input
              id="tip-manual"
              className="pos-input pl-7"
              type="number"
              min="0"
              step="5"
              placeholder="O ingresa monto manual"
              value={tipAmount}
              onChange={(e) => { setTipAmount(e.target.value); setTipPreset(null); }}
            />
          </div>
          {tip > 0 && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--accent)' }}>
              Propina: ${tip.toFixed(2)}
            </p>
          )}
        </section>

        {/* ── Totales ──────────────────────────────────────────────────── */}
        <section className="pos-card p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>Propina</span>
              <span style={{ color: 'var(--accent)' }}>+${tip.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t"
               style={{ borderColor: 'var(--border)' }}>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>TOTAL</span>
            <span className="font-black text-2xl" style={{ color: 'var(--accent)' }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </section>

        {/* ── Botón confirmar ──────────────────────────────────────────── */}
        <button
          id="btn-confirm-payment"
          onClick={handleConfirm}
          disabled={!isValid || processing}
          className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          style={{ opacity: (!isValid || processing) ? 0.6 : 1 }}
        >
          {processing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <CheckCircle size={20} />
              Confirmar pago · ${total.toFixed(2)}
            </>
          )}
        </button>
      </div>

      {/* ── Portal de ticket para impresión ──────────────────────────────── */}
      {completedOrder && ReactDOM.createPortal(
        <TicketPrint ref={ticketRef} order={completedOrder} />,
        document.getElementById('ticket-print-root')
      )}
    </div>
  );
}
