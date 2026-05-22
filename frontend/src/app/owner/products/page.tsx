'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ArrowLeft, Trash2, Edit, Eye, EyeOff, Search, AlertTriangle, CheckCircle, Store, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import api from '@/lib/api';
import ImageUploader from '@/components/ui/ImageUploader';
import { useSearchParams } from 'next/navigation';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface Producto { _id:string; title:string; description?:string; price:number; stock:number; sku:string; is_active:boolean; images?:string[]; store_id:string; }
interface Tienda   { id:string; name:string; slug:string; }

function ModalProducto({ prod, tiendas, storeId, onClose, onSaved }: { prod:Partial<Producto>|null; tiendas:Tienda[]; storeId?:string; onClose:()=>void; onSaved:()=>void }) {
  const [title,  setTitle]  = useState(prod?.title  ?? '');
  const [desc,   setDesc]   = useState(prod?.description ?? '');
  const [price,  setPrice]  = useState(String(prod?.price  ?? ''));
  const [stock,  setStock]  = useState(String(prod?.stock  ?? ''));
  const [sku,    setSku]    = useState(prod?.sku    ?? '');
  const [imgUrl, setImgUrl] = useState(prod?.images?.[0] ?? '');
  const [store,  setStore]  = useState(prod?.store_id ?? storeId ?? tiendas[0]?.id ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !price || !stock || !sku || !store) { toast.error('Completa todos los campos obligatorios'); return; }
    setSaving(true);
    try {
      const body = { title, description:desc, price:parseFloat(price), stock:parseInt(stock), sku, images: imgUrl ? [imgUrl] : [] };
      if (prod?._id) await api.put(`/stores/${store}/products/${prod._id}`, body);
      else           await api.post(`/stores/${store}/products`, body);
      toast.success(prod?._id ? 'Producto actualizado' : 'Producto creado');
      onSaved(); onClose();
    } catch (e:any) { toast.error(e?.response?.data?.message ?? 'Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{scale:0.95,y:10}} animate={{scale:1,y:0}} exit={{scale:0.95}}
        onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl my-4">
        <div className="bg-[var(--nav-bg)] px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-[var(--accent)]"/>{prod?._id?'Editar producto':'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6 space-y-4">
          {tiendas.length > 1 && (
            <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Tienda *</label>
              <select value={store} onChange={e=>setStore(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all">
                {tiendas.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Nombre *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej. Sombrero Vueltiao"
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/></div>
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Descripción</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Describe el producto..."
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all resize-none"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Precio COP *</label>
              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0"
                className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/></div>
            <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Stock *</label>
              <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="0"
                className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/></div>
          </div>
          <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">SKU *</label>
            <input value={sku} onChange={e=>setSku(e.target.value)} placeholder="Ej. SOC-001"
              className="w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-lg bg-white outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/></div>
          <div>
            <ImageUploader
              folder="products"
              multiple
              label="Imágenes del producto (múltiples)"
              value={imgUrl ? [imgUrl] : []}
              onChange={(urls) => setImgUrl(urls[0] ?? '')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">Cancelar</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Guardar producto'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function OwnerProductsPage() {
  const sp = useSearchParams();
  const storeIdParam = sp.get('store');
  const [tiendas,  setTiendas]  = useState<Tienda[]>([]);
  const [productos,setProductos]= useState<(Producto & {storeName:string})[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modal,    setModal]    = useState<Partial<Producto>|null|false>(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const tr = await api.get('/stores/my');
      setTiendas(tr.data);
      const todos: any[] = [];
      await Promise.all(tr.data.map(async (t:any) => {
        try { const r = await api.get(`/stores/${t.id}/products`); r.data.forEach((p:any)=>todos.push({...p,storeName:t.name})); } catch {}
      }));
      setProductos(todos);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { cargar(); }, []);

  const toggleActive = async (p: Producto & {storeName:string}) => {
    try {
      await api.put(`/stores/${p.store_id}/products/${p._id}`, { is_active: !p.is_active });
      toast.success(p.is_active ? 'Producto ocultado' : 'Producto activado');
      cargar();
    } catch { toast.error('Error al actualizar'); }
  };

  const eliminar = async (p: Producto & {storeName:string}) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await api.delete(`/stores/${p.store_id}/products/${p._id}`); toast.success('Eliminado'); cargar(); }
    catch { toast.error('Error al eliminar'); }
  };

  const filtrados = productos.filter(p => p.title.toLowerCase().includes(busqueda.toLowerCase()) || p.sku.toLowerCase().includes(busqueda.toLowerCase()));
  const stockBajo = productos.filter(p => p.is_active && p.stock <= 5);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/owner" className="text-white/60 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5"/></Link>
            <div><h1 className="text-xl font-bold text-white">Productos</h1><p className="text-white/50 text-sm">{productos.length} productos en total</p></div>
          </div>
          <button onClick={()=>setModal({})} className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-4 py-2.5 rounded-lg text-sm transition-all hover:shadow-md">
            <Plus className="w-4 h-4"/> Nuevo producto
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {stockBajo.length > 0 && (
          <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0"/>
            <p className="text-sm text-red-700 font-medium">{stockBajo.length} producto{stockBajo.length>1?'s':''} con stock ≤ 5 unidades. Actualiza tu inventario.</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por nombre o SKU..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-lg outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all"/>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{filtrados.length} resultados</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-48 rounded-xl"/>)}</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-20"><Package className="w-12 h-12 text-[var(--border-hover)] mx-auto mb-4"/>
            <p className="text-[var(--text-secondary)] font-medium">{busqueda ? 'Sin resultados' : 'Sin productos aún'}</p>
            {!busqueda && <button onClick={()=>setModal({})} className="mt-4 inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all hover:shadow-md"><Plus className="w-4 h-4"/>Crear producto</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtrados.map((p,i) => (
                <motion.div key={p._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{delay:i*0.04}}
                  className={`bg-white border rounded-xl overflow-hidden hover:shadow-md transition-all ${!p.is_active ? 'opacity-60' : 'border-[var(--border)]'}`}>
                  <div className="h-36 bg-[var(--surface-2)] relative flex items-center justify-center">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.title} className="w-full h-full object-contain p-3"/>
                      : <Package className="w-10 h-10 text-[var(--border-hover)]"/>}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {p.stock <= 5 && p.is_active && <span className="text-[10px] bg-red-100 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded-full">Stock bajo</span>}
                      {p.stock === 0 && <span className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 font-bold px-2 py-0.5 rounded-full">Agotado</span>}
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${p.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {p.is_active ? 'Activo' : 'Oculto'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate mb-0.5">{p.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mb-1">SKU: {p.sku} · {p.storeName}</p>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-base font-black text-[var(--text-primary)]">{fmt(p.price)}</p>
                      <p className={`text-xs font-medium ${p.stock <= 5 ? 'text-red-600' : 'text-[var(--text-muted)]'}`}>{p.stock} en stock</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={()=>setModal(p)} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                        <Edit className="w-3 h-3"/>Editar
                      </button>
                      <button onClick={()=>toggleActive(p)} className={`flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border rounded-lg font-medium transition-all ${p.is_active ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                        {p.is_active ? <><EyeOff className="w-3 h-3"/>Ocultar</> : <><Eye className="w-3 h-3"/>Activar</>}
                      </button>
                      <button onClick={()=>eliminar(p)} className="flex items-center justify-center p-1.5 border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal !== false && <ModalProducto prod={modal||{}} tiendas={tiendas} storeId={storeIdParam ?? undefined} onClose={()=>setModal(false)} onSaved={cargar}/>}
      </AnimatePresence>
    </div>
  );
}
