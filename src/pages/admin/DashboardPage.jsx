// src/pages/admin/DashboardPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Dashboard de ventas con KPIs del día y gráfico de barras por método de pago.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import ReactDOM from 'react-dom';
import { where, orderBy, limit } from 'firebase/firestore';
import {
  TrendingUp, Banknote, CreditCard, Smartphone, ShoppingBag, Printer
} from 'lucide-react';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import TicketPrint from '../../components/print/TicketPrint.jsx';
import OrderDetailModal from './OrderDetailModal.jsx';
import { getLocalDateString } from '../../utils/dateUtils.js';

const today = getLocalDateString();

const METHOD_COLORS = {
  cash:     '#10b981',
  card:     '#3b82f6',
  transfer: '#8b5cf6',
  split:    '#f59e0b', // Color ámbar para pagos divididos
};
const METHOD_LABELS = { 
  cash:     'Efectivo', 
  card:     'Tarjeta', 
  transfer: 'Transferencia',
  split:    'Combinado'
};

/* ── KPI Card ─────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, Icon, color, sub }) {
  return (
    <div className="pos-card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: `${color}18` }}>
        <Icon size={22} color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="font-black text-xl truncate" style={{ color: 'var(--text-primary)' }}>{value}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // 1. Obtener el último corte de caja realizado
  const { data: latestShifts, loading: loadingShifts } = useFirestoreCollection('shifts', [
    orderBy('closedAt', 'desc'),
    limit(1)
  ]);

  // Calculamos el timestamp del último corte (o hace 24h si no hay cortes)
  const lastShiftTimestamp = useMemo(() => {
    if (latestShifts.length > 0 && latestShifts[0].closedAt) {
      return latestShifts[0].closedAt;
    }
    // Si no hay cortes, retrocedemos 24 horas
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    return yesterday;
  }, [latestShifts]);

  // 2. Obtener órdenes realizadas DESPUÉS del último corte
  const { data: orders, loading: loadingOrders } = useFirestoreCollection('orders', [
    where('createdAt', '>', lastShiftTimestamp),
    orderBy('createdAt', 'desc'),
  ]);

  const loading = loadingShifts || loadingOrders;

  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [viewOrder, setViewOrder] = React.useState(null);

  const handleReprint = (order, e) => {
    e.stopPropagation(); // Evitar abrir el modal de detalles
    setSelectedOrder(order);
    // Pequeño delay para asegurar que el portal renderice el ticket antes de imprimir
    setTimeout(() => {
      window.print();
    }, 700);
  };

  /* ── Calcular métricas ──────────────────────────────────────────────── */
  const metrics = useMemo(() => {
    const totalSales    = orders.reduce((s, o) => s + o.total, 0);
    const cashSales     = orders.filter((o) => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
    const cardSales     = orders.filter((o) => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
    const transferSales = orders.filter((o) => o.paymentMethod === 'transfer').reduce((s, o) => s + o.total, 0);
    const totalTips     = orders.reduce((s, o) => s + (o.tip ?? 0), 0);
    const orderCount    = orders.length;

    return { totalSales, cashSales, cardSales, transferSales, totalTips, orderCount };
  }, [orders]);

  /* ── Datos para gráficos ────────────────────────────────────────────── */
  const pieData = [
    { name: 'Efectivo',      value: metrics.cashSales,     color: METHOD_COLORS.cash },
    { name: 'Tarjeta',       value: metrics.cardSales,     color: METHOD_COLORS.card },
    { name: 'Transferencia', value: metrics.transferSales, color: METHOD_COLORS.transfer },
  ].filter((d) => d.value > 0);

  // Ventas por hora (últimas 12h)
  const byHour = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const date = o.createdAt?.toDate?.() ?? new Date();
      const hour = `${date.getHours()}:00`;
      map[hour] = (map[hour] ?? 0) + o.total;
    });
    return Object.entries(map)
      .map(([hora, total]) => ({ hora, total }))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [orders]);

  const fmt = (n) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          Dashboard de Ventas
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Ventas totales del día" value={fmt(metrics.totalSales)}
                 Icon={TrendingUp} color="var(--accent)" sub={`${metrics.orderCount} órdenes`} />
        <KpiCard label="Efectivo"      value={fmt(metrics.cashSales)}
                 Icon={Banknote}    color="#10b981" />
        <KpiCard label="Tarjeta"       value={fmt(metrics.cardSales)}
                 Icon={CreditCard}  color="#3b82f6" />
        <KpiCard label="Transferencia" value={fmt(metrics.transferSales)}
                 Icon={Smartphone}  color="#8b5cf6" sub={`Propinas: ${fmt(metrics.totalTips)}`} />
      </div>

      {/* ── Gráficos ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ventas por hora */}
        <div className="pos-card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Ventas por hora
          </h2>
          {byHour.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sin ventas registradas hoy
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byHour} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="hora" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }}
                       tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  formatter={(v) => [`$${v.toFixed(2)}`, 'Ventas']}
                />
                <Bar dataKey="total" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por método */}
        <div className="pos-card p-5">
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Distribución por método
          </h2>
          {pieData.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sin ventas registradas hoy
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  formatter={(v) => [`$${v.toFixed(2)}`]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{val}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Últimas órdenes ──────────────────────────────────────────────── */}
      <div className="pos-card p-5">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <ShoppingBag size={16} color="var(--accent)" />
          Últimas órdenes del día
        </h2>
        {orders.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sin órdenes hoy
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th className="text-left pb-2 font-medium">Mesa</th>
                  <th className="text-left pb-2 font-medium">Hora</th>
                  <th className="text-left pb-2 font-medium">Cajero</th>
                  <th className="text-left pb-2 font-medium">Método</th>
                  <th className="text-right pb-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((order) => {
                  const date = order.createdAt?.toDate?.() ?? new Date();
                  const methodKey = order.paymentType === 'split' ? 'split' : order.paymentMethod;
                  return (
                    <tr 
                      key={order.id} 
                      className="border-t cursor-pointer hover:bg-white/5 transition-colors group/row"
                      style={{ borderColor: 'var(--border)' }}
                      onClick={() => setViewOrder(order)}
                    >
                      <td className="py-3 px-1" style={{ color: 'var(--text-primary)' }}>
                        <span className="font-bold">{order.tableName}</span>
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                        {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3" style={{ color: 'var(--text-secondary)' }}>
                        {order.cashierName}
                      </td>
                      <td className="py-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: `${METHOD_COLORS[methodKey] || '#94a3b8'}15`,
                            color: METHOD_COLORS[methodKey] || '#94a3b8',
                          }}
                        >
                          {METHOD_LABELS[methodKey] || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-black" style={{ color: 'var(--accent)' }}>
                        ${order.total.toFixed(2)}
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
        onReprint={(order) => handleReprint(order, { stopPropagation: () => {} })}
      />

      {/* ── Portal de ticket para reimpresión ── */}
      {selectedOrder && ReactDOM.createPortal(
        <TicketPrint order={selectedOrder} />,
        document.getElementById('ticket-print-root')
      )}
    </div>
  );
}
