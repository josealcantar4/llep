// src/components/pos/TableCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta visual de una mesa. Muestra estado (libre/ocupada), tiempo
// transcurrido y número de ítems en cuenta. Permite abrir/ver la mesa.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, ShoppingBag, DoorOpen, ArrowRight } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import toast from 'react-hot-toast';

function formatElapsed(openedAt) {
  if (!openedAt) return '';
  const ms = Date.now() - openedAt.toMillis();
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return hours > 0 ? `${hours}h ${rem}m` : `${mins}m`;
}

export default function TableCard({ table }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState('');

  const isOpen = table.status === 'open';
  const itemCount = table.items?.length ?? 0;
  const subtotal = table.items?.reduce(
    (sum, it) => sum + it.price * it.qty + (it.extras?.reduce((s, e) => s + e.price, 0) ?? 0) * it.qty,
    0
  ) ?? 0;

  // Actualizar tiempo transcurrido cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    setElapsed(formatElapsed(table.openedAt));
    const iv = setInterval(() => setElapsed(formatElapsed(table.openedAt)), 30000);
    return () => clearInterval(iv);
  }, [isOpen, table.openedAt]);

  /** Abrir mesa (cambiar estado a "open" en Firestore) */
  const handleOpen = async () => {
    try {
      await updateDoc(doc(db, 'tables', table.id), {
        status: 'open',
        openedAt: serverTimestamp(),
        openedBy: user.uid,
        items: [],
      });
      navigate(`/order/${table.id}`);
    } catch (e) {
      toast.error('No se pudo abrir la mesa');
      console.error(e);
    }
  };

  /** Navegar a la orden activa */
  const handleGoToOrder = () => navigate(`/order/${table.id}`);

  return (
    <div
      id={`table-card-${table.id}`}
      onClick={isOpen ? handleGoToOrder : handleOpen}
      className={`group relative flex flex-col justify-between cursor-pointer select-none transition-all duration-500 overflow-hidden rounded-2xl ${isOpen
          ? 'min-h-[220px] shadow-[0_8px_30px_rgba(245,158,11,0.12)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)] border border-[rgba(245,158,11,0.3)] hover:border-[rgba(245,158,11,0.6)] hover:-translate-y-1.5'
          : 'min-h-[160px] shadow-lg hover:shadow-xl border border-[var(--border)] hover:border-slate-400/50 hover:-translate-y-1'
        }`}
      style={{
        background: isOpen
          ? 'linear-gradient(145deg, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 100%)' // Fondo oscuro premium para mesas activas
          : 'var(--bg-card)',
        padding: '1.5rem',
      }}
    >
      {/* Glow de fondo suave para mesas abiertas */}
      {isOpen && (
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      )}

      {/* HEADER: Nombre, Estado e Ícono (Acomodados en Filas) */}
      <div className="flex flex-col z-10 gap-3">

        {/* Fila 1: Nombre de la mesa (Ocupa todo el ancho) */}
        <div className="w-full pt-0.5">
          <h3 className="text-xl lg:text-2xl font-black tracking-tight leading-tight transition-colors duration-300 line-clamp-2"
            style={{
              color: isOpen ? '#f8fafc' : 'var(--text-primary)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
            {table.name}
          </h3>
        </div>

        {/* Fila 2: Badge de estado + Ícono */}
        <div className="flex items-center gap-3">
          {/* Badge o "Píldora" de Estado */}
          <span
            className={`inline-flex items-center rounded-full font-bold uppercase tracking-widest ${isOpen
                ? 'bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30'
                : 'bg-slate-500/10 text-slate-500 ring-1 ring-slate-500/20'
              }`}
            style={{
              paddingLeft: '10px', paddingRight: '10px', paddingTop: '6px', paddingBottom: '6px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
              whiteSpace: 'nowrap'
            }}
          >
            {isOpen ? 'En Servicio' : 'Disponible'}
          </span>

          {/* Icono de la mesa */}
          <div style={{ marginBottom: '10px', marginLeft: '10px', marginRight: '10px', marginTop: '10px' }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110 ${isOpen ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
              }`}
          >
            {isOpen ? <ChefHat size={24} strokeWidth={2.5} /> : <DoorOpen size={22} strokeWidth={2} />}
          </div>
        </div>

      </div>

      {/* FOOTER: Detalles y Total (SOLO MESA ABIERTA) */}
      {isOpen && (
        <div className="mt-6 flex flex-col gap-4 z-10">
          {/* Cajita de información (Tiempo y Artículos) */}
          <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 backdrop-blur-sm" style={{ paddingTop: '5px', paddingLeft: '10px', paddingRight: '10px', paddingBottom: '5px' }}>
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Clock size={14} className="text-amber-500/70" /> {elapsed}
            </span>
            <span className="w-px h-3 bg-slate-600 rounded-full" />
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ShoppingBag size={14} className="text-amber-500/70" /> {itemCount} ítem{itemCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Separador, Punto Pulsante y Total */}
          <div className="flex items-end justify-between pt-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-400">Activa</span>
            </div>

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Total</p>
              <p className="font-black text-2xl tracking-tight text-amber-500 leading-none">
                ${subtotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER: Botón sutil (SOLO MESA LIBRE) */}
      {!isOpen && (
        <div className="mt-8 flex items-center justify-between z-10 text-slate-400 group-hover:text-[var(--accent)] transition-colors duration-300">
          <p className="text-sm font-semibold tracking-wide">
            Toca para abrir
          </p>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">
            <ArrowRight size={16} strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
}