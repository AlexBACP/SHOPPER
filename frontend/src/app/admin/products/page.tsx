'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Package, Search, Eye, EyeOff, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';

interface AdminProduct {
  _id: string;
  title: string;
  price: number;
  stock: number;
  category: string | null;
  is_active: boolean;
  image: string | null;
  storeName: string;
  storeSlug: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const cargar = useCallback((query = '') => {
    setLoading(true);
    api.get<AdminProduct[]>('/admin/products', { params: query ? { q: query } : {} })
      .then(r => setProducts(r.data))
      .catch(e => handleApiError(e, 'No se pudieron cargar los productos.'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const buscar = (e: React.FormEvent) => { e.preventDefault(); cargar(q.trim()); };

  const toggle = async (p: AdminProduct) => {
    try {
      await api.patch(`/admin/products/${p._id}`, { is_active: !p.is_active });
      setProducts(ps => ps.map(x => x._id === p._id ? { ...x, is_active: !x.is_active } : x));
      toast.success(p.is_active ? 'Producto ocultado' : 'Producto visible');
    } catch (err) { handleApiError(err, 'No se pudo actualizar.'); }
  };

  const borrar = async (p: AdminProduct) => {
    if (!confirm(`¿Eliminar "${p.title}" definitivamente?`)) return;
    try {
      await api.delete(`/admin/products/${p._id}`);
      setProducts(ps => ps.filter(x => x._id !== p._id));
      toast.success('Producto eliminado');
    } catch (err) { handleApiError(err, 'No se pudo eliminar.'); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--bone-3)] text-[var(--primary)]"><Package className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>Productos</h1>
            <p className="text-sm text-[var(--ink-soft)]">Modera el catálogo de todas las tiendas.</p>
          </div>
        </div>
        <form onSubmit={buscar} className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bone-2)] px-3 py-2">
            <Search className="h-4 w-4 text-[var(--ink-soft)]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto…"
              className="w-44 bg-transparent text-sm outline-none text-[var(--ink)]" />
          </div>
          <button type="submit" className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--bone-2)] hover:bg-[var(--primary-2)]">Buscar</button>
        </form>
      </header>

      {loading ? (
        <div className="flex justify-center py-12 text-[var(--ink-soft)]"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : products.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--ink-soft)]">No hay productos{q ? ` para "${q}"` : ''}.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--line)]">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-[var(--bone-3)] text-[12px] uppercase tracking-wide text-[var(--ink-soft)]">
              <tr>
                <th className="p-3 font-semibold">Producto</th>
                <th className="p-3 font-semibold">Tienda</th>
                <th className="p-3 font-semibold">Precio</th>
                <th className="p-3 font-semibold">Stock</th>
                <th className="p-3 font-semibold">Estado</th>
                <th className="p-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id} className={`border-t border-[var(--line)] ${!p.is_active ? 'opacity-55' : ''}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--bone-3)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? <img src={p.image} alt="" className="h-full w-full object-cover" /> : null}
                      </span>
                      <span className="line-clamp-2 font-semibold text-[var(--ink)]">{p.title}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {p.storeSlug
                      ? <Link href={`/store/${p.storeSlug}`} className="text-[var(--ink-soft)] hover:text-[var(--primary)]">{p.storeName}</Link>
                      : <span className="text-[var(--ink-soft)]">{p.storeName}</span>}
                  </td>
                  <td className="p-3 font-bold text-[var(--ink)]" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(p.price)}</td>
                  <td className="p-3 text-[var(--ink-soft)]">{p.stock}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${p.is_active ? 'bg-[var(--selva-soft)] text-[var(--selva)]' : 'bg-[var(--bone-3)] text-[var(--ink-soft)]'}`}>
                      {p.is_active ? 'Visible' : 'Oculto'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggle(p)} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-[var(--bone-3)] hover:text-[var(--ink)]" title={p.is_active ? 'Ocultar' : 'Mostrar'}>
                        {p.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button onClick={() => borrar(p)} className="rounded-lg p-2 text-[var(--ink-soft)] hover:bg-red-50 hover:text-red-600" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-[12px] text-[var(--ink-soft)]"><ExternalLink className="mr-1 inline h-3 w-3" />Se muestran hasta 100 resultados. Usa la búsqueda para filtrar.</p>
    </div>
  );
}
