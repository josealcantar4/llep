// src/pages/admin/ShiftClosePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Corte de caja: resumen de ventas, egresos y efectivo esperado en cajón.
// Permite guardar el corte en Firestore y ver el historial.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp, limit } from 'firebase/firestore';
import { Scissors, TrendingUp, TrendingDown, Wallet, CheckCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import { getLocalDateString } from '../../utils/dateUtils.js';
import ShiftDetailModal from './ShiftDetailModal.jsx';

const today = getLocalDateString();

function SummaryRow({ label, value, color, big }) {
  return (
    <div className={`flex justify-between items-center gap-4 ${big ? 'py-5 border-t mt-4' : 'py-3'}`}
         style={{ borderColor: big ? 'var(--border)' : undefined }}>
      <span className={`${big ? 'font-black text-xs uppercase tracking-widest' : 'text-sm font-medium'} shrink-0`}
            style={{ color: big ? 'var(--text-secondary)' : 'var(--text-secondary)' }}>
        {label}
      </span>
      <span className={`${big ? 'font-black text-3xl' : 'font-bold text-base'} truncate ml-2`}
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
  const [viewingShift, setViewingShift] = useState(null);

  // 1. Obtener el último corte de caja realizado
  const { data: latestShifts, loading: loadingLatest } = useFirestoreCollection('shifts', [
    orderBy('closedAt', 'desc'),
    limit(1)
  ]);

  const lastShiftTimestamp = useMemo(() => {
    if (latestShifts.length > 0 && latestShifts[0].closedAt) {
      return latestShifts[0].closedAt;
    }
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    return yesterday;
  }, [latestShifts]);

  // 2. Consultas del turno actual (desde el último corte)
  const { data: orders,   loading: loadingOrders   } = useFirestoreCollection('orders',   [where('createdAt', '>', lastShiftTimestamp)]);
  const { data: expenses, loading: loadingExpenses } = useFirestoreCollection('expenses', [where('createdAt', '>', lastShiftTimestamp)]);
  
  // Mantenemos esta para saber si ya se hizo un corte con la fecha de HOY
  const { data: shiftsToday, loading: loadingShiftsToday } = useFirestoreCollection('shifts', [where('date', '==', today)]);
  
  // 3. Consulta de todo el historial de cortes (para la tabla inferior)
  const { data: allShifts, loading: loadingAllShifts } = useFirestoreCollection('shifts', [orderBy('closedAt', 'desc')]);

  // Ya no bloqueamos por "alreadyClosed", permitimos múltiples turnos por día
  const hasOrders = orders.length > 0;

  const metrics = useMemo(() => {
    let cashSales = 0, cardSales = 0, transferSales = 0, totalTips = 0;

    orders.forEach(o => {
      totalTips += (o.tip ?? 0);
      if (o.payments) {
        cashSales     += (o.payments.cash || 0);
        cardSales     += (o.payments.card || 0);
        transferSales += (o.payments.transfer || 0);
      } else {
        // Retrocompatibilidad con datos viejos
        if (o.paymentMethod === 'cash') cashSales += o.total;
        if (o.paymentMethod === 'card') cardSales += o.total;
        if (o.paymentMethod === 'transfer') transferSales += o.total;
      }
    });

    const totalSales     = cashSales + cardSales + transferSales;
    const totalExpenses  = expenses.reduce((s, e) => s + e.amount, 0);
    const cashInDrawer   = cashSales - totalExpenses;
    return { totalSales, cashSales, cardSales, transferSales, totalTips, totalExpenses, cashInDrawer };
  }, [orders, expenses]);

  const fmt = (n) => `$${n.toFixed(2)}`;
  const loading = loadingLatest || loadingOrders || loadingExpenses || loadingShiftsToday || loadingAllShifts;

  /* ── Guardar corte ────────────────────────────────────────────────────── */
  const handleClose = async () => {
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
        closedByName:   user.displayName ?? user.name ?? user.email,
        closedAt:       serverTimestamp(),
      });
      toast.success('Corte de caja registrado exitosamente ✅');
      // No seteamos "closed" permanentemente para permitir otros turnos después
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el corte');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto px-4 pb-20">
      <div className="mb-4">
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Scissors size={24} color="var(--accent)" />
          Corte de Caja
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Resumen del día · {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* ── Resumen de ventas ────────────────────────────────────────────── */}
        <div className="pos-card p-8">
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
        <div className="pos-card p-8">
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

        <div className="space-y-8">
          {/* ── Efectivo en cajón ─────────────────────────────────────────────── */}
          <div
            className="pos-card p-10"
            style={{
              border: `2px solid ${metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
              background: metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Wallet size={24} color={metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444'} />
              <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                Efectivo esperado en cajón
              </h2>
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Ventas en efectivo − Egresos = Efectivo en cajón
            </p>
            <div className="text-5xl font-black truncate max-w-full" style={{
              color: metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444',
            }}>
              {fmt(metrics.cashInDrawer)}
            </div>
            <p className="text-sm mt-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>
              ${metrics.cashSales.toFixed(2)} efectivo − ${metrics.totalExpenses.toFixed(2)} egresos
            </p>
          </div>

          {/* ── Botón de corte ─────────────────────────────────────────────────── */}
          <button
            id="btn-close-shift"
            onClick={handleClose}
            disabled={saving || !hasOrders}
            className="btn-primary w-full py-5 flex items-center justify-center gap-3 text-lg min-h-[64px]"
            style={{ opacity: !hasOrders ? 0.5 : 1 }}
          >
            {saving ? <LoadingSpinner size="md" /> : <Scissors size={22} />}
            {hasOrders ? 'Cerrar Turno Actual' : 'No hay ventas pendientes'}
          </button>

          {orders.length === 0 && (
            <p className="text-sm text-center mt-2" style={{ color: 'var(--text-secondary)' }}>
              No hay ventas registradas hoy — el corte no se puede realizar.
            </p>
          )}
        </div>
      </div>

      {/* ── Historial de Cortes (Past Shifts) ──────────────────────────────── */}
      <div className="pos-card p-0 mt-8">
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <History size={18} color="var(--text-secondary)" />
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Historial de Cortes</h2>
        </div>
        
        {loadingAllShifts ? (
          <div className="flex justify-center p-10"><LoadingSpinner size="md" /></div>
        ) : allShifts.length === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            No hay cortes en el historial.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  <th className="px-6 py-4 font-black">Fecha</th>
                  <th className="px-6 py-4 font-black">Ventas Totales</th>
                  <th className="px-6 py-4 font-black">Total Egresos</th>
                  <th className="px-6 py-4 font-black">Efectivo Cajón</th>
                  <th className="px-6 py-4 font-black text-right">Realizado por</th>
                </tr>
              </thead>
              <tbody>
                {allShifts.map((shift) => (
                  <tr 
                    key={shift.id} 
                    className="border-t transition-colors hover:bg-white/5 cursor-pointer group/row" 
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => setViewingShift(shift)}
                  >
                    <td className="px-5 py-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {shift.date}
                    </td>
                    <td className="px-5 py-4 font-bold" style={{ color: 'var(--accent)' }}>
                      {fmt(shift.totalSales)}
                    </td>
                    <td className="px-5 py-4 font-bold" style={{ color: '#ef4444' }}>
                      -{fmt(shift.totalExpenses)}
                    </td>
                    <td className="px-5 py-4 font-black" style={{ color: '#10b981' }}>
                      {fmt(shift.cashInDrawer)}
                    </td>
                    <td className="px-5 py-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {shift.closedByName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <ShiftDetailModal 
        isOpen={!!viewingShift} 
        onClose={() => setViewingShift(null)} 
        shift={viewingShift} 
      />
    </div>
  );
}
