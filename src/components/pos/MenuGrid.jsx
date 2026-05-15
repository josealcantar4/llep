// src/components/pos/MenuGrid.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Grid del menú dividido por categorías con tabs de filtro y búsqueda.
// Diseño Premium Glassmorphism con espacios generosos y medidas estrictas.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { Search, X, ChefHat } from 'lucide-react';
import { orderBy } from 'firebase/firestore';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../ui/LoadingSpinner.jsx';

/**
 * @param {Function} onSelectItem - Callback con el ítem del menú seleccionado
 */
export default function MenuGrid({ onSelectItem }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const { data: categories, loading: loadingCats } =
    useFirestoreCollection('menuCategories', [orderBy('order', 'asc')]);

  const { data: allItems, loading: loadingItems } =
    useFirestoreCollection('menuItems');

  // Filtrar ítems por categoría activa + búsqueda
  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (!item.available) return false;
      const matchCat    = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchSearch = search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allItems, activeCategory, search]);

  if (loadingCats || loadingItems) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 opacity-70">
        <LoadingSpinner size="lg" />
        <span className="text-[13px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
          Preparando menú...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">

      {/* --- 1. BARRA DE BÚSQUEDA --- */}
      <div className="relative w-full max-w-3xl shrink-0" style={{ paddingLeft: '10px', paddingRight: '10px' }}>
        <div
          className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
          style={{ paddingLeft: '32px' }}
        >
          <Search size={20} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
        </div>

        <input
          id="menu-search"
          className="pos-input w-full text-[15px] rounded-2xl transition-all shadow-sm border border-[var(--border)] bg-[var(--bg-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ 
            color: 'var(--text-primary)',
            paddingLeft: '64px',   // Espacio reservado para la lupa
            paddingRight: '64px',  // Espacio reservado para la X
            paddingTop: '18px', 
            paddingBottom: '18px' 
          }}
          placeholder="Buscar un platillo, bebida o postre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center" style={{ paddingRight: '20px' }}>
            <button
              onClick={() => setSearch('')}
              className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:bg-[rgba(255,255,255,0.05)] rounded-xl"
            >
              <X size={20} color="var(--text-secondary)" />
            </button>
          </div>
        )}
      </div>

      {/* --- 2. TABS DE CATEGORÍAS --- */}
      <div className="flex gap-4 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
           style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '4px', paddingBottom: '12px' }}>
        
        <button
          id="cat-all"
          onClick={() => setActiveCategory('all')}
          className={`shrink-0 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center border ${activeCategory === 'all' ? 'hover:scale-[1.02]' : 'hover:bg-white/5'}`}
          style={{
            paddingLeft: '36px', paddingRight: '36px', paddingTop: '14px', paddingBottom: '14px',
            background:   activeCategory === 'all' ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
            color:        activeCategory === 'all' ? '#0f172a' : 'var(--text-secondary)',
            borderColor:  activeCategory === 'all' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
            boxShadow:    activeCategory === 'all' ? '0 10px 25px -5px rgba(245,158,11,0.4)' : 'none',
          }}
        >
          Todos
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`cat-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
            className={`shrink-0 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center whitespace-nowrap border ${activeCategory === cat.id ? 'hover:scale-[1.02]' : 'hover:bg-white/5'}`}
            style={{
              paddingLeft: '32px', paddingRight: '36px', paddingTop: '14px', paddingBottom: '14px',
              background:   activeCategory === cat.id ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              color:        activeCategory === cat.id ? '#0f172a' : 'var(--text-secondary)',
              borderColor:  activeCategory === cat.id ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
              boxShadow:    activeCategory === cat.id ? '0 10px 25px -5px rgba(245,158,11,0.4)' : 'none',
            }}
          >
            {cat.emoji && <span className="text-lg" style={{ marginRight: '10px' }}>{cat.emoji}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {/* --- 3. GRID DE ÍTEMS --- */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 opacity-50" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
          <ChefHat size={48} strokeWidth={1.5} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
          <p className="text-[15px] font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            No se encontró nada para "{search}"
          </p>
        </div>
      ) : (

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
             style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '16px', paddingBottom: '128px' }}>
          {filteredItems.map((item) => {
            const catEmoji = categories.find((c) => c.id === item.categoryId)?.emoji ?? '🍽️';

            return (
              <button
                key={item.id}
                id={`menu-item-${item.id}`}
                onClick={() => onSelectItem(item)}
                className="group relative min-h-[185px] text-left flex flex-col justify-between rounded-[1.5rem] transition-all duration-300 hover:scale-[1.02] active:scale-95 overflow-hidden"
                style={{
                  paddingLeft: '28px',    // Margen izquierdo súper amplio
                  paddingRight: '28px',   // Margen derecho protegido
                  paddingTop: '28px',     // Respiro superior
                  paddingBottom: '28px',  // Respiro inferior
                  background:    'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  border:        '1px solid rgba(255,255,255,0.07)',
                  boxShadow:     '0 10px 30px rgba(0, 0, 0, 0.08)',
                  backdropFilter:'blur(10px)',
                }}
              >
                {/* MARCA DE AGUA — Emoji gigante de fondo */}
                <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.04] transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12 pointer-events-none grayscale">
                  {catEmoji}
                </div>

                {/* CONTENIDO SUPERIOR */}
                <div className="relative z-10 flex flex-col" style={{ paddingRight: '10px' }}>
                  <div className="flex items-center mb-1">
                    <span className="text-xl drop-shadow-md" style={{ marginRight: '8px', marginBottom: '8px' }}>
                      {catEmoji}
                    </span>
                  </div>
                  <span
                    className="text-[16px] sm:text-[17px] font-black leading-tight drop-shadow-sm transition-colors group-hover:text-[var(--accent)]"
                    style={{ color: 'var(--text-primary)', marginBottom: '6px' }}
                  >
                    {item.name}
                  </span>
                </div>

                {/* PRECIO */}
                <div className="relative z-10 flex items-center justify-between" style={{ marginTop: '24px' }}>
                  <span
                    className="font-black text-2xl tracking-tight transition-transform group-hover:scale-105 origin-left"
                    style={{ color: 'var(--accent)' }}
                  >
                    ${item.price.toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}