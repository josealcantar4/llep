// src/pages/admin/ExpensesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Registro y listado de egresos de caja.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MinusCircle, PlusCircle, Calendar, DollarSign, FileText, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import ExpenseDetailModal from './ExpenseDetailModal.jsx';
import { getLocalDateString } from '../../utils/dateUtils.js';

const today = getLocalDateString();

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

  const [amount,  setAmount]  = useState('');
  const [concept, setConcept] = useState('');
  const [date,    setDate]    = useState(today);
  const [saving,  setSaving]  = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const { data: expenses, loading } = useFirestoreCollection('expenses', [
    where('shift', '==', today),
    orderBy('createdAt', 'desc'),
  ]);

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const handleSave = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return toast.error('Ingresa un monto válido');
    if (!concept.trim())        return toast.error('Escribe el concepto del egreso');

    setSaving(true);
    try {
      await addDoc(collection(db, 'expenses'), {
        amount:       amt,
        concept:      concept.trim(),
        date,
        shift:        today,
        registeredBy: user.uid,
        registeredByName: user.displayName ?? user.name ?? user.email,
        createdAt:    serverTimestamp(),
      });
      toast.success('Egreso registrado');
      setAmount('');
      setConcept('');
      setDate(today);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el egreso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px', paddingBottom: '48px', display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.2s ease' }}>

      {/* ── Encabezado Estructurado ─────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
            Registro de Egresos
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.8 }}>
            Salidas de dinero de la caja del día · {today}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          style={{ padding: '16px 28px', borderRadius: '20px', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 25px -5px rgba(245,158,11,0.4)' }}
        >
          <PlusCircle size={20} strokeWidth={2.5} /> Nuevo Egreso
        </button>
      </div>

      {/* ── Tarjeta Resumen Total ───────────────────────────────────────── */}
      {expenses.length > 0 && (
        <div 
          style={{ 
            position: 'relative', overflow: 'hidden', 
            background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '28px', 
            padding: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          {/* Brillo de fondo (Glow) */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 10 }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MinusCircle size={28} color="#ef4444" strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4px' }}>
                Total Salidas Hoy
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', lineHeight: 1, margin: 0 }}>
                -${totalExpenses.toFixed(2)}
              </p>
            </div>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', position: 'relative', zIndex: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '9999px' }}>
            {expenses.length} {expenses.length === 1 ? 'egreso' : 'egresos'}
          </span>
        </div>
      )}

      {/* ── Lista de Egresos del Día ────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '28px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '10px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MinusCircle size={24} color="#ef4444" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Egresos de Hoy</h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><LoadingSpinner size="lg" /></div>
        ) : expenses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, padding: '64px 0' }}>
            <MinusCircle size={48} style={{ marginBottom: '16px', opacity: 0.5, color: 'var(--text-secondary)' }} />
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>No se han registrado salidas de dinero hoy.</p>
            <button 
              onClick={() => setShowForm(true)} 
              className="btn-ghost" 
              style={{ marginTop: '16px', fontWeight: 800, borderRadius: '12px', padding: '12px 24px' }}
            >
              Registrar primer egreso
            </button>
          </div>
        ) : (
          <div className="custom-scrollbar" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Hora</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Concepto</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap' }}>Registrado Por</th>
                  <th style={{ padding: '0 16px 16px 16px', whiteSpace: 'nowrap', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => {
                  const d = exp.createdAt?.toDate?.() ?? new Date();
                  return (
                    <tr 
                      key={exp.id} 
                      onClick={() => setSelectedExpense(exp)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap', borderRadius: '16px 0 0 16px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                          {exp.concept}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {exp.registeredByName}
                        </span>
                      </td>
                      <td style={{ padding: '18px 16px', whiteSpace: 'nowrap', textAlign: 'right', borderRadius: '0 16px 16px 0' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ef4444' }}>
                          -${exp.amount.toFixed(2)}
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

      {/* ── Modal: Nuevo Egreso (Portal) ────────────────────────────────── */}
      {showForm && createPortal(
        /* Overlay */
        <div 
          onClick={() => setShowForm(false)} 
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease', overflowY: 'auto' }}
        >
          {/* Panel */}
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '32px', padding: '36px', width: '100%', maxWidth: '560px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)', position: 'relative', overflow: 'hidden', margin: 'auto' }}
          >
            {/* Brillo de fondo modal */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'rgba(239,68,68,0.1)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            {/* Header del Modal */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 10 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                  <PlusCircle size={24} />
                </div>
                Registrar Egreso
              </h2>
              <button 
                onClick={() => setShowForm(false)} 
                className="btn-ghost" 
                style={{ width: '40px', height: '40px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Formulario */}
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 10 }}>
              
              {/* Monto */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <DollarSign size={14} color="var(--accent)" /> Monto *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: 900 }}>$</span>
                  <input 
                    className="pos-input" 
                    type="number" min="0.01" step="0.01" placeholder="0.00" required autoFocus
                    value={amount} onChange={(e) => setAmount(e.target.value)} 
                    style={{ width: '100%', padding: '16px 16px 16px 36px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }} 
                  />
                </div>
              </div>
              
              {/* Concepto */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <FileText size={14} color="var(--accent)" /> Concepto *
                </label>
                <input 
                  className="pos-input" 
                  placeholder="Ej: Compra de insumos..." required
                  value={concept} onChange={(e) => setConcept(e.target.value)} 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }} 
                />
              </div>
              
              {/* Fecha */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <Calendar size={14} color="var(--accent)" /> Fecha
                </label>
                <input 
                  className="pos-input" 
                  type="date" max={today}
                  value={date} onChange={(e) => setDate(e.target.value)} 
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }} 
                />
              </div>
              
              {/* Botón de Guardar */}
              <div style={{ paddingTop: '24px', marginTop: '8px', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="btn-primary" 
                  style={{ width: '100%', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1rem', fontWeight: 800, borderRadius: '20px', boxShadow: '0 10px 25px -5px rgba(245,158,11,0.4)' }}
                >
                  {saving ? <LoadingSpinner size="sm" /> : <><PlusCircle size={20} strokeWidth={2.5} /> Guardar Egreso</>}
                </button>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Componente Secundario: Modal de Detalle ─────────────────────── */}
      <ExpenseDetailModal isOpen={!!selectedExpense} onClose={() => setSelectedExpense(null)} expense={selectedExpense} />
      
    </div>
  );
}