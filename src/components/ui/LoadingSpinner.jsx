// src/components/ui/LoadingSpinner.jsx
import React from 'react';

/**
 * Spinner de carga.
 * @param {boolean} fullScreen - Si true, ocupa toda la pantalla centrado.
 * @param {string}  size       - Tamaño del spinner: 'sm' | 'md' | 'lg'
 */
export default function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div
      className={`${sizes[size]} rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin`}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
           style={{ background: 'var(--bg-primary)' }}>
        {spinner}
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Cargando LLEP POS…
        </p>
      </div>
    );
  }

  return spinner;
}
