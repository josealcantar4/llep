// src/components/print/TicketPrint.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Componente de ticket de compra para impresoras térmicas 58mm / 80mm.
// Se monta en el portal #ticket-print-root para que @media print
// sólo muestre este contenido y oculte toda la UI.
// ─────────────────────────────────────────────────────────────────────────────
import React, { forwardRef } from 'react';

/**
 * @param {Object} order - Datos completos de la orden pagada
 * @param {string} restaurantName - Nombre del restaurante
 */
const TicketPrint = forwardRef(function TicketPrint({ order, restaurantName = 'LLEP RESTAURANT' }, ref) {
  if (!order) return null;

  const {
    tableName,
    items = [],
    subtotal = 0,
    tip     = 0,
    total   = 0,
    paymentMethod,
    reference,
    cashierName,
    createdAt,
  } = order;

  // Formatear fecha/hora
  const date = createdAt?.toDate ? createdAt.toDate() : new Date();
  const dateStr = date.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit',
  });

  const methodLabel = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
  }[paymentMethod] ?? paymentMethod;

  return (
    <div ref={ref} id="ticket-content">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="ticket-header">
        <h1>{restaurantName}</h1>
        <p>Sistema POS · LLEP</p>
        <p>{dateStr} {timeStr}</p>
      </div>

      <div className="ticket-divider" />

      {/* Mesa y cajero */}
      <div className="ticket-row"><span>Mesa:</span><span>{tableName}</span></div>
      <div className="ticket-row"><span>Cajero:</span><span>{cashierName}</span></div>

      <div className="ticket-divider" />

      {/* ── ÍTEMS ───────────────────────────────────────────────────────── */}
      <div style={{ fontSize: '9px', marginBottom: '2px', fontWeight: 'bold' }}>
        DESCRIPCIÓN
      </div>
      {items.map((item, idx) => {
        const extrasTotal = (item.extras ?? []).reduce((s, e) => s + e.price, 0);
        const lineTotal   = (item.price + extrasTotal) * item.qty;
        return (
          <div key={idx}>
            <div className="ticket-row">
              <span className="ticket-item-name">
                {item.qty}x {item.name}
                {item.isFree ? ' *' : ''}
              </span>
              <span className="ticket-item-price">${lineTotal.toFixed(2)}</span>
            </div>
            {/* Extras */}
            {(item.extras ?? []).map((ex, ei) => (
              <div key={ei} className="ticket-row" style={{ paddingLeft: '8px', fontSize: '8px' }}>
                <span>+ {ex.name}</span>
                <span>${ex.price.toFixed(2)}</span>
              </div>
            ))}
            {/* Notas */}
            {item.notes && (
              <div style={{ paddingLeft: '8px', fontSize: '8px', fontStyle: 'italic' }}>
                Nota: {item.notes}
              </div>
            )}
          </div>
        );
      })}

      <div className="ticket-divider" />

      {/* ── TOTALES ─────────────────────────────────────────────────────── */}
      <div className="ticket-row">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      {tip > 0 && (
        <div className="ticket-row">
          <span>Propina</span>
          <span>${tip.toFixed(2)}</span>
        </div>
      )}
      <div className="ticket-total">
        <span>TOTAL</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="ticket-divider" />

      {/* ── PAGO ────────────────────────────────────────────────────────── */}
      <div className="ticket-row">
        <span>Forma de pago</span>
        <span>{methodLabel}</span>
      </div>
      {reference && (
        <div className="ticket-row">
          <span>Referencia</span>
          <span style={{ maxWidth: '28mm', textAlign: 'right', wordBreak: 'break-all' }}>
            {reference}
          </span>
        </div>
      )}

      <div className="ticket-divider" />

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <div className="ticket-footer">
        <p>¡Gracias por su visita!</p>
        <p>LLEP Restaurant</p>
        {items.some((i) => i.isFree) && (
          <p style={{ marginTop: '3px', fontSize: '8px' }}>* Artículo de venta libre</p>
        )}
      </div>
    </div>
  );
});

export default TicketPrint;
