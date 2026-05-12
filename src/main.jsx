// src/main.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada de la aplicación.
// Monta React, escucha cambios de Auth y carga el perfil del usuario.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import { onAuthChange, getUserProfile, logout } from './firebase/auth.js';
import useAuthStore from './store/useAuthStore.js';

function Root() {
  const { setUser, clearUser } = useAuthStore();

  useEffect(() => {
    // Escuchar cambios de autenticación y obtener el perfil completo (con rol)
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile && profile.active === false) {
          toast.error('Tu cuenta ha sido desactivada');
          await logout();
          clearUser();
        } else {
          setUser(profile ?? { uid: firebaseUser.uid, email: firebaseUser.email, role: 'sales', active: true });
        }
      } else {
        clearUser();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
        }}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
