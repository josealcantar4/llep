// src/pages/admin/MenuAdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Gestión completa del menú: categorías e ítems.
// CRUD de platillos con modificadores (extras) e imagen URL.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  addDoc, updateDoc, deleteDoc,
  doc, collection, serverTimestamp, orderBy,
} from 'firebase/firestore';
import {
  UtensilsCrossed, Plus, Pencil, Trash2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Image as ImageIcon, ArrowLeft, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../firebase/config.js';
import useFirestoreCollection from '../../hooks/useFirestoreCollection.js';
import LoadingSpinner from '../../components/ui/LoadingSpinner.jsx';

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
    <div className="pos-card p-6 animate-slideUp max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {initial?.id ? <Pencil size={20} color="var(--accent)" /> : <Plus size={20} color="var(--accent)" />}
          {initial?.id ? 'Editar Categoría' : 'Nueva Categoría'}
        </h2>
        <button onClick={onCancel} className="btn-ghost flex items-center gap-2 text-sm px-3 py-1.5">
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-4">
          <div className="w-24">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Emoji
            </label>
            <input className="pos-input text-center text-2xl py-3" value={emoji}
                   onChange={(e) => setEmoji(e.target.value)} maxLength={2} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre *
            </label>
            <input className="pos-input py-3 font-semibold" placeholder="Ej: Entradas, Bebidas..."
                   value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>
        </div>
        <div className="pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
            {busy ? <LoadingSpinner size="sm" /> : <SaveIcon />}
            {initial?.id ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </div>
  );
}

function SaveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Formulario de Ítem del Menú
══════════════════════════════════════════════════════════════════════════ */
function ItemForm({ initial, categories, onSave, onCancel }) {
  const [name,       setName]       = useState(initial?.name        ?? '');
  const [price,      setPrice]      = useState(initial?.price?.toString() ?? '');
  const [desc,       setDesc]       = useState(initial?.description  ?? '');
  const [imageUrl,   setImageUrl]   = useState(initial?.imageUrl     ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId  ?? categories[0]?.id ?? '');
  const [extras,     setExtras]     = useState(initial?.extras      ?? []);
  const [busy,       setBusy]       = useState(false);

  const addExtra = () => setExtras([...extras, { name: '', price: 0 }]);
  const updateExtra = (index, field, value) => {
    const newExtras = [...extras];
    newExtras[index][field] = value;
    setExtras(newExtras);
  };
  const removeExtra = (index) => setExtras(extras.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = parseFloat(price);
    if (!name.trim())           return toast.error('Escribe el nombre del platillo');
    if (isNaN(p) || p < 0)      return toast.error('Ingresa un precio base válido');
    if (!categoryId)            return toast.error('Selecciona una categoría');

    // Limpiar extras vacíos
    const cleanExtras = extras.filter(ex => ex.name.trim() !== '');

    setBusy(true);
    try {
      const payload = { 
        name: name.trim(), 
        price: p, 
        description: desc.trim(), 
        imageUrl: imageUrl.trim(),
        categoryId, 
        extras: cleanExtras,
        available: initial?.id ? initial.available : true 
      };

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
    <div className="pos-card p-6 animate-slideUp max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {initial?.id ? <Pencil size={20} color="var(--accent)" /> : <UtensilsCrossed size={20} color="var(--accent)" />}
          {initial?.id ? 'Editar Platillo' : 'Nuevo Platillo'}
        </h2>
        <button onClick={onCancel} className="btn-ghost flex items-center gap-2 text-sm px-3 py-1.5">
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Categoría *
            </label>
            <select className="pos-input py-3" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                    style={{ background: 'var(--bg-primary)', cursor: 'pointer' }} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Nombre del Platillo *
            </label>
            <input className="pos-input py-3 font-semibold" placeholder="Ej: Hamburguesa Clásica"
                   value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Precio Base *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-secondary)' }}>$</span>
              <input className="pos-input py-3 pl-7 font-bold text-accent" type="number" min="0" step="0.01"
                     placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Descripción (Opcional)
            </label>
            <textarea className="pos-input resize-none" rows="2" placeholder="Ingredientes, preparación, etc..."
                   value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              URL de la Imagen (Opcional)
            </label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 border" style={{ borderColor: 'var(--border)' }}>
                {imageUrl ? <img src={imageUrl} alt="preview" className="w-full h-full object-cover rounded-lg" onError={(e) => e.target.style.display='none'}/> : <ImageIcon size={16} color="var(--text-secondary)" />}
              </div>
              <input className="pos-input flex-1" placeholder="https://ejemplo.com/imagen.jpg" type="url"
                     value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
          </div>

          {/* ── Modificadores / Extras ── */}
          <div className="md:col-span-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Tag size={14} color="var(--accent)" />
                  Modificadores / Extras
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Opciones extra para este platillo (Ej: Queso extra +$15, Sin cebolla +$0)
                </p>
              </div>
              <button type="button" onClick={addExtra} className="btn-ghost text-xs px-2 py-1 flex items-center gap-1">
                <Plus size={12} /> Agregar Opción
              </button>
            </div>

            <div className="space-y-2">
              {extras.length === 0 && (
                <div className="p-4 rounded-xl text-center text-xs border border-dashed" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                  No hay extras configurados
                </div>
              )}
              {extras.map((extra, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input className="pos-input text-sm py-2" placeholder="Nombre (Ej: Doble carne)" 
                         value={extra.name} onChange={e => updateExtra(idx, 'name', e.target.value)} required />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-secondary)' }}>+$</span>
                    <input type="number" className="pos-input py-2 pl-7 text-sm" min="0" step="0.01" placeholder="0.00"
                           value={extra.price} onChange={e => updateExtra(idx, 'price', parseFloat(e.target.value) || 0)} required />
                  </div>
                  <button type="button" onClick={() => removeExtra(idx)} className="p-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        <div className="pt-4 mt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <button type="submit" disabled={busy} className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base">
            {busy ? <LoadingSpinner size="sm" /> : <SaveIcon />}
            {initial?.id ? 'Guardar Cambios del Platillo' : 'Crear Nuevo Platillo'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Página principal (Listado y Toggle)
══════════════════════════════════════════════════════════════════════════ */
export default function MenuAdminPage() {
  const { data: categories, loading: loadingCats } =
    useFirestoreCollection('menuCategories', [orderBy('order', 'asc')]);
  const { data: items, loading: loadingItems } =
    useFirestoreCollection('menuItems');

  // Estado para controlar qué formulario mostrar: null = Lista, 'cat' = Formulario Categoría, 'item' = Formulario Platillo
  const [formType, setFormType] = useState(null);
  
  // Datos para editar
  const [editCat,   setEditCat]   = useState(null);
  const [editItem,  setEditItem]  = useState(null);

  // Categorías expandidas en la vista de lista
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

  const closeForm = () => {
    setFormType(null);
    setEditCat(null);
    setEditItem(null);
  };

  if (loadingCats || loadingItems) return (
    <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            Gestión de Menú
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {categories.length} categorías · {items.length} platillos en total
          </p>
        </div>
        {!formType && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditCat(null); setFormType('cat'); }}
              className="btn-ghost text-sm flex items-center gap-1.5 px-4"
            >
              <Plus size={16} /> Categoría
            </button>
            <button
              onClick={() => { setEditItem(null); setFormType('item'); }}
              disabled={categories.length === 0}
              className="btn-primary text-sm flex items-center gap-1.5 px-4"
              title={categories.length === 0 ? 'Crea una categoría primero' : ''}
            >
              <Plus size={16} /> Nuevo Platillo
            </button>
          </div>
        )}
      </div>

      {/* ── Área Dinámica: Lista o Formulario ────────────────────────── */}
      {formType === 'cat' ? (
        <CategoryForm initial={editCat} onSave={closeForm} onCancel={closeForm} />
      ) : formType === 'item' ? (
        <ItemForm initial={editItem} categories={categories} onSave={closeForm} onCancel={closeForm} />
      ) : (
        /* ── Lista por categoría ──────────────────────────────────────── */
        categories.length === 0 ? (
          <div className="pos-card p-12 flex flex-col items-center gap-4 animate-fadeIn">
            <div className="p-5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <UtensilsCrossed size={48} color="var(--text-secondary)" />
            </div>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Aún no hay categorías en tu menú.</p>
            <button onClick={() => { setEditCat(null); setFormType('cat'); }} className="btn-primary mt-2 flex items-center gap-2">
              <Plus size={18} /> Crear Primera Categoría
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.categoryId === cat.id);
              const isOpen   = expanded[cat.id] ?? true;
              return (
                <div key={cat.id} className="pos-card overflow-hidden">
                  {/* Header categoría */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-white/5 transition-colors border-b"
                    style={{ borderColor: isOpen ? 'var(--border)' : 'transparent' }}
                    onClick={() => toggleExpand(cat.id)}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="font-bold text-lg flex-1" style={{ color: 'var(--text-primary)' }}>
                      {cat.name}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold mr-2"
                          style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}>
                      {catItems.length} platillos
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditCat(cat); setFormType('cat'); }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      title="Editar Categoría"
                    ><Pencil size={16} color="var(--text-secondary)" /></button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCategory(cat); }}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Eliminar Categoría"
                    ><Trash2 size={16} color="#ef4444" /></button>
                    <div className="p-1 ml-2">
                      {isOpen
                        ? <ChevronDown size={20} color="var(--text-secondary)" />
                        : <ChevronRight size={20} color="var(--text-secondary)" />}
                    </div>
                  </div>

                  {/* Platillos */}
                  {isOpen && (
                    <div className="bg-black/20">
                      {catItems.length === 0 ? (
                        <div className="px-6 py-8 flex flex-col items-center justify-center gap-2">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            No hay platillos en esta categoría.
                          </p>
                          <button onClick={() => { setEditItem({ categoryId: cat.id }); setFormType('item'); }} className="text-xs text-accent hover:underline">
                            + Agregar platillo
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                          {catItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                              {/* Imagen Miniatura */}
                              <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0" style={{ border: '1px solid var(--border)' }}>
                                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <UtensilsCrossed size={16} color="var(--text-secondary)" />}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold truncate"
                                        style={{ color: item.available ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                    {item.name}
                                  </span>
                                  {!item.available && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider"
                                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                      Agotado
                                    </span>
                                  )}
                                  {(item.extras?.length > 0) && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider"
                                          style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent)' }}>
                                      +{item.extras.length} Modificadores
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs truncate mt-1" style={{ color: 'var(--text-secondary)' }}>
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <span className="font-black text-base flex-shrink-0" style={{ color: 'var(--accent)' }}>
                                ${item.price.toFixed(2)}
                              </span>
                              
                              <div className="flex items-center gap-1 ml-4 border-l pl-4" style={{ borderColor: 'var(--border)' }}>
                                {/* Toggle disponibilidad */}
                                <button
                                  onClick={() => toggleAvailable(item)}
                                  title={item.available ? 'Marcar Agotado' : 'Marcar Disponible'}
                                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  {item.available
                                    ? <ToggleRight size={22} color="var(--accent)" />
                                    : <ToggleLeft  size={22} color="var(--text-secondary)" />}
                                </button>
                                <button
                                  onClick={() => { setEditItem(item); setFormType('item'); }}
                                  title="Editar Platillo"
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                ><Pencil size={15} color="var(--text-secondary)" /></button>
                                <button
                                  onClick={() => deleteItem(item)}
                                  title="Eliminar Platillo"
                                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                ><Trash2 size={15} color="#ef4444" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Botón rápido agregar abajo de cada categoría */}
                      {catItems.length > 0 && (
                        <div className="px-6 py-3 border-t bg-white/2" style={{ borderColor: 'var(--border)' }}>
                          <button
                            onClick={() => { setEditItem({ categoryId: cat.id }); setFormType('item'); }}
                            className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-white"
                            style={{ color: 'var(--accent)' }}
                          >
                            <Plus size={16} /> Agregar nuevo platillo a {cat.name}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
