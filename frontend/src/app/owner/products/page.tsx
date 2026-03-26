'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Package, Pencil, Trash2, ShoppingBag, LogOut, Store, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Product } from '@/types';
import { Suspense } from 'react';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = searchParams.get('storeId');
  const { user, logout, hydrate } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    sku: '',
    price: '',
    stock: '',
    description: '',
    images: '',
  });

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'owner' && user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/');
      return;
    }
    if (storeId) fetchProducts();
    else setLoading(false);
  }, [user, storeId]);

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/stores/${storeId}/products`);
      setProducts(res.data);
    } catch {
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ title: '', sku: '', price: '', stock: '', description: '', images: '' });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      title: product.title,
      sku: product.sku,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description || '',
      images: product.images.join(', '),
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.sku || !form.price || !form.stock) {
      toast.error('Título, SKU, precio y stock son obligatorios');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title,
      sku: form.sku,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description,
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    try {
      if (editingProduct) {
        await api.patch(`/stores/${storeId}/products/${editingProduct._id}`, payload);
        toast.success('Producto actualizado');
      } else {
        await api.post(`/stores/${storeId}/products`, payload);
        toast.success('Producto creado');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.title}"?`)) return;
    try {
      await api.delete(`/stores/${storeId}/products/${product._id}`);
      toast.success('Producto eliminado');
      fetchProducts();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleLogout = () => { logout(); router.push('/auth/login'); };

  if (!storeId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Selecciona una tienda</h2>
          <p className="text-zinc-500 text-sm mb-6">Debes acceder desde el panel de tus tiendas</p>
          <Link
            href="/owner/stores"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Store className="w-4 h-4" />
            Ir a mis tiendas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg">Shopper</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <Link href="/owner/stores" className="text-zinc-400 text-sm hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Mis Tiendas
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 text-sm">Productos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user?.name}</span>
            <button onClick={handleLogout} className="text-zinc-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Mis Productos</h1>
            <p className="text-zinc-500 mt-1">{products.length} productos en esta tienda</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo producto
          </button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        )}

        {/* Sin productos */}
        {!loading && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222]">
              <Package className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No hay productos aún</h3>
            <p className="text-zinc-600 text-sm mb-6">Agrega tu primer producto a esta tienda</p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear producto
            </button>
          </motion.div>
        )}

        {/* Grid productos */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {products.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-2xl overflow-hidden transition-all"
                >
                  {/* Imagen */}
                  <div className="h-36 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 flex items-center justify-center relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-zinc-600" />
                    )}
                    <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full ${
                      product.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white truncate">{product.title}</h3>
                    <p className="text-xs text-zinc-500 font-mono mb-2">SKU: {product.sku}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-indigo-400 font-bold">${product.price.toLocaleString()}</span>
                      <span className="text-xs text-zinc-500">{product.stock} en stock</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-[#1a1a1a]">
                      <button
                        onClick={() => openEdit(product)}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-[#1a1a1a] hover:bg-[#222] px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-[#1a1a1a] hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-6">
                  {editingProduct ? 'Editar producto' : 'Nuevo producto'}
                </h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Título *</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Nombre del producto"
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">SKU *</label>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="PROD-001"
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-zinc-400 mb-1.5 block">Precio *</label>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 mb-1.5 block">Stock *</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe el producto..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">URLs de imágenes</label>
                    <input
                      value={form.images}
                      onChange={(e) => setForm({ ...form, images: e.target.value })}
                      placeholder="https://img1.com, https://img2.com"
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                    />
                    <p className="text-xs text-zinc-600 mt-1">Separa múltiples URLs con comas</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-zinc-400 rounded-xl text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Guardando...' : editingProduct ? 'Actualizar' : 'Crear producto'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OwnerProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}