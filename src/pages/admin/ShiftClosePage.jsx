// src/pages/admin/ShiftClosePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Corte de caja: resumen de ventas, egresos y efectivo esperado en cajón.
// Permite guardar el corte en Firestore.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Scissors, TrendingUp, TrendingDown, Wallet, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

const today = new Date().toISOString().split('T')[0];

function SummaryRow({ label, value, color, big }) {
  return (
    <div className={`flex justify-between items-center ${big ? 'py-3 border-t' : 'py-2'}`}
         style={{ borderColor: big ? 'var(--border)' : undefined }}>
      <span className={big ? 'font-bold' : 'text-sm'}
            style={{ color: big ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className={big ? 'font-black text-2xl' : 'font-semibold text-sm'}
            style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

export default function ShiftClosePage() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [closed, setClosed] = useState(false);

  const { data: orders,   loading: loadingOrders   } = useFirestoreCollection('orders',   [where('shift', '==', today)]);
  const { data: expenses, loading: loadingExpenses } = useFirestoreCollection('expenses', [where('shift', '==', today)]);
  const { data: shifts,   loading: loadingShifts   } = useFirestoreCollection('shifts',   [where('date', '==', today)]);

  const alreadyClosed = shifts.length > 0;

  /* ── Métricas ─────────────────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const totalSales     = orders.reduce((s, o) => s + o.total, 0);
    const cashSales      = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const cardSales      = orders.filter((o) => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const transferSales  = orders.filter((o) => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);
    const totalTips      = orders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
    const cashInDrawer   = cashSales - totalExpenses;
    return { totalSales, cashSales, cardSales, transferSales, totalTips, totalExpenses, cashInDrawer };
  }, [orders, expenses]);

  const fmt = (n) => `$${n.toFixed(2)}`;
  const loading = loadingOrders || loadingExpenses || loadingShifts;

  /* ── Guardar corte ────────────────────────────────────────────────────── */
  const handleClose = async () => {
    if (alreadyClosed) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'shifts'), {
        date:           today,
        orderCount:     orders.length,
        totalSales:     metrics.totalSales,
        cashSales:      metrics.cashSales,
        cardSales:      metrics.cardSales,
        transferSales:  metrics.transferSales,
        totalTips:      metrics.totalTips,
        totalExpenses:  metrics.totalExpenses,
        cashInDrawer:   metrics.cashInDrawer,
        closedBy:       user.uid,
        closedByName:   user.name ?? user.email,
        closedAt:       serverTimestamp(),
      });
      toast.success('Corte de caja registrado exitosamente ✅');
      setClosed(true);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el corte');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fadeIn max-w-xl">
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Scissors size={24} color="var(--accent)" />
          Corte de Caja
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Resumen del día · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* ── Resumen de ventas ────────────────────────────────────────────── */}
      <div className="pos-card p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}>
          <TrendingUp size={16} color="var(--accent)" /> Ventas del día
        </h2>
        <SummaryRow label="Total de órdenes"    value={`${orders.length} órdenes`} />
        <SummaryRow label="Ventas en Efectivo"  value={fmt(metrics.cashSales)}     color="#10b981" />
        <SummaryRow label="Ventas con Tarjeta"  value={fmt(metrics.cardSales)}     color="#3b82f6" />
        <SummaryRow label="Transferencias"      value={fmt(metrics.transferSales)} color="#8b5cf6" />
        <SummaryRow label="Propinas cobradas"   value={fmt(metrics.totalTips)}     color="var(--accent)" />
        <SummaryRow label="TOTAL VENTAS"        value={fmt(metrics.totalSales)}    color="var(--accent)" big />
      </div>

      {/* ── Egresos ──────────────────────────────────────────────────────── */}
      <div className="pos-card p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}>
          <TrendingDown size={16} color="#ef4444" /> Egresos de caja
        </h2>
        {expenses.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Sin egresos registrados hoy.</p>
        ) : (
          <>
            {expenses.map((exp) => (
              <SummaryRow key={exp.id} label={exp.concept} value={`-${fmt(exp.amount)}`} color="#ef4444" />
            ))}
            <SummaryRow label="TOTAL EGRESOS" value={`-${fmt(metrics.totalExpenses)}`} color="#ef4444" big />
          </>
        )}
      </div>

      {/* ── Efectivo en cajón ─────────────────────────────────────────────── */}
      <div
        className="pos-card p-5"
        style={{
          border: `2px solid ${metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
          background: metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Wallet size={20} color={metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444'} />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Efectivo esperado en cajón
          </h2>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
          Ventas en efectivo − Egresos = Efectivo en cajón
        </p>
        <div className="text-3xl font-black" style={{
          color: metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444',
        }}>
          {fmt(metrics.cashInDrawer)}
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          ${metrics.cashSales.toFixed(2)} efectivo − ${metrics.totalExpenses.toFixed(2)} egresos
        </p>
      </div>

      {/* ── Botón de corte ─────────────────────────────────────────────────── */}
      {(alreadyClosed || closed) ? (
        <div className="flex items-center gap-3 p-4 rounded-xl"
             style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle size={20} color="#10b981" />
          <div>
            <p className="font-bold text-sm" style={{ color: '#10b981' }}>
              Corte registrado
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              El corte de caja de hoy ya fue guardado.
            </p>
          </div>
        </div>
      ) : (
        <button
          id="btn-close-shift"
          onClick={handleClose}
          disabled={saving || orders.length === 0}
          className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
          style={{ opacity: orders.length === 0 ? 0.5 : 1 }}
        >
          {saving ? <LoadingSpinner size="sm" /> : <Scissors size={18} />}
          Registrar Corte de Caja
        </button>
      )}

      {orders.length === 0 && (
        <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
          No hay ventas registradas hoy — el corte no se puede realizar.
        </p>
      )}
    </div>
  );
}
