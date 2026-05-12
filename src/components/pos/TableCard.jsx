// src/components/pos/TableCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Tarjeta visual de una mesa. Muestra estado (libre/ocupada), tiempo
// transcurrido y número de ítems en cuenta. Permite abrir/ver la mesa.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Clock, ShoppingBag, DoorOpen } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import toast from 'react-hot-toast';

/**
 * Formatea milisegundos transcurridos como "1h 23m" o "45m"
 */
function formatElapsed(openedAt) {
  if (!openedAt) return '';
  const ms    = Date.now() - openedAt.toMillis();
  const mins  = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const rem   = mins % 60;
  return hours > 0 ? `${hours}h ${rem}m` : `${mins}m`;
}

export default function TableCard({ table }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState('');

  const isOpen = table.status === 'open';
  const itemCount = table.items?.length ?? 0;
  const subtotal  = table.items?.reduce(
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
        status:   'open',
        openedAt: serverTimestamp(),
        openedBy: user.uid,
        items:    [],
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
      className="pos-card p-5 cursor-pointer select-none"
      onClick={isOpen ? handleGoToOrder : handleOpen}
      style={{
        borderColor: isOpen ? 'rgba(245,158,11,0.4)' : 'var(--border)',
        background:  isOpen
          ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(30,41,59,1) 100%)'
          : 'var(--bg-card)',
      }}
    >
      {/* Header: número y estado */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
            {isOpen ? 'EN SERVICIO' : 'DISPONIBLE'}
          </p>
          <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
            {table.name}
          </h3>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: isOpen
              ? 'rgba(245,158,11,0.15)'
              : 'rgba(148,163,184,0.1)',
          }}
        >
          {isOpen
            ? <ChefHat size={20} color="var(--accent)" />
            : <DoorOpen size={20} color="var(--text-secondary)" />
          }
        </div>
      </div>

      {/* Info de cuenta (solo si está abierta) */}
      {isOpen && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {elapsed}
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag size={12} /> {itemCount} ítem{itemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t"
               style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total parcial</span>
            <span className="font-bold text-base" style={{ color: 'var(--accent)' }}>
              ${subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Botón cuando está libre */}
      {!isOpen && (
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          Toca para abrir esta mesa →
        </p>
      )}

      {/* Indicador de ocupación (punto pulsante) */}
      {isOpen && (
        <div className="flex items-center gap-1.5 mt-3">
          <span className="animate-pulse-ring w-2 h-2 rounded-full bg-amber-500 inline-block" />
          <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            Cuenta abierta
          </span>
        </div>
      )}
    </div>
  );
}
