// src/pages/admin/ExpensesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Registro y listado de egresos de caja.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MinusCircle, PlusCircle, Calendar, DollarSign, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

const today = new Date().toISOString().split('T')[0];

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [amount,  setAmount]  = useState('');
  const [concept, setConcept] = useState('');
  const [date,    setDate]    = useState(today);
  const [saving,  setSaving]  = useState(false);

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
        registeredByName: user.name ?? user.email,
        createdAt:    serverTimestamp(),
      });
      toast.success('Egreso registrado');
      setAmount('');
      setConcept('');
      setDate(today);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar el egreso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
          Registro de Egresos
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Salidas de dinero de la caja del día
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Formulario ────────────────────────────────────────────────── */}
        <div className="pos-card p-5">
          <h2 className="font-bold text-sm mb-4 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}>
            <PlusCircle size={16} color="var(--accent)" />
            Nuevo Egreso
          </h2>
          <form onSubmit={handleSave} className="space-y-4">

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                <DollarSign size={12} /> Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--text-secondary)' }}>$</span>
                <input
                  id="expense-amount"
                  className="pos-input pl-7"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                <FileText size={12} /> Concepto / Descripción *
              </label>
              <input
                id="expense-concept"
                className="pos-input"
                placeholder="Ej: Compra de insumos, pago de servicio..."
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5"
                     style={{ color: 'var(--text-secondary)' }}>
                <Calendar size={12} /> Fecha
              </label>
              <input
                id="expense-date"
                className="pos-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={today}
              />
            </div>

            <button
              id="btn-save-expense"
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm"
            >
              {saving ? <LoadingSpinner size="sm" /> : <PlusCircle size={16} />}
              Registrar Egreso
            </button>
          </form>
        </div>

        {/* ── Lista de egresos del día ──────────────────────────────────── */}
        <div className="pos-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}>
              <MinusCircle size={16} color="#ef4444" />
              Egresos de hoy
            </h2>
            {expenses.length > 0 && (
              <div className="text-right">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total</p>
                <p className="font-black text-lg" style={{ color: '#ef4444' }}>
                  -${totalExpenses.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-10 gap-2">
              <MinusCircle size={32} color="var(--text-secondary)" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Sin egresos registrados hoy
              </p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto">
              {expenses.map((exp) => {
                const date = exp.createdAt?.toDate?.() ?? new Date();
                return (
                  <div key={exp.id}
                       className="flex items-start justify-between p-3 rounded-xl"
                       style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate"
                         style={{ color: 'var(--text-primary)' }}>
                        {exp.concept}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        {' · '}{exp.registeredByName}
                      </p>
                    </div>
                    <span className="font-bold ml-3 flex-shrink-0" style={{ color: '#ef4444' }}>
                      -${exp.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
