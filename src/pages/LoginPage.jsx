// src/pages/LoginPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Pantalla de inicio de sesión con email/password.
// Redirige automáticamente si el usuario ya está autenticado.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginWithEmail } from '../firebase/auth.js';
import useAuthStore from '../store/useAuthStore.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';

export default function LoginPage() {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [busy,     setBusy]     = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  if (loading) return <LoadingSpinner fullScreen />;
  if (user)    return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Completa todos los campos');
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.code === 'auth/invalid-credential'
        ? 'Correo o contraseña incorrectos'
        : 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, rgba(245,158,11,0.12) 0%, transparent 60%), var(--bg-primary)',
      }}
    >
      {/* Card de login */}
      <div className="glass rounded-2xl w-full max-w-sm p-8 animate-slideUp shadow-2xl">
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}
          >
            <UtensilsCrossed size={32} color="#0f172a" strokeWidth={2.5} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              LLEP POS
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Sistema de Punto de Venta
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Correo electrónico
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-secondary)' }} />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@llep.com"
                className="pos-input pl-9"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contraseña
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                   style={{ color: 'var(--text-secondary)' }} />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pos-input pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            disabled={busy}
            className="btn-primary flex items-center justify-center gap-2 mt-2 py-3 text-sm"
          >
            {busy ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <LogIn size={16} />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-secondary)' }}>
          LLEP Restaurant POS · v1.0.0
        </p>
      </div>
    </div>
  );
}
