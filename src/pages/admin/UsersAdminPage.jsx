// src/pages/admin/UsersAdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestión de usuarios: Listado, creación, edición, desactivación.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { UserPlus, Save, Edit2, Ban, CheckCircle, Mail, AlertCircle, Key, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { orderBy } from 'firebase/firestore';
import { createEmployee, updateEmployee, resetEmployeePassword } from '../../firebase/users.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

export default function UsersAdminPage() {
  const { data: users, loading: loadingUsers } = useFirestoreCollection('users', [
    orderBy('createdAt', 'desc')
  ]);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false); // Toggle UI state

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    role: 'sales',
  });

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const startEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      displayName: user.displayName || '',
      username: user.username || '',
      email: user.email?.endsWith('@llep.pos') ? '' : (user.email || ''),
      password: '',
      role: user.role,
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ displayName: '', username: '', email: '', password: '', role: 'sales' });
    setShowForm(false);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ displayName: '', username: '', email: '', password: '', role: 'sales' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.displayName || !formData.username) {
      return toast.error('Nombre completo y Username son obligatorios');
    }

    // Validación estricta: si es admin, el email es obligatorio
    if (formData.role === 'admin' && !formData.email) {
      return toast.error('El Email es obligatorio para los Administradores');
    }

    setLoading(true);

    try {
      if (editingId) {
        // En edición, actualizamos el correo en Firestore (Nota: no cambia el login de Firebase Auth,
        // pero sí lo actualiza en la base de datos para visualización).
        await updateEmployee(editingId, {
          username: formData.username,
          displayName: formData.displayName,
          role: formData.role,
          email: formData.email,
        });
        toast.success('Usuario actualizado');
        cancelEdit();
      } else {
        if (!formData.password || formData.password.length < 6) {
          toast.error('La contraseña debe tener mínimo 6 caracteres');
          return setLoading(false);
        }
        await createEmployee(
          formData.username,
          formData.email,
          formData.password,
          formData.role,
          formData.displayName
        );
        toast.success('Usuario creado exitosamente');
        cancelEdit();
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateEmployee(id, { active: !currentStatus });
      toast.success(currentStatus ? 'Usuario desactivado' : 'Usuario reactivado');
    } catch (e) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleResetPassword = async (email) => {
    if (!email || email.endsWith('@llep.pos')) {
      toast('Esta cuenta no tiene un correo real. Crea un usuario nuevo o contáctate con soporte.', {
        icon: 'ℹ️',
        duration: 6000
      });
      return;
    }
    try {
      await resetEmployeePassword(email);
      toast.success(`Correo enviado a ${email}`);
    } catch (e) {
      toast.error('Error al enviar correo');
    }
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 64px' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end',
        justifyContent: 'space-between', gap: '16px',
        marginBottom: '40px', paddingBottom: '28px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
            Gestión de Usuarios
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '6px', color: 'var(--text-secondary)', opacity: 0.7 }}>
            Crea, edita o desactiva empleados del POS · {users.length} usuarios
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary"
          style={{ padding: '12px 22px', borderRadius: '16px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px' }}
        >
          <UserPlus size={18} /> Añadir Usuario
        </button>
      </div>

      {/* ── Lista de usuarios ────────────────────────────────────────────── */}
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border)]"
        style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
      >
        {loadingUsers ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                <tr style={{ color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nombre</th>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Usuario</th>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</th>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rol</th>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Estado</th>
                  <th style={{ padding: '14px 28px', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const isShortUser = !u.email || u.email.endsWith('@llep.pos');
                  const isActive = u.active !== false;
                  return (
                    <tr key={u.id} className="hover:bg-white/5" style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s', opacity: isActive ? 1 : 0.5 }}>
                      <td style={{ padding: '16px 28px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.displayName || '-'}</td>
                      <td style={{ padding: '16px 28px', fontWeight: 600, color: '#f59e0b' }}>{u.username || '-'}</td>
                      <td style={{ padding: '16px 28px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isShortUser ? <AlertCircle size={12} className="text-slate-500" /> : <Mail size={12} />}
                          {isShortUser ? 'No registrado' : u.email}
                        </span>
                      </td>
                      <td style={{ padding: '16px 28px' }}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-400'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Sales'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 28px' }}>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 28px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                          {!isShortUser && (
                            <button onClick={() => handleResetPassword(u.email)} className="hover:bg-white/10" style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'background 0.15s' }} title="Restablecer Contraseña"><Key size={16} /></button>
                          )}
                          <button onClick={() => startEdit(u)} className="hover:bg-white/10" style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', transition: 'background 0.15s' }} title="Editar"><Edit2 size={16} /></button>
                          <button onClick={() => handleToggleActive(u.id, isActive)} className={isActive ? 'hover:bg-red-500/10' : 'hover:bg-emerald-500/10'} style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: isActive ? '#f87171' : '#34d399', transition: 'background 0.15s' }} title={isActive ? 'Desactivar' : 'Reactivar'}>
                            {isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>No hay usuarios registrados.</div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal: Crear/Editar Usuario ─────────────────────────────────── */}
      {showForm && createPortal(
        <div onClick={cancelEdit} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', animation: 'fadeIn 0.2s ease' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '540px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                {editingId ? <Edit2 size={20} color="var(--accent)" /> : <UserPlus size={20} color="var(--accent)" />}
                {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={cancelEdit} className="btn-ghost" style={{ borderRadius: '12px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
            </div>
            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Nombre Completo *</label>
                  <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="pos-input" style={{ padding: '12px 16px' }} placeholder="Juan Pérez" required autoComplete="off" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Username *</label>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="pos-input" style={{ padding: '12px 16px' }} placeholder="juan_ventas" required autoComplete="off" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Rol *</label>
                  <select name="role" value={formData.role} onChange={handleChange} className="pos-input" style={{ background: 'var(--bg-primary)', cursor: 'pointer', padding: '12px 16px' }}>
                    <option value="sales">Ventas (Cajero)</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Email {formData.role === 'admin' && <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>}</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="pos-input" style={{ padding: '12px 16px', ...(formData.role === 'admin' ? { border: '1px solid var(--accent)' } : {}) }} placeholder={formData.role === 'admin' ? 'Requerido...' : 'Opcional...'} required={formData.role === 'admin'} />
                </div>
              </div>
              {!editingId && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>Contraseña *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="pos-input" style={{ padding: '12px 16px' }} placeholder="Mínimo 6 caracteres" required autoComplete="new-password" />
                </div>
              )}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
                  {loading ? <LoadingSpinner size="sm" /> : <><Save size={16} /> {editingId ? 'Guardar Cambios' : 'Crear Usuario'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
