// src/pages/CheckoutPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
  ArrowLeft, Banknote, CreditCard, Smartphone,
  Receipt, CheckCircle, AlertCircle
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

const PAYMENT_METHODS = [
  { id: 'cash',     label: 'Efectivo',      Icon: Banknote,    color: '#10b981' },
  { id: 'card',     label: 'Tarjeta',       Icon: CreditCard,  color: '#3b82f6' },
  { id: 'transfer', label: 'Transferencia', Icon: Smartphone,  color: '#8b5cf6' },
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
  const [tipAmount,     setTipAmount]     = useState('');
  const [tipPreset,     setTipPreset]     = useState(null);
  const [isSplit,       setSplit]         = useState(false);
  const [method,        setMethod]        = useState('cash');
  const [splitAmounts,  setSplitAmounts]  = useState({ cash: '', card: '', transfer: '' });
  const [reference,     setReference]     = useState('');
  const [amountReceived,setAmountReceived]= useState('');
  const [completedOrder,setCompletedOrder]= useState(null);

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

  const subtotal = items.reduce((sum, it) => {
    const extrasTotal = (it.extras ?? []).reduce((s, e) => s + e.price, 0);
    return sum + (it.price + extrasTotal) * it.qty;
  }, 0);

  const tip   = tipPreset != null ? subtotal * (tipPreset / 100) : parseFloat(tipAmount) || 0;
  const total = subtotal + tip;

  const requiredCash     = isSplit ? (parseFloat(splitAmounts.cash) || 0)     : (method === 'cash'     ? total : 0);
  const requiredCard     = isSplit ? (parseFloat(splitAmounts.card) || 0)     : (method === 'card'     ? total : 0);
  const requiredTransfer = isSplit ? (parseFloat(splitAmounts.transfer) || 0) : (method === 'transfer' ? total : 0);

  const totalSplit      = requiredCash + requiredCard + requiredTransfer;
  const isSplitValid    = Math.abs(totalSplit - total) < 0.01;
  const splitDifference = total - totalSplit;
  const received        = parseFloat(amountReceived) || 0;
  const change          = received - requiredCash;
  const needsReference  = requiredCard > 0 || requiredTransfer > 0;

  let validationMessage = 'Confirmar Transacción';
  let isValid = true;

  if (items.length === 0) {
    isValid = false; validationMessage = 'La cuenta está vacía';
  } else if (isSplit && !isSplitValid) {
    isValid = false;
    validationMessage = splitDifference > 0
      ? `Faltan $${splitDifference.toFixed(2)} por asignar`
      : `Exceso de $${Math.abs(splitDifference).toFixed(2)}`;
  } else if (needsReference && reference.trim() === '') {
    isValid = false; validationMessage = 'Falta referencia de pago';
  } else if (requiredCash > 0 && received < requiredCash) {
    isValid = false; validationMessage = `Falta efectivo: $${(requiredCash - received).toFixed(2)}`;
  }

  const getQuickCashSuggestions = (amount) => {
    if (amount <= 0) return [];
    const ceil50  = Math.ceil(amount / 50)  * 50;
    const ceil100 = Math.ceil(amount / 100) * 100;
    const ceil200 = Math.ceil(amount / 200) * 200;
    const ceil500 = Math.ceil(amount / 500) * 500;
    const s = [];
    if (amount !== ceil50)  s.push(ceil50);
    if (amount !== ceil100 && !s.includes(ceil100)) s.push(ceil100);
    if (amount !== ceil200 && !s.includes(ceil200)) s.push(ceil200);
    if (amount !== ceil500 && !s.includes(ceil500)) s.push(ceil500);
    return [amount, ...s].slice(0, 4);
  };

  const handleTipPreset = (pct) => {
    setTipPreset((prev) => prev === pct ? null : pct);
    setTipAmount('');
  };

  const handleSplitChange = (field, val) =>
    setSplitAmounts(prev => ({ ...prev, [field]: val }));

  const handleConfirm = async () => {
    if (!isValid) return;
    setProcessing(true);
    try {
      const today    = new Date().toISOString().split('T')[0];
      const payments = { cash: requiredCash, card: requiredCard, transfer: requiredTransfer };
      const orderData = {
        tableId, tableName: table.name, items, subtotal, tip, total,
        paymentType: isSplit ? 'split' : 'single', 
        payments,
        paymentMethod: method, // Agregado para el ticket
        reference: reference.trim(), amountReceived: received,
        changeReturned: change > 0 ? change : 0,
        cashierId: user.uid, cashierName: user.displayName ?? user.email,
        createdAt: serverTimestamp(), shift: today,
      };
      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      await updateDoc(doc(db, 'tables', tableId), {
        status: 'available', items: [], openedAt: null, openedBy: null,
      });
      setCompletedOrder({ ...orderData, createdAt: { toDate: () => new Date() }, id: orderRef.id });
      toast.success('¡Pago registrado con éxito!');
      setTimeout(() => { window.print(); }, 300);
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

  /* ─── Secciones reutilizables ─────────────────────────────────────────── */

  const SectionResumen = (
    <section className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', padding: '20px' }}>
      <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <Receipt size={18} color="var(--accent)" />
        <h2 className="font-bold text-sm tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
          Resumen del Consumo
        </h2>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto max-h-64 lg:max-h-none" >
        {items.map((item, idx) => {
          const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
          const lineTotal   = (item.price + extrasTotal) * item.qty;
          return (
            <div key={idx} className="flex justify-between items-start text-sm gap-2" style={{ padding: '5px' }}>
              <div className="flex-1 min-w-0">
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-gray-400 mr-2" style={{ marginRight: '5px' }}>{item.qty}x</span>{item.name}
                </span>
                {(item.extras ?? []).map((ex, ei) => (
                  <div key={ei} className="text-xs ml-6 mt-0.5" style={{ color: 'var(--accent)' }}>
                    + {ex.name} (${ex.price.toFixed(2)})
                  </div>
                ))}
              </div>
              <span className="font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                ${lineTotal.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
      {/* Subtotal dentro del resumen */}
      <div className="flex justify-between pt-3 border-t text-sm" style={{ borderColor: 'var(--border)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
      </div>
      {tip > 0 && (
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--text-secondary)' }}>Propina</span>
          <span className="font-bold text-emerald-400">${tip.toFixed(2)}</span>
        </div>
      )}
    </section>
  );

  const SectionPropina = (
    <section className="rounded-2xl border p-5"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', padding: '20px' }}>
      <h2 className="font-bold text-sm mb-3 tracking-wide uppercase" style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
        Agregar Propina
      </h2>
      <div className="grid grid-cols-4 gap-2 mb-3" style={{ marginBottom: '10px' }}>
        {[0, 10, 15, 20].map((pct) => {
          const isActive = (pct === 0 && !tipPreset && !tipAmount) || tipPreset === pct;
          return (
            <button key={pct}
              onClick={() => pct === 0 ? (setTipPreset(null), setTipAmount('')) : handleTipPreset(pct)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${isActive ? 'scale-95' : 'hover:bg-white/5'}`}
              style={{
                background:  isActive ? 'var(--accent)' : 'transparent',
                borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                color:       isActive ? '#0f172a' : 'var(--text-primary)',
              }}>
              {pct === 0 ? 'Sin' : `${pct}%`}
            </button>
          );
        })}
      </div>
      <div className="relative" style={{ marginBottom: '10px' }}>
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>$</span>
        <input
          className="pos-input pl-8 py-3 w-full bg-black/20 rounded-xl border border-gray-700 focus:border-[var(--accent)] text-white outline-none"
          type="number" min="0" step="5" placeholder="Monto manual (Ej. 50)"
          value={tipAmount}
          onChange={(e) => { setTipAmount(e.target.value); setTipPreset(null); }}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>
    </section>
  );

  const SectionMetodoPago = (
    <section className="rounded-2xl border p-5"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', padding: '10px' }}>
      <h2 className="font-bold text-sm mb-4 tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
        Método de Pago
      </h2>

      {/* Toggle pago combinado */}
      <div
        className="flex items-center gap-3 p-3 rounded-xl border-2 mb-4 cursor-pointer transition-all"
        style={{ marginBottom: '10px', borderColor: isSplit ? 'var(--accent)' : 'var(--border)', background: isSplit ? 'rgba(245,158,11,0.08)' : 'rgba(0,0,0,0.2)' }}
        onClick={() => { setSplit(!isSplit); setSplitAmounts({ cash: '', card: '', transfer: '' }); }}
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isSplit ? 'bg-[var(--accent)]' : 'bg-slate-700'}`} style={{ marginLeft: '10px' }}>
          {isSplit && <CheckCircle size={14} color="#0f172a" />}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: isSplit ? 'var(--accent)' : 'var(--text-primary)' }}>
            Pago Combinado
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Dividir entre efectivo, tarjeta y/o transferencia
          </p>
        </div>
      </div>

      {!isSplit ? (
        <div className="grid grid-cols-3 gap-3" style={{ marginBottom: '10px' }}>
          {PAYMENT_METHODS.map(({ id, label, Icon, color }) => (
            <button key={id}
              onClick={() => { setMethod(id); setReference(''); }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: method === id ? color : 'var(--border)',
                background:  method === id ? `${color}15` : 'rgba(0,0,0,0.2)',
                transform:   method === id ? 'scale(0.97)' : 'scale(1)',
              }}>
              <Icon size={22} color={method === id ? color : 'var(--text-secondary)'} />
              <span className="text-xs font-bold" style={{ color: method === id ? color : 'var(--text-secondary)' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-xl border" style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'var(--border)' }}>
          {PAYMENT_METHODS.map(({ id, label, Icon, color }) => (
            <div key={id} className="flex items-center gap-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon size={18} color={color} />
              </div>
              <span className="text-sm flex-1 font-bold text-white">{label}</span>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input type="number"
                  className="pos-input text-right pr-2 pl-7 w-full font-black tracking-wider text-sm"
                  placeholder="0.00"
                  value={splitAmounts[id]}
                  onChange={e => handleSplitChange(id, e.target.value)}
                />
              </div>
            </div>
          ))}
          <div className={`p-3 mt-2 rounded-xl flex justify-between items-center border text-xs ${isSplitValid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Asignado: <span className="text-white font-bold">${totalSplit.toFixed(2)}</span> / ${total.toFixed(2)}
            </span>
            <span className="font-black uppercase tracking-widest" style={{ color: isSplitValid ? '#10b981' : '#ef4444' }}>
              {isSplitValid ? '✅ OK' : `−$${(total - totalSplit).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      {needsReference && (
        <div className="mt-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30" style={{ marginTop: '10px', marginBottom: '10px' }}>
          <label className="flex items-center gap-2 text-sm font-bold mb-2 text-blue-400" style={{ marginLeft: '10px' }}>
            <AlertCircle size={15} /> Referencia / Folio *
          </label>
          <input
            style={{ padding: '10px' }}
            className="pos-input w-full bg-black/40 text-white placeholder-blue-300/30 border-blue-500/50 focus:border-blue-400"
            placeholder="Ej. Folio 84920..."
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
      )}
    </section>
  );

  const SectionEfectivo = requiredCash > 0 ? (
    <section
      className="rounded-2xl border-2 p-5 shadow-lg shadow-emerald-900/20"
      style={{ background: 'rgba(16,185,129,0.08)', borderColor: received >= requiredCash ? '#10b981' : 'rgba(245,158,11,0.5)', padding: '20px' }}
    >
      <label className="block text-sm font-bold uppercase tracking-wide mb-3" style={{ color: '#10b981' }}>
        Efectivo Recibido *
      </label>
      <div className="relative mb-3"  >
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-500">$</span>
        <input
          className="pos-input pl-10 py-4 font-black text-3xl text-white tracking-wider rounded-xl w-full"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(16,185,129,0.4)', paddingLeft: '30px' }}
          type="number" min={requiredCash} step="0.5"
          value={amountReceived}
          onChange={e => setAmountReceived(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ padding: '5px' }}>
        {getQuickCashSuggestions(requiredCash).map((sug, i) => (
          <button key={i} onClick={() => setAmountReceived(sug)}
            className="flex-1 whitespace-nowrap bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-bold py-1.5 px-3 rounded-lg transition-colors text-sm">
            {i === 0 ? 'Exacto' : `$${sug}`}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20">
        <span className="text-sm font-bold text-emerald-100/60 uppercase tracking-wide">Cambio:</span>
        <div className="text-right">
          <span className="text-4xl font-black tracking-tighter" style={{ color: change >= 0 ? '#10b981' : '#ef4444' }}>
            ${change >= 0 ? change.toFixed(2) : '0.00'}
          </span>
          {change < 0 && (
            <p className="text-xs font-bold text-red-500 mt-0.5">Falta ${Math.abs(change).toFixed(2)}</p>
          )}
        </div>
      </div>
    </section>
  ) : null;

  /* ─── Render principal ────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* ── HEADER ── */}
      <header style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,23,42,0.98)',
        backdropFilter: 'blur(12px)',
        zIndex: 30,
      }}>
        <button
          onClick={() => navigate(`/order/${tableId}`)}
          style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Cobrar — {table.name}
          </h1>
        </div>
        {/* Total visible en el header en PC */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent)' }}>${total.toFixed(2)}</p>
        </div>
      </header>

      {/* ── BODY ── ocupa todo el espacio restante entre header y footer */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

        {/*
          COLUMNA IZQUIERDA — Resumen + Propina
          En móvil desaparece como columna y pasa al scroll vertical.
          En PC (lg+) ocupa 40% del ancho con scroll propio.
        */}
        <div className="hidden lg:flex lg:flex-col lg:w-2/5 lg:border-r lg:overflow-y-auto"
          style={{ borderColor: 'var(--border)', padding: '24px', gap: '16px' }}>
          {SectionResumen}
          {SectionPropina}
        </div>

        {/*
          COLUMNA DERECHA — Método de pago + Efectivo
          En móvil ocupa todo el ancho y hace scroll completo (incluyendo resumen arriba).
          En PC ocupa 60% con scroll propio.
        */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Solo en móvil/tablet: muestra resumen y propina aquí dentro del scroll */}
          <div className="lg:hidden flex flex-col gap-4">
            {SectionResumen}
            {SectionPropina}
          </div>

          {SectionMetodoPago}
          {SectionEfectivo}

          {/* Espaciado inferior para que el footer no tape contenido */}
          <div style={{ height: '8px', flexShrink: 0 }} />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        flexShrink: 0,
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'rgba(15,23,42,0.97)',
        backdropFilter: 'blur(20px)',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        {/* En móvil muestra el total aquí; en PC ya se ve en el header */}
        <div className="lg:hidden" style={{ flex: '0 0 auto' }}>
          <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--accent)' }}>${total.toFixed(2)}</p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={processing || !isValid}
          style={{
            flex: 1,
            padding: '14px 24px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            cursor: isValid && !processing ? 'pointer' : 'not-allowed',
            opacity: isValid && !processing ? 1 : 0.5,
            background: 'var(--accent)',
            color: '#0f172a',
            transition: 'opacity 0.2s',
          }}
        >
          {processing ? 'Procesando...' : validationMessage}
        </button>
      </div>

      {/* ── Portal de ticket para impresión ── */}
      {completedOrder && ReactDOM.createPortal(
        <TicketPrint ref={ticketRef} order={completedOrder} />,
        document.getElementById('ticket-print-root')
      )}
    </div>
  );
}