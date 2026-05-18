// src/pages/admin/DashboardPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard de ventas - Rediseño Estructurado Premium (Usabilidad & Jerarquía)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import ReactDOM from 'react-dom';
import { where, orderBy, limit } from 'firebase/firestore';
import {
  TrendingUp, Banknote, CreditCard, Smartphone, ShoppingBag, Printer, CalendarDays
} from 'lucide-react';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import TicketPrint from '../../components/print/TicketPrint.jsx';
import OrderDetailModal from './OrderDetailModal.jsx';
import { getLocalDateString } from '../../utils/dateUtils.js';

const today = getLocalDateString();

const METHOD_COLORS = {
  cash: '#10b981', // Esmeralda
  card: '#3b82f6', // Azul
  transfer: '#8b5cf6', // Púrpura
  split: '#f59e0b', // Ámbar
};

const METHOD_LABELS = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  split: 'Combinado'
};

/* ── KPI Card (Estructura de Cuadrantes) ─────────────────────────────────── */
/* ── KPI Card (Totalmente blindada contra deformaciones) ───────────────── */
function KpiCard({ label, value, Icon, color, sub }) {
  return (
    <div 
      className="relative group overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm transition-all duration-300 hover:shadow-xl hover:border-white/10 hover:-translate-y-1"
      style={{ 
        padding: '28px',           
        borderRadius: '28px',     
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '170px'         
      }}
    >
      {/* Luz de fondo dinámica (Glow sutil) */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity duration-500 group-hover:opacity-30 pointer-events-none" 
        style={{ background: color }} 
      />

      {/* Zona Superior: Icono y Subtexto (Blindado contra desbordamientos) */}
      <div 
        className="flex justify-between items-start relative z-10" 
        style={{ 
          marginBottom: '24px', 
          gap: '12px',
          flexWrap: 'wrap' /* 👈 TRUCO 1: Si no cabe, salta al renglón de abajo elegantemente */
        }}
      >
        <div 
          className="flex items-center justify-center shadow-inner"
          style={{ 
            width: '56px', height: '56px', borderRadius: '20px', 
            background: `${color}15`, border: `1px solid ${color}30`,
            flexShrink: 0
          }}
        >
          <Icon size={28} color={color} strokeWidth={2.5} style={{ flexShrink: 0 }} />
        </div>
        
        {sub && (
          <span 
            className="font-black uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400"
            style={{ 
              padding: '6px 14px',
              borderRadius: '999px', 
              fontSize: '10px',
              whiteSpace: 'nowrap',
              maxWidth: '100%',      
              overflow: 'hidden',      
              textOverflow: 'ellipsis' 
            }}
          >
            {sub}
          </span>
        )}
      </div>

      {/* Zona Inferior: Valores Core */}
      <div className="relative z-10 mt-auto">
        <p 
          className="font-bold uppercase tracking-wider opacity-60" 
          style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '13px', 
            marginBottom: '8px', 
            whiteSpace: 'nowrap'         /* 👈 Protege la etiqueta descriptiva */
          }}
        >
          {label}
        </p>
        <p 
          className="font-black tracking-tight" 
          style={{ 
            color: 'var(--text-primary)', 
            fontSize: '34px', 
            lineHeight: '1', 
            whiteSpace: 'nowrap'         /* 👈 Evita que el monto se parta en dos renglones */
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: latestShifts, loading: loadingShifts } = useFirestoreCollection('shifts', [
    orderBy('closedAt', 'desc'), limit(1)
  ]);

  const lastShiftTimestamp = useMemo(() => {
    if (latestShifts.length > 0 && latestShifts[0].closedAt) {
      return latestShifts[0].closedAt;
    }
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    return yesterday;
  }, [latestShifts]);

  const { data: orders, loading: loadingOrders } = useFirestoreCollection('orders', [
    where('createdAt', '>', lastShiftTimestamp),
    orderBy('createdAt', 'desc'),
  ]);

  const loading = loadingShifts || loadingOrders;
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [viewOrder, setViewOrder] = React.useState(null);

  const handleReprint = (order, e) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setTimeout(() => window.print(), 700);
  };

  const metrics = useMemo(() => {
    const totalSales = orders.reduce((s, o) => s + o.total, 0);
    const cashSales = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const cardSales = orders.filter((o) => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const transferSales = orders.filter((o) => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);
    const totalTips = orders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const orderCount = orders.length;

    return { totalSales, cashSales, cardSales, transferSales, totalTips, orderCount };
  }, [orders]);

  const pieData = [
    { name: 'Efectivo', value: metrics.cashSales, color: METHOD_COLORS.cash },
    { name: 'Tarjeta', value: metrics.cardSales, color: METHOD_COLORS.card },
    { name: 'Transferencia', value: metrics.transferSales, color: METHOD_COLORS.transfer },
  ].filter((d) => d.value > 0);

  const byHour = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const date = o.createdAt?.toDate?.() ?? new Date();
      const hour = `${date.getHours()}:00`;
      map[hour] = (map[hour] ?? 0) + o.total;
    });
    return Object.entries(map).map(([hora, total]) => ({ hora, total })).sort((a, b) => a.hora.localeCompare(b.hora));
  }, [orders]);

  const fmt = (n) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="flex items-center justify-center h-[50vh]"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-fadeIn pb-12" style={{ margin: '1%' }}>

      {/* ── Encabezado Estructurado ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border)] pb-6" >
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Resumen de Ventas
          </h1>
          <p className="text-sm font-medium mt-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>
            Métricas calculadas desde el último corte de caja.
          </p>
        </div>
        {/* Píldora de Fecha Estilo Vercel */}
        {/* Píldora de Fecha Estilo Vercel (Forzada con CSS en línea) */}
        <div 
          className="flex items-center bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm transition-all hover:bg-white/5"
          style={{ 
            margin: '5px',
            padding: '14px 28px',       
            borderRadius: '18px',      
            minWidth: 'max-content',   
            gap: '16px',                
            flexShrink: 0              
          }}
        >
          <CalendarDays size={22} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span 
            className="text-[15px] font-bold capitalize text-slate-300 tracking-wide" 
            style={{ whiteSpace: 'nowrap' }}
          >
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>
      {/* ── KPIs Grid ────────────────────────────────────────────────────── */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" 
        style={{ gap: '24px', marginTop: '1%' }}
      >
        <KpiCard 
          label="Ventas Totales" 
          value={fmt(metrics.totalSales)} 
          Icon={TrendingUp} 
          color="#f59e0b" 
          sub={`${metrics.orderCount} ${metrics.orderCount > 999 ? 'Órd.' : 'Órdenes'}`} 
        />
        <KpiCard label="Cobrado en Efectivo" value={fmt(metrics.cashSales)} Icon={Banknote} color="#10b981" />
        <KpiCard label="Cobrado en Tarjeta" value={fmt(metrics.cardSales)} Icon={CreditCard} color="#3b82f6" />
        <KpiCard label="Transferencias" value={fmt(metrics.transferSales)} Icon={Smartphone} color="#8b5cf6" sub={`+ ${fmt(metrics.totalTips)} Propinas`} />
      </div>

      {/* ── Área de Gráficos ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: '24px', marginTop: '32px' }}>
        {/* Gráfico de Barras */}
        <div 
          className="bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm flex flex-col"
          style={{ padding: '28px', borderRadius: '28px' }} /* 👈 Blindaje de padding */
        >
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '32px' }}>
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" style={{ flexShrink: 0 }} />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-300">
              Flujo de Ventas por Hora
            </h2>
          </div>
          <div className="flex-1" style={{ minHeight: '250px' }}>
            {byHour.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm opacity-40">Sin datos registrados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byHour} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                  <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickMargin={12} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: '900', fontSize: '16px', color: '#fff' }}
                    formatter={(v) => [`$${v.toFixed(2)}`, 'Ventas']}
                  />
                  <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico de Pastel */}
        <div 
          className="bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm flex flex-col"
          style={{ padding: '28px', borderRadius: '28px' }} /* 👈 Blindaje de padding */
        >
          <div className="flex items-center" style={{ gap: '12px', marginBottom: '32px' }}>
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" style={{ flexShrink: 0 }} />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-300">
              Distribución de Ingresos
            </h2>
          </div>
          <div className="flex-1" style={{ minHeight: '250px' }}>
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm opacity-40">Sin datos registrados</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '16px', padding: '12px 16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontWeight: '900', fontSize: '16px', color: '#fff' }}
                    formatter={(v) => [`$${v.toFixed(2)}`]}
                  />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '13px', fontWeight: '600', paddingTop: '15px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabla Estructurada (100% blindada contra aplastamientos) ─────── */}
      <div 
        className="bg-[var(--bg-secondary)] border border-[var(--border)] shadow-sm"
        style={{ padding: '28px', borderRadius: '28px', marginTop: '32px' }}
      >
        <div className="flex items-center text-white" style={{ gap: '16px', marginBottom: '32px' }}>
          <div className="rounded-xl bg-amber-500/10 text-amber-500" style={{ padding: '10px' }}>
            <ShoppingBag size={24} strokeWidth={2.5} />
          </div>
          <h2 className="font-bold text-xl tracking-wide">Registro de Actividad</h2>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-40" style={{ padding: '48px 0' }}>
            <ShoppingBag size={48} className="opacity-50" style={{ marginBottom: '16px' }} />
            <p className="text-sm font-medium">Aún no hay órdenes registradas hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar" style={{ paddingBottom: '8px' }}>
            <table className="w-full text-left border-collapse" style={{ minWidth: '650px' }}>
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400">
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Mesa / Área</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Recepción</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Atendido por</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Transacción</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>Importe</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => {
                  const date = order.createdAt?.toDate?.() ?? new Date();
                  const methodKey = order.paymentType === 'split' ? 'split' : order.paymentMethod;
                  return (
                    <tr
                      key={order.id}
                      className="group border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all cursor-pointer"
                      onClick={() => setViewOrder(order)}
                    >
                      <td className="rounded-l-2xl" style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span className="font-black text-[15px] text-white group-hover:text-amber-400 transition-colors">
                          {order.tableName}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span className="text-[14px] font-medium text-slate-300">
                          {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <div className="flex items-center" style={{ gap: '12px' }}>
                          <div className="bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300"
                               style={{ width: '28px', height: '28px', borderRadius: '50%', fontSize: '11px', flexShrink: 0 }}>
                            {order.cashierName?.[0]}
                          </div>
                          <span className="text-[14px] font-medium text-slate-300">{order.cashierName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '18px 16px' }}>
                        <div className="inline-flex items-center justify-center font-black uppercase tracking-widest border"
                             style={{ 
                               background: `${METHOD_COLORS[methodKey]}10`, 
                               color: METHOD_COLORS[methodKey], 
                               borderColor: `${METHOD_COLORS[methodKey]}25`,
                               padding: '6px 16px',      
                               borderRadius: '999px',     
                               fontSize: '10px',
                               minWidth: 'max-content',   
                               whiteSpace: 'nowrap'
                             }}>
                          {METHOD_LABELS[methodKey] || 'N/A'}
                        </div>
                      </td>
                      <td className="rounded-r-2xl" style={{ padding: '18px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        <span className="text-[16px] font-black text-white group-hover:text-amber-400 transition-colors">
                          ${order.total.toFixed(2)}
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

      <OrderDetailModal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
        onReprint={(order) => handleReprint(order, { stopPropagation: () => { } })}
      />

      {selectedOrder && ReactDOM.createPortal(
        <TicketPrint order={selectedOrder} />,
        document.getElementById('ticket-print-root')
      )}
    </div>
  );
}