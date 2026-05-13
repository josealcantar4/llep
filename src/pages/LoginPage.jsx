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

  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  if (loading) return <LoadingSpinner fullScreen />;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameInput || !password) return toast.error('Por favor, completa todos los campos.');
    setBusy(true);
    try {
      const finalEmail = usernameInput.includes('@') ? usernameInput : `${usernameInput}@llep.pos`;
      await loginWithEmail(finalEmail, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      const msg = err.code === 'auth/invalid-credential'
        ? 'Correo o contraseña incorrectos'
        : 'Hubo un error al intentar iniciar sesión. Inténtalo de nuevo.';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'radial-gradient(ellipse at 60% 0%, rgba(245,158,11,0.12) 0%, transparent 60%), var(--bg-primary)',
      }}
    >
      {/* Card de login - pt-12 y sm:pt-16 empujan el contenido fuertemente hacia abajo */}
      <div className="glass rounded-2xl w-full max-w-md p-8 sm:p-12 pt-12 sm:pt-16 shadow-2xl flex flex-col gap-8">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-[var(--bg-primary)] shadow-sm border border-[var(--border)]" style={{ marginTop: '20px' }}>
            <UtensilsCrossed 
              className="w-14 h-14 shrink-0 text-[var(--accent)]" 
              strokeWidth={2} 
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              LLEP POS
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
              Sistema de Punto de Venta
            </p>
          </div>
        </div>

        {/* Contenedor para CENTRAR y LIMITAR EL ANCHO de los campos */}
        <div className="w-full flex justify-center mt-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-w-[320px]">
            
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-secondary)' }}>
                Usuario o Correo
              </label>
              {/* Ajuste: pl-8 crea una separación muy marcada a la izquierda del icono */}
              <div className="flex items-center gap-4 pl-8 pr-4 min-h-[52px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all overflow-hidden shadow-sm">
                <Mail size={20} className="shrink-0" style={{ color: 'var(--text-secondary)', marginLeft: '20px' }} />
                <input
                  id="login-username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                  placeholder="juan_ventas"
                  className="flex-1 bg-transparent outline-none w-full text-[var(--text-primary)]"
                  autoComplete="username"
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Por favor, ingresa tu usuario o correo.')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              {/* Ajuste: pl-8 crea una separación muy marcada a la izquierda del icono */}
              <div className="flex items-center gap-4 pl-8 pr-4 min-h-[52px] rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] focus-within:ring-2 focus-within:ring-[var(--accent)] transition-all overflow-hidden shadow-sm">
                <Lock size={20} className="shrink-0" style={{ color: 'var(--text-secondary)', marginLeft: '20px' }} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none w-full text-[var(--text-primary)]"
                  autoComplete="current-password"
                  required
                  onInvalid={(e) => e.target.setCustomValidity('Por favor, ingresa tu contraseña.')}
                  onInput={(e) => e.target.setCustomValidity('')}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={busy}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-3 text-[15px] min-h-[52px] rounded-xl font-bold shadow-md transition-all hover:-translate-y-[1px]"
            >
              {busy ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <LogIn size={20} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
          LLEP Restaurant POS · v1.0.0
        </p>
      </div>
    </div>
  );
}