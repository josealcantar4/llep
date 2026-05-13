// src/pages/admin/ExpensesPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Registro y listado de egresos de caja.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { where, orderBy, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MinusCircle, PlusCircle, Calendar, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useAuthStore from '../../store/useAuthStore.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

const today = new Date().toISOString().split('T')[0];

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);

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
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Registro de Egresos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Salidas de dinero de la caja del día
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary text-sm flex items-center gap-2 min-h-[48px] px-5">
            <PlusCircle size={16} />
            Nuevo Egreso
          </button>
        )}
      </div>

      {showForm ? (
        /* ── Formulario ────────────────────────────────────────────────── */
        <div className="pos-card p-6 animate-slideUp max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <PlusCircle size={20} color="var(--accent)" />
              Registrar Nuevo Egreso
            </h2>
            <button onClick={() => setShowForm(false)} className="btn-ghost flex items-center gap-2 text-sm px-3 py-1.5">
              <ArrowLeft size={16} /> Volver
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5 pb-20">
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
                  className="pos-input pl-7 text-lg font-bold"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
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

            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                id="btn-save-expense"
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base min-h-[56px]"
              >
                {saving ? <LoadingSpinner size="sm" /> : <PlusCircle size={16} />}
                Guardar Egreso
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Lista de egresos del día ──────────────────────────────────── */
        <div className="pos-card p-0 overflow-hidden animate-fadeIn">
          <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <MinusCircle size={16} color="#ef4444" />
              Egresos de Hoy ({today})
            </h2>
            {expenses.length > 0 && (
              <div className="text-right">
                <span className="text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>Total Salidas:</span>
                <span className="font-black text-lg" style={{ color: '#ef4444' }}>
                  -${totalExpenses.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner />
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <MinusCircle size={40} color="var(--border)" />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No se han registrado salidas de dinero hoy.
              </p>
              <button onClick={() => setShowForm(true)} className="btn-ghost mt-2 text-xs">
                Registrar primer egreso
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th className="px-5 py-3 font-medium">Hora</th>
                    <th className="px-5 py-3 font-medium">Concepto</th>
                    <th className="px-5 py-3 font-medium">Registrado Por</th>
                    <th className="px-5 py-3 font-medium text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const d = exp.createdAt?.toDate?.() ?? new Date();
                    return (
                      <tr key={exp.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                          {d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {exp.concept}
                        </td>
                        <td className="px-5 py-3" style={{ color: 'var(--text-secondary)' }}>
                          {exp.registeredByName}
                        </td>
                        <td className="px-5 py-3 font-bold text-right" style={{ color: '#ef4444' }}>
                          -${exp.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
