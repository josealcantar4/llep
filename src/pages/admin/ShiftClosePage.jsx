// src/pages/admin/ShiftClosePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Corte de caja: resumen de ventas, egresos y efectivo esperado en cajón.
// Permite guardar el corte en Firestore y ver el historial.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp, limit } from 'firebase/firestore';
import { Scissors, TrendingUp, TrendingDown, Wallet, History, CalendarDays } from 'lucide-react';
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
    <div className={`flex justify-between items-center gap-4 ${big ? 'pt-6 mt-4 border-t border-white/10' : 'py-2.5'}`}>
      <span className={`${big ? 'font-black text-[11px] uppercase tracking-widest text-slate-400' : 'text-[15px] font-medium text-slate-400'} shrink-0`}>
        {label}
      </span>
      <span className={`${big ? 'font-black text-[32px] tracking-tight' : 'font-bold text-[18px]'} truncate ml-2`}
        style={{ color: color ?? 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

function SummaryCard({ title, icon: Icon, color, children }) {
  return (
    <div 
      className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm transition-all duration-300 hover:shadow-xl hover:border-white/10"
      style={{ padding: '28px', borderRadius: '28px', display: 'flex', flexDirection: 'column' }}
    >
      {/* Luz de fondo dinámica (Glow sutil) */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-30 pointer-events-none" style={{ background: color }} />
      
      <div className="flex items-center gap-4 relative z-10 mb-8">
        <div className="flex items-center justify-center shadow-inner" style={{ width: '52px', height: '52px', borderRadius: '18px', background: `${color}15`, border: `1px solid ${color}30`, flexShrink: 0 }}>
          <Icon size={26} color={color} strokeWidth={2.5} />
        </div>
        <h2 className="font-bold text-[17px] text-slate-200 tracking-wide">{title}</h2>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col justify-end">
        {children}
      </div>
    </div>
  );
}

export default function ShiftClosePage() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
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
  const { data: orders, loading: loadingOrders } = useFirestoreCollection('orders', [where('createdAt', '>', lastShiftTimestamp)]);
  const { data: expenses, loading: loadingExpenses } = useFirestoreCollection('expenses', [where('createdAt', '>', lastShiftTimestamp)]);
  const { data: shiftsToday, loading: loadingShiftsToday } = useFirestoreCollection('shifts', [where('date', '==', today)]);

  // 3. Consulta de todo el historial de cortes (para la tabla inferior)
  const { data: allShifts, loading: loadingAllShifts } = useFirestoreCollection('shifts', [orderBy('closedAt', 'desc')]);

  const hasOrders = orders.length > 0;

  const metrics = useMemo(() => {
    let cashSales = 0, cardSales = 0, transferSales = 0, totalTips = 0;

    orders.forEach(o => {
      totalTips += (o.tip ?? 0);
      if (o.payments) {
        cashSales += (o.payments.cash || 0);
        cardSales += (o.payments.card || 0);
        transferSales += (o.payments.transfer || 0);
      } else {
        if (o.paymentMethod === 'cash') cashSales += o.total;
        if (o.paymentMethod === 'card') cardSales += o.total;
        if (o.paymentMethod === 'transfer') transferSales += o.total;
      }
    });

    const totalSales = cashSales + cardSales + transferSales;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const cashInDrawer = cashSales - totalExpenses;
    return { totalSales, cashSales, cardSales, transferSales, totalTips, totalExpenses, cashInDrawer };
  }, [orders, expenses]);

  const fmt = (n) => `$${n.toFixed(2)}`;
  const loading = loadingLatest || loadingOrders || loadingExpenses || loadingShiftsToday || loadingAllShifts;

  const handleClose = async () => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'shifts'), {
        date: today,
        orderCount: orders.length,
        totalSales: metrics.totalSales,
        cashSales: metrics.cashSales,
        cardSales: metrics.cardSales,
        transferSales: metrics.transferSales,
        totalTips: metrics.totalTips,
        totalExpenses: metrics.totalExpenses,
        cashInDrawer: metrics.cashInDrawer,
        closedBy: user.uid,
        closedByName: user.displayName ?? user.name ?? user.email,
        closedAt: serverTimestamp(),
      });
      toast.success('Corte de caja registrado exitosamente ✅');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el corte');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-[50vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fadeIn pb-12" style={{ margin: '1%' }}>
      
      {/* ── Encabezado Estructurado ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6" >
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Corte de Caja
          </h1>
          <p className="text-sm font-medium mt-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>
            Cierre de turno y balance general de ingresos y egresos.
          </p>
        </div>
        {/* Píldora de Fecha Estilo Vercel */}
        <div 
          className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm transition-all hover:bg-white/5"
          style={{ margin: '5px', padding: '14px 28px', borderRadius: '18px', minWidth: 'max-content', gap: '16px', flexShrink: 0 }}
        >
          <CalendarDays size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span className="text-[15px] font-bold capitalize text-slate-300 tracking-wide" style={{ whiteSpace: 'nowrap' }}>
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3" style={{ gap: '24px', marginTop: '1%' }}>
        
        {/* ── Resumen de ventas ────────────────────────────────────────────── */}
        <SummaryCard title="Ventas del Turno" icon={TrendingUp} color="#f59e0b">
          <SummaryRow label="Total de órdenes" value={`${orders.length} órdenes`} />
          <SummaryRow label="Ventas en Efectivo" value={fmt(metrics.cashSales)} color="#10b981" />
          <SummaryRow label="Ventas con Tarjeta" value={fmt(metrics.cardSales)} color="#3b82f6" />
          <SummaryRow label="Transferencias" value={fmt(metrics.transferSales)} color="#8b5cf6" />
          <SummaryRow label="Propinas cobradas" value={fmt(metrics.totalTips)} color="var(--accent)" />
          <SummaryRow label="TOTAL VENTAS" value={fmt(metrics.totalSales)} color="#f59e0b" big />
        </SummaryCard>

        {/* ── Egresos ──────────────────────────────────────────────────────── */}
        <SummaryCard title="Egresos de Caja" icon={TrendingDown} color="#ef4444">
          {expenses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40 py-8">
              <TrendingDown size={40} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">Sin egresos registrados hoy.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full justify-between">
              <div>
                {expenses.map((exp) => (
                  <SummaryRow key={exp.id} label={exp.concept} value={`-${fmt(exp.amount)}`} color="#ef4444" />
                ))}
              </div>
              <SummaryRow label="TOTAL EGRESOS" value={`-${fmt(metrics.totalExpenses)}`} color="#ef4444" big />
            </div>
          )}
        </SummaryCard>

        {/* ── Efectivo esperado y Cierre ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div 
            className="relative group overflow-hidden border shadow-sm transition-all duration-300 hover:shadow-xl"
            style={{ 
              padding: '32px', borderRadius: '28px', display: 'flex', flexDirection: 'column',
              borderColor: metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
              background: metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
            }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-20 pointer-events-none" style={{ background: metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444' }} />
            
            <div className="flex items-center gap-4 relative z-10 mb-4">
              <div className="flex items-center justify-center shadow-inner" style={{ width: '52px', height: '52px', borderRadius: '18px', background: metrics.cashInDrawer >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${metrics.cashInDrawer >= 0 ? '#10b98130' : '#ef444430'}`, flexShrink: 0 }}>
                <Wallet size={26} color={metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444'} strokeWidth={2.5} />
              </div>
              <h2 className="font-bold text-[17px] tracking-wide" style={{ color: 'var(--text-primary)' }}>
                Efectivo en Cajón
              </h2>
            </div>
            
            <p className="text-[13px] font-medium opacity-60 relative z-10 mb-6" style={{ color: 'var(--text-secondary)' }}>
              Cálculo estimado basado en ventas registradas en efectivo menos egresos del turno.
            </p>
            
            <div className="font-black tracking-tight relative z-10" style={{ fontSize: '42px', color: metrics.cashInDrawer >= 0 ? '#10b981' : '#ef4444', lineHeight: 1 }}>
              {fmt(metrics.cashInDrawer)}
            </div>
            
            <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex justify-between">
              <span className="text-[12px] font-bold text-slate-400">EFECTIVO: {fmt(metrics.cashSales)}</span>
              <span className="text-[12px] font-bold text-slate-400">EGRESOS: {fmt(metrics.totalExpenses)}</span>
            </div>
          </div>

          <button
            id="btn-close-shift"
            onClick={handleClose}
            disabled={saving || !hasOrders}
            className="w-full relative overflow-hidden group transition-all"
            style={{ 
              background: hasOrders ? 'var(--accent)' : 'var(--bg-secondary)', 
              color: hasOrders ? '#fff' : 'var(--text-secondary)',
              border: hasOrders ? 'none' : '1px solid var(--border)',
              padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '18px', fontWeight: 800, borderRadius: '24px', opacity: !hasOrders ? 0.6 : 1,
              boxShadow: hasOrders ? '0 10px 25px -5px rgba(245,158,11,0.4)' : 'none'
            }}
          >
            {saving ? <LoadingSpinner size="sm" /> : <Scissors size={24} strokeWidth={2.5} />}
            {hasOrders ? 'Realizar Corte de Turno' : 'Sin ventas pendientes'}
          </button>
        </div>
      </div>

      {/* ── Tabla Estructurada (Historial) ───────────────────────────────── */}
      <div 
        className="bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm"
        style={{ padding: '28px', borderRadius: '28px', marginTop: '32px' }}
      >
        <div className="flex items-center text-white" style={{ gap: '16px', marginBottom: '32px' }}>
          <div className="rounded-xl bg-slate-500/10 text-slate-400" style={{ padding: '10px' }}>
            <History size={24} strokeWidth={2.5} />
          </div>
          <h2 className="font-bold text-xl tracking-wide">Historial de Cortes</h2>
        </div>

        {allShifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-40" style={{ padding: '48px 0' }}>
            <History size={48} className="opacity-50" style={{ marginBottom: '16px' }} />
            <p className="text-sm font-medium">No hay cortes registrados en el historial</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar" style={{ paddingBottom: '8px' }}>
            <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Fecha y Hora</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Ventas Totales</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Egresos</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Efectivo Cajón</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>Realizado Por</th>
                </tr>
              </thead>
              <tbody>
                {allShifts.map((shift) => {
                  const d = shift.closedAt?.toDate?.() ?? new Date();
                  return (
                    <tr
                      key={shift.id}
                      className="group border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all cursor-pointer"
                      onClick={() => setViewingShift(shift)}
                    >
                      <td className="rounded-l-2xl" style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <div className="flex flex-col">
                          <span className="font-black text-[15px] text-white group-hover:text-amber-400 transition-colors">
                            {shift.date}
                          </span>
                          <span className="text-[13px] font-medium text-slate-400 mt-1">
                            {d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span className="text-[16px] font-black" style={{ color: 'var(--accent)' }}>
                          {fmt(shift.totalSales)}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span className="text-[15px] font-bold text-red-500">
                          -{fmt(shift.totalExpenses)}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span className="text-[16px] font-black text-emerald-500">
                          {fmt(shift.cashInDrawer)}
                        </span>
                      </td>
                      <td className="rounded-r-2xl" style={{ padding: '18px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <span className="text-[14px] font-medium text-slate-300">
                          {shift.closedByName}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
