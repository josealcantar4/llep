// src/pages/admin/UsersAdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestión de usuarios: Listado, creación, edición, desactivación.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { UserPlus, Save, Edit2, Ban, CheckCircle, Mail, AlertCircle, Key, ArrowLeft } from 'lucide-react';
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
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Gestión de Usuarios
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Crea, edita o desactiva empleados del POS.
          </p>
        </div>
        {!showForm && (
          <button onClick={handleAddNew} className="btn-primary text-sm flex items-center gap-2">
            <UserPlus size={16} />
            Añadir Usuario
          </button>
        )}
      </div>

      {showForm ? (
        /* ── Formulario ────────────────────────────────────────────────────── */
        <div className="pos-card p-6 animate-slideUp">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              {editingId ? <Edit2 size={20} color="var(--accent)" /> : <UserPlus size={20} color="var(--accent)" />}
              {editingId ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <button onClick={cancelEdit} className="btn-ghost flex items-center gap-2 text-sm px-3 py-1.5">
              <ArrowLeft size={16} />
              Volver a la lista
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Nombre Completo (Ticket) *
                </label>
                <input type="text" name="displayName" value={formData.displayName} onChange={handleChange}
                  className="pos-input" placeholder="Juan Pérez" required autoComplete="off" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Username (Login rápido) *
                </label>
                <input type="text" name="username" value={formData.username} onChange={handleChange}
                  className="pos-input" placeholder="juan_ventas" required autoComplete="off" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Rol en el sistema *
                </label>
                <select name="role" value={formData.role} onChange={handleChange} className="pos-input bg-transparent">
                  <option value="sales">Ventas (Cajero)</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Correo Electrónico {formData.role === 'admin' && <span className="text-red-500 font-bold ml-1">*</span>}
                </label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange}
                  className="pos-input" 
                  placeholder={formData.role === 'admin' ? "Requerido para admin..." : "Opcional para ventas..."} 
                  required={formData.role === 'admin'}
                  style={formData.role === 'admin' ? { border: '1px solid var(--accent)' } : {}}
                />
              </div>
            </div>

            {!editingId && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Contraseña *
                </label>
                <input type="password" name="password" value={formData.password} onChange={handleChange}
                  className="pos-input max-w-sm" placeholder="Mínimo 6 caracteres" required autoComplete="new-password" />
              </div>
            )}

            <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button type="submit" disabled={loading} className="btn-primary py-3 text-sm flex justify-center gap-2 max-w-sm">
                {loading ? <LoadingSpinner size="sm" /> : <><Save size={16} /> {editingId ? 'Guardar Cambios' : 'Crear Usuario'}</>}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ── Lista de usuarios ─────────────────────────────────────────────── */
        <div className="pos-card p-0 overflow-hidden animate-fadeIn">
          {loadingUsers ? (
            <div className="flex justify-center p-10"><LoadingSpinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isShortUser = !u.email || u.email.endsWith('@llep.pos');
                    const isActive = u.active !== false;

                    return (
                      <tr key={u.id} className="border-t transition-colors hover:bg-white/5" style={{ borderColor: 'var(--border)', opacity: isActive ? 1 : 0.5 }}>
                        <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          {u.displayName || '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-amber-500">
                          {u.username || '-'}
                        </td>
                        <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1.5">
                            {isShortUser ? <AlertCircle size={12} className="text-slate-500" /> : <Mail size={12} />}
                            {isShortUser ? 'No registrado' : u.email}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-500/20 text-slate-400'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Sales'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                            {isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isShortUser && (
                              <button onClick={() => handleResetPassword(u.email)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400" title="Restablecer Contraseña">
                                <Key size={14} />
                              </button>
                            )}
                            <button onClick={() => startEdit(u)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400" title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleToggleActive(u.id, isActive)} className={`p-1.5 rounded-lg hover:bg-white/10 ${isActive ? 'text-red-400 hover:text-red-500' : 'text-emerald-400 hover:text-emerald-500'}`} title={isActive ? 'Desactivar' : 'Reactivar'}>
                              {isActive ? <Ban size={14} /> : <CheckCircle size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No hay usuarios registrados.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
