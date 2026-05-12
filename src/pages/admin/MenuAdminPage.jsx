// src/pages/admin/MenuAdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestión completa del menú: categorías e ítems.
// CRUD de categorías y de platillos (nombre, precio, descripción, disponibilidad).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  addDoc, updateDoc, deleteDoc,
  doc, collection, serverTimestamp, orderBy,
} from 'firebase/firestore';
import {
  UtensilsCrossed, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';
import Modal from '../../components/ui/Modal.jsx';

/* ══════════════════════════════════════════════════════════════════════════
   Formulario de Categoría
══════════════════════════════════════════════════════════════════════════ */
function CategoryForm({ initial, onSave, onCancel }) {
  const [name,  setName]  = useState(initial?.name  ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🍽️');
  const [busy,  setBusy]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Escribe el nombre de la categoría');
    setBusy(true);
    try {
      if (initial?.id) {
        await updateDoc(doc(db, 'menuCategories', initial.id), { name: name.trim(), emoji });
        toast.success('Categoría actualizada');
      } else {
        await addDoc(collection(db, 'menuCategories'), {
          name: name.trim(), emoji, order: Date.now(), createdAt: serverTimestamp(),
        });
        toast.success('Categoría creada');
      }
      onSave();
    } catch (err) { console.error(err); toast.error('Error al guardar'); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <div className="w-24">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Emoji
          </label>
          <input className="pos-input text-center text-xl" value={emoji}
                 onChange={(e) => setEmoji(e.target.value)} maxLength={2} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Nombre *
          </label>
          <input className="pos-input" placeholder="Ej: Entradas, Bebidas..."
                 value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm px-4">Cancelar</button>
        <button type="submit" disabled={busy} className="btn-primary text-sm px-4 flex items-center gap-2">
          {busy ? <LoadingSpinner size="sm" /> : <Plus size={14} />}
          {initial?.id ? 'Guardar' : 'Crear'}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Formulario de Ítem del Menú
══════════════════════════════════════════════════════════════════════════ */
function ItemForm({ initial, categories, onSave, onCancel }) {
  const [name,       setName]       = useState(initial?.name        ?? '');
  const [price,      setPrice]      = useState(initial?.price?.toString() ?? '');
  const [desc,       setDesc]       = useState(initial?.description  ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId  ?? categories[0]?.id ?? '');
  const [busy,       setBusy]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (!name.trim())           return toast.error('Escribe el nombre del platillo');
    if (isNaN(p) || p <= 0)     return toast.error('Ingresa un precio válido');
    if (!categoryId)            return toast.error('Selecciona una categoría');

    setBusy(true);
    try {
      const payload = { name: name.trim(), price: p, description: desc.trim(), categoryId, available: true };
      if (initial?.id) {
        await updateDoc(doc(db, 'menuItems', initial.id), payload);
        toast.success('Platillo actualizado');
      } else {
        await addDoc(collection(db, 'menuItems'), { ...payload, createdAt: serverTimestamp() });
        toast.success('Platillo creado');
      }
      onSave();
    } catch (err) { console.error(err); toast.error('Error al guardar'); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Categoría *
        </label>
        <select className="pos-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                style={{ background: 'var(--bg-primary)', cursor: 'pointer' }}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Nombre del platillo *
        </label>
        <input className="pos-input" placeholder="Ej: Tacos al pastor"
               value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Precio *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-secondary)' }}>$</span>
          <input className="pos-input pl-7" type="number" min="0.01" step="0.01"
                 placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          Descripción (opcional)
        </label>
        <input className="pos-input" placeholder="Breve descripción del platillo..."
               value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost text-sm px-4">Cancelar</button>
        <button type="submit" disabled={busy} className="btn-primary text-sm px-4 flex items-center gap-2">
          {busy ? <LoadingSpinner size="sm" /> : <Plus size={14} />}
          {initial?.id ? 'Guardar' : 'Agregar'}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Página principal
══════════════════════════════════════════════════════════════════════════ */
export default function MenuAdminPage() {
  const { data: categories, loading: loadingCats } =
    useFirestoreCollection('menuCategories', [orderBy('order', 'asc')]);
  const { data: items, loading: loadingItems } =
    useFirestoreCollection('menuItems');

  // Modales
  const [catModal,  setCatModal]  = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [editCat,   setEditCat]   = useState(null);
  const [editItem,  setEditItem]  = useState(null);

  // Categorías expandidas
  const [expanded, setExpanded] = useState({});
  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

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
    if (!window.confirm(`¿Eliminar "${item.name}"?`)) return;
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
    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Gestión de Menú
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {categories.length} categorías · {items.length} platillos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-add-category"
            onClick={() => { setEditCat(null); setCatModal(true); }}
            className="btn-ghost text-sm flex items-center gap-1.5 px-3"
          >
            <Plus size={14} /> Categoría
          </button>
          <button
            id="btn-add-item"
            onClick={() => { setEditItem(null); setItemModal(true); }}
            disabled={categories.length === 0}
            className="btn-primary text-sm flex items-center gap-1.5 px-3"
          >
            <Plus size={14} /> Platillo
          </button>
        </div>
      </div>

      {/* ── Lista por categoría ──────────────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="pos-card p-10 flex flex-col items-center gap-3">
          <UtensilsCrossed size={40} color="var(--text-secondary)" />
          <p style={{ color: 'var(--text-secondary)' }}>No hay categorías. Crea una para empezar.</p>
          <button onClick={() => { setEditCat(null); setCatModal(true); }} className="btn-primary text-sm">
            + Primera categoría
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catItems = items.filter((i) => i.categoryId === cat.id);
            const isOpen   = expanded[cat.id] ?? true;
            return (
              <div key={cat.id} className="pos-card overflow-hidden">
                {/* Header categoría */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/2 transition-colors"
                  onClick={() => toggleExpand(cat.id)}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className="font-bold flex-1" style={{ color: 'var(--text-primary)' }}>
                    {cat.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full mr-2"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {catItems.length}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditCat(cat); setCatModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-white/10"
                  ><Pencil size={13} color="var(--text-secondary)" /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }}
                    className="p-1.5 rounded-lg hover:bg-red-500/10"
                  ><Trash2 size={13} color="#ef4444" /></button>
                  {isOpen
                    ? <ChevronDown size={16} color="var(--text-secondary)" />
                    : <ChevronRight size={16} color="var(--text-secondary)" />}
                </div>

                {/* Platillos */}
                {isOpen && (
                  <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                    {catItems.length === 0 ? (
                      <p className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Sin platillos en esta categoría.
                      </p>
                    ) : (
                      catItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate"
                                    style={{ color: item.available ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {item.name}
                              </span>
                              {!item.available && (
                                <span className="text-xs px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  No disponible
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--accent)' }}>
                            ${item.price.toFixed(2)}
                          </span>
                          {/* Toggle disponibilidad */}
                          <button
                            onClick={() => toggleAvailable(item)}
                            title={item.available ? 'Deshabilitar' : 'Habilitar'}
                            className="p-1.5 rounded-lg hover:bg-white/5"
                          >
                            {item.available
                              ? <ToggleRight size={18} color="var(--accent)" />
                              : <ToggleLeft  size={18} color="var(--text-secondary)" />}
                          </button>
                          <button
                            onClick={() => { setEditItem(item); setItemModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/10"
                          ><Pencil size={13} color="var(--text-secondary)" /></button>
                          <button
                            onClick={() => deleteItem(item)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10"
                          ><Trash2 size={13} color="#ef4444" /></button>
                        </div>
                      ))
                    )}
                    <button
                      onClick={() => { setEditItem(null); setItemModal(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 w-full text-left text-sm transition-colors hover:bg-white/3"
                      style={{ color: 'var(--accent)' }}
                    >
                      <Plus size={13} /> Agregar platillo a {cat.name}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modales ──────────────────────────────────────────────────── */}
      <Modal
        isOpen={catModal}
        onClose={() => setCatModal(false)}
        title={editCat ? 'Editar Categoría' : 'Nueva Categoría'}
      >
        <CategoryForm
          initial={editCat}
          onSave={() => setCatModal(false)}
          onCancel={() => setCatModal(false)}
        />
      </Modal>

      <Modal
        isOpen={itemModal}
        onClose={() => setItemModal(false)}
        title={editItem ? 'Editar Platillo' : 'Nuevo Platillo'}
        maxWidth="max-w-lg"
      >
        <ItemForm
          initial={editItem}
          categories={categories}
          onSave={() => setItemModal(false)}
          onCancel={() => setItemModal(false)}
        />
      </Modal>
    </div>
  );
}
