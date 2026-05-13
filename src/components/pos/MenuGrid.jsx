// src/components/pos/MenuGrid.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Grid del menú dividido por categorías con tabs de filtro y búsqueda.
// Carga menú desde Firestore en tiempo real.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
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
      const matchCat  = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchSearch = search.trim() === '' ||
        item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [allItems, activeCategory, search]);

  if (loadingCats || loadingItems) {
    return (
      <div className="flex items-center justify-center h-48">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-secondary)' }} />
        <input
          id="menu-search"
          className="pos-input pl-9 pr-9 text-sm"
          placeholder="Buscar en el menú..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center transition-colors hover:bg-white/5 rounded-lg">
            <X size={18} color="var(--text-secondary)" />
          </button>
        )}
      </div>

      {/* Tabs de categorías */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <button
          id="cat-all"
          onClick={() => setActiveCategory('all')}
          className="flex-shrink-0 px-5 min-h-[48px] rounded-xl text-sm font-semibold transition-all flex items-center justify-center"
          style={{
            background: activeCategory === 'all' ? 'var(--accent)' : 'var(--bg-elevated)',
            color: activeCategory === 'all' ? '#0f172a' : 'var(--text-secondary)',
          }}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`cat-${cat.id}`}
            onClick={() => setActiveCategory(cat.id)}
            className="flex-shrink-0 px-5 min-h-[48px] rounded-xl text-sm font-semibold transition-all flex items-center justify-center whitespace-nowrap"
            style={{
              background: activeCategory === cat.id ? 'var(--accent)' : 'var(--bg-elevated)',
              color: activeCategory === cat.id ? '#0f172a' : 'var(--text-secondary)',
            }}
          >
            {cat.emoji && <span className="mr-2 text-lg">{cat.emoji}</span>}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Grid de ítems */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-10 gap-2">
          <Search size={28} color="var(--text-secondary)" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sin resultados para "{search}"
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto pb-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              id={`menu-item-${item.id}`}
              onClick={() => onSelectItem(item)}
              className="pos-card p-4 min-h-[100px] text-left flex flex-col gap-1.5 active:scale-95 transition-transform"
            >
              {/* Categoría badge */}
              <span className="text-xs font-medium"
                    style={{ color: 'var(--accent)' }}>
                {categories.find((c) => c.id === item.categoryId)?.emoji ?? '🍽️'}
              </span>
              <span className="text-sm font-semibold leading-tight"
                    style={{ color: 'var(--text-primary)' }}>
                {item.name}
              </span>
              {item.description && (
                <span className="text-xs leading-tight line-clamp-2"
                      style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </span>
              )}
              <span className="font-black text-base mt-auto pt-1"
                    style={{ color: 'var(--accent)' }}>
                ${item.price.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
