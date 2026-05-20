// src/pages/admin/MenuAdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestión completa del menú: categorías e ítems.
// Los formularios ahora se muestran como modales portals.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  updateDoc, deleteDoc,
  doc, orderBy,
} from 'firebase/firestore';
import {
  UtensilsCrossed, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import CategoryModal from './CategoryModal.jsx';
import ItemModal from './ItemModal.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   Página principal
══════════════════════════════════════════════════════════════════════════ */
export default function MenuAdminPage() {
  const { data: categories, loading: loadingCats } =
    useFirestoreCollection('menuCategories', [orderBy('order', 'asc')]);
  const { data: items, loading: loadingItems } =
    useFirestoreCollection('menuItems');

  // Modales
  const [showCatModal,  setShowCatModal]  = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  // Datos para editar
  const [editCat,  setEditCat]  = useState(null);
  const [editItem, setEditItem] = useState(null);

  // Categorías expandidas
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── Helpers para abrir modales ──────────────────────────────────────── */
  const openNewCat  = () => { setEditCat(null);  setShowCatModal(true);  };
  const openEditCat = (cat) => { setEditCat(cat); setShowCatModal(true); };

  const openNewItem  = (categoryId) => { setEditItem(categoryId ? { categoryId } : null); setShowItemModal(true); };
  const openEditItem = (item) => { setEditItem(item); setShowItemModal(true); };

  const closeCatModal  = () => { setShowCatModal(false);  setEditCat(null);  };
  const closeItemModal = () => { setShowItemModal(false); setEditItem(null); };

  /* ── Eliminar categoría ────────────────────────────────────────────── */
  const deleteCategory = async (cat) => {
    const hasItems = items.some((i) => i.categoryId === cat.id);
    if (hasItems) return toast.error('Elimina primero los platillos de esta categoría');
    if (!window.confirm(`¿Eliminar categoría "${cat.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'menuCategories', cat.id));
      toast.success('Categoría eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  /* ── Eliminar ítem ─────────────────────────────────────────────────── */
  const deleteItem = async (item) => {
    if (!window.confirm(`¿Eliminar platillo "${item.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'menuItems', item.id));
      toast.success('Platillo eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  /* ── Alternar disponibilidad ────────────────────────────────────────── */
  const toggleAvailable = async (item) => {
    try {
      await updateDoc(doc(db, 'menuItems', item.id), { available: !item.available });
    } catch { toast.error('Error al actualizar'); }
  };

  if (loadingCats || loadingItems) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <LoadingSpinner size="lg" />
    </div>
  );

  return (
    <div
      className="animate-fadeIn"
      style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 64px' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '40px',
          paddingBottom: '28px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            Gestión de Menú
          </h1>
          <p style={{ fontSize: '0.875rem', fontWeight: 500, marginTop: '6px', color: 'var(--text-secondary)', opacity: 0.7 }}>
            {categories.length} categorías · {items.length} platillos en total
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={openNewCat}
            className="btn-ghost"
            style={{
              padding: '12px 22px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Plus size={18} /> Categoría
          </button>
          <button
            onClick={() => openNewItem(null)}
            disabled={categories.length === 0}
            className="btn-primary"
            style={{
              padding: '12px 22px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            title={categories.length === 0 ? 'Crea una categoría primero' : ''}
          >
            <Plus size={18} /> Nuevo Platillo
          </button>
        </div>
      </div>

      {/* ── Lista de categorías ─────────────────────────────────────────── */}
      {categories.length === 0 ? (
        /* Estado vacío */
        <div
          className="bg-[var(--bg-secondary)] border border-[var(--border)]"
          style={{
            borderRadius: '28px',
            padding: '64px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}>
            <UtensilsCrossed size={48} color="var(--text-secondary)" />
          </div>
          <p style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', opacity: 0.6 }}>
            Aún no hay categorías en tu menú.
          </p>
          <button
            onClick={openNewCat}
            className="btn-primary"
            style={{ padding: '14px 28px', borderRadius: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}
          >
            <Plus size={20} /> Crear Primera Categoría
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id);
            const isOpen   = expanded[cat.id] ?? true;

            return (
              <div
                key={cat.id}
                className="bg-[var(--bg-secondary)] border border-[var(--border)]"
                style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
              >
                {/* ── Header de categoría ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px 28px',
                    cursor: 'pointer',
                    borderBottom: isOpen ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  className="hover:bg-white/5"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <span style={{ fontSize: '1.5rem' }}>{cat.emoji}</span>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', flex: 1, color: 'var(--text-primary)' }}>
                    {cat.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '4px 10px', borderRadius: '999px',
                      background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)',
                      marginRight: '4px',
                    }}
                  >
                    {catItems.length} platillos
                  </span>

                  {/* Editar categoría */}
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditCat(cat); }}
                    style={{
                      minWidth: '40px', minHeight: '40px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px', background: 'transparent',
                      border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    className="hover:bg-white/10"
                    title="Editar Categoría"
                  >
                    <Pencil size={17} color="var(--text-secondary)" />
                  </button>

                  {/* Eliminar categoría */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }}
                    style={{
                      minWidth: '40px', minHeight: '40px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px', background: 'transparent',
                      border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    className="hover:bg-red-500/10"
                    title="Eliminar Categoría"
                  >
                    <Trash2 size={17} color="#ef4444" />
                  </button>

                  <div style={{ paddingLeft: '8px' }}>
                    {isOpen
                      ? <ChevronDown size={20} color="var(--text-secondary)" />
                      : <ChevronRight size={20} color="var(--text-secondary)" />}
                  </div>
                </div>

                {/* ── Platillos ── */}
                {isOpen && (
                  <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {catItems.length === 0 ? (
                      <div
                        style={{
                          padding: '36px 28px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                        }}
                      >
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', opacity: 0.6 }}>
                          No hay platillos en esta categoría.
                        </p>
                        <button
                          onClick={() => openNewItem(cat.id)}
                          style={{
                            fontSize: '0.875rem', fontWeight: 700, color: 'var(--accent)',
                            background: 'none', border: 'none', cursor: 'pointer',
                          }}
                          className="hover:underline"
                        >
                          + Agregar platillo
                        </button>
                      </div>
                    ) : (
                      <div style={{ borderColor: 'var(--border)' }} className="divide-y">
                        {catItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '16px',
                              padding: '14px 28px', transition: 'background 0.15s',
                            }}
                            className="hover:bg-white/5"
                          >
                            {/* Miniatura */}
                            <div
                              style={{
                                width: '48px', height: '48px', borderRadius: '10px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0,
                              }}
                            >
                              {item.imageUrl
                                ? <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <UtensilsCrossed size={16} color="var(--text-secondary)" />
                              }
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.95rem', fontWeight: 700,
                                    color: item.available ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  }}
                                >
                                  {item.name}
                                </span>
                                {!item.available && (
                                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                    Agotado
                                  </span>
                                )}
                                {(item.extras?.length > 0) && (
                                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(245,158,11,0.1)', color: 'var(--accent)' }}>
                                    +{item.extras.length} Modificadores
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p style={{ fontSize: '0.75rem', marginTop: '3px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Precio */}
                            <span style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--accent)', flexShrink: 0 }}>
                              ${item.price.toFixed(2)}
                            </span>

                            {/* Acciones */}
                            <div
                              style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                paddingLeft: '16px', marginLeft: '8px',
                                borderLeft: '1px solid var(--border)',
                              }}
                            >
                              {/* Toggle disponibilidad */}
                              <button
                                onClick={() => toggleAvailable(item)}
                                title={item.available ? 'Marcar Agotado' : 'Marcar Disponible'}
                                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                className="hover:bg-white/5"
                              >
                                {item.available
                                  ? <ToggleRight size={24} color="var(--accent)" />
                                  : <ToggleLeft  size={24} color="var(--text-secondary)" />}
                              </button>

                              {/* Editar platillo */}
                              <button
                                onClick={() => openEditItem(item)}
                                title="Editar Platillo"
                                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                className="hover:bg-white/10"
                              >
                                <Pencil size={17} color="var(--text-secondary)" />
                              </button>

                              {/* Eliminar platillo */}
                              <button
                                onClick={() => deleteItem(item)}
                                title="Eliminar Platillo"
                                style={{ minWidth: '40px', minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                                className="hover:bg-red-500/10"
                              >
                                <Trash2 size={17} color="#ef4444" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botón rápido agregar al fondo */}
                    {catItems.length > 0 && (
                      <div
                        style={{
                          borderTop: '1px solid var(--border)',
                          padding: '14px 28px',
                          background: 'rgba(255,255,255,0.01)',
                        }}
                      >
                        <button
                          onClick={() => openNewItem(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '0.875rem', fontWeight: 700,
                            color: 'var(--accent)', background: 'none', border: 'none',
                            cursor: 'pointer', transition: 'color 0.15s',
                          }}
                          className="hover:text-white"
                        >
                          <Plus size={17} /> Agregar nuevo platillo a {cat.name}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modales (Portal) ────────────────────────────────────────────── */}
      {showCatModal && (
        <CategoryModal
          initial={editCat}
          onSave={closeCatModal}
          onClose={closeCatModal}
        />
      )}
      {showItemModal && (
        <ItemModal
          initial={editItem}
          categories={categories}
          onSave={closeItemModal}
          onClose={closeItemModal}
        />
      )}
    </div>
  );
}
