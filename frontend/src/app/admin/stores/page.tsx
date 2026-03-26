'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Store, Pencil, Trash2, Eye, EyeOff, ShoppingBag, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Store as StoreType } from '@/types';

export default function AdminStoresPage() {
  const router = useRouter();
  const { user, logout, hydrate } = useAuthStore();

  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
  });

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      router.push('/');
      return;
    }
    fetchStores();
  }, [user]);

  const fetchStores = async () => {
    try {
      const res = await api.get('/stores');
      setStores(res.data);
    } catch {
      toast.error('Error al cargar tiendas');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingStore(null);
    setForm({ name: '', slug: '', description: '', logo_url: '' });
    setShowModal(true);
  };

  const openEdit = (store: StoreType) => {
    setEditingStore(store);
    setForm({
      name: store.name,
      slug: store.slug,
      description: store.description || '',
      logo_url: store.logo_url || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      toast.error('Nombre y slug son obligatorios');
      return;
    }
    setSubmitting(true);
    try {
      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}`, form);
        toast.success('Tienda actualizada');
      } else {
        await api.post('/stores', form);
        toast.success('Tienda creada');
      }
      setShowModal(false);
      fetchStores();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (store: StoreType) => {
    try {
      await api.patch(`/stores/${store.id}`, { is_published: !store.is_published });
      toast.success(store.is_published ? 'Tienda despublicada' : 'Tienda publicada');
      fetchStores();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const deleteStore = async (store: StoreType) => {
    if (!confirm(`¿Eliminar la tienda "${store.name}"?`)) return;
    try {
      await api.delete(`/stores/${store.id}`);
      toast.success('Tienda eliminada');
      fetchStores();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

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
            <span className="text-zinc-400 text-sm">Panel Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">Gestión de Tiendas</h1>
            <p className="text-zinc-500 mt-1">{stores.length} tiendas registradas</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Nueva tienda
          </button>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111] border border-[#1a1a1a] rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Sin tiendas */}
        {!loading && stores.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24"
          >
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222]">
              <Store className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No hay tiendas aún</h3>
            <p className="text-zinc-600 text-sm mb-6">Crea la primera tienda del marketplace</p>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear tienda
            </button>
          </motion.div>
        )}

        {/* Grid de tiendas */}
        {!loading && stores.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {stores.map((store, i) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-2xl p-5 transition-all"
                >
                  {/* Header card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center border border-indigo-500/20">
                        <Store className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{store.name}</h3>
                        <span className="text-xs text-zinc-500 font-mono">/{store.slug}</span>
                      </div>
                    </div>
                    {/* Badge estado */}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      store.is_published
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                    }`}>
                      {store.is_published ? 'Publicada' : 'Borrador'}
                    </span>
                  </div>

                  {/* Descripción */}
                  {store.description && (
                    <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{store.description}</p>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[#1a1a1a]">
                    <button
                      onClick={() => togglePublish(store)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-[#1a1a1a] hover:bg-[#222] px-3 py-1.5 rounded-lg transition-all"
                    >
                      {store.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {store.is_published ? 'Despublicar' : 'Publicar'}
                    </button>
                    <button
                      onClick={() => openEdit(store)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-[#1a1a1a] hover:bg-[#222] px-3 py-1.5 rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button
                      onClick={() => deleteStore(store)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 bg-[#1a1a1a] hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal crear/editar */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className="bg-[#111] border border-[#222] rounded-2xl p-6 shadow-2xl mx-4">
                <h2 className="text-xl font-bold mb-6">
                  {editingStore ? 'Editar tienda' : 'Nueva tienda'}
                </h2>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Nombre *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Mi Tienda"
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Slug *</label>
                    <input
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="mi-tienda"
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Descripción</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Describe tu tienda..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">URL del logo</label>
                    <input
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-colors"
                    />
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
                    {submitting ? 'Guardando...' : editingStore ? 'Actualizar' : 'Crear tienda'}
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