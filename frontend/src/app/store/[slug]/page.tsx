'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Store, Package, ArrowLeft, Search, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Store as StoreType, Product } from '@/types';

export default function StorePublicPage() {
  const { slug } = useParams();

  const [store, setStore] = useState<StoreType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get('/stores');
        const found = res.data.find((s: StoreType) => s.slug === slug);
        if (!found) { setNotFound(true); setLoading(false); return; }
        setStore(found);

        const productsRes = await api.get(`/stores/${found.id}/products`);
        setProducts(productsRes.data);
        setFiltered(productsRes.data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q),
      ),
    );
  }, [search, products]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No encontrada
  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222] mx-auto">
            <Store className="w-8 h-8 text-zinc-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Tienda no encontrada</h2>
          <p className="text-zinc-500 mb-6">La tienda que buscas no existe o no está disponible</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
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
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Shopper</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todas las tiendas
          </Link>
        </div>
      </nav>

      {/* Hero de la tienda */}
      <section className="relative pt-16 overflow-hidden">
        <div className="h-56 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 relative flex items-center justify-center">
          {/* Gradientes decorativos */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 text-center"
          >
            {/* Logo */}
            <div className="flex justify-center mb-4">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow-2xl border border-white/10"
                />
              ) : (
                <div className="w-20 h-20 bg-indigo-600/30 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-2xl">
                  <Store className="w-10 h-10 text-indigo-400" />
                </div>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">{store.name}</h1>
            {store.description && (
              <p className="text-zinc-400 mt-2 max-w-md mx-auto text-sm px-4">{store.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {products.length} productos
              </span>
              <span className="w-px h-3 bg-zinc-700" />
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                Tienda activa
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Barra de búsqueda */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-lg mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-11 pr-4 py-3 bg-[#111] border border-[#222] hover:border-[#333] focus:border-indigo-500 rounded-xl text-white placeholder-zinc-500 text-sm outline-none transition-all"
          />
        </motion.div>

        {/* Header productos */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            {search ? `Resultados para "${search}"` : 'Todos los productos'}
          </h2>
          <span className="text-sm text-zinc-500">{filtered.length} productos</span>
        </div>

        {/* Sin productos */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222]">
              <Package className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-400 mb-2">
              {search ? 'No se encontraron productos' : 'Esta tienda no tiene productos aún'}
            </h3>
            <p className="text-zinc-600 text-sm">
              {search ? 'Intenta con otro término' : 'Vuelve pronto'}
            </p>
          </motion.div>
        )}

        {/* Grid productos */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence>
              {filtered.map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-[#111] border border-[#1a1a1a] hover:border-indigo-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group"
                >
                  {/* Imagen */}
                  <div className="h-48 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 flex items-center justify-center overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-zinc-600" />
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute top-2 left-2 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        ¡Últimas unidades!
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-sm font-medium text-zinc-400">Agotado</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-indigo-400 font-bold text-lg">
                        ${product.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {product.sku}
                      </span>
                    </div>
                    <button
                      className="w-full mt-3 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 hover:border-indigo-500 text-indigo-400 hover:text-white text-sm rounded-xl transition-all duration-200 font-medium"
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Agregar al carrito
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal detalle producto */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
            >
              <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl mx-4">
                {/* Imagen grande */}
                <div className="h-64 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 flex items-center justify-center overflow-hidden">
                  {selectedProduct.images?.[0] ? (
                    <img
                      src={selectedProduct.images[0]}
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-zinc-600" />
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h2 className="text-xl font-bold text-white">{selectedProduct.title}</h2>
                    <span className="text-2xl font-bold text-indigo-400">
                      ${selectedProduct.price.toLocaleString()}
                    </span>
                  </div>

                  {selectedProduct.description && (
                    <p className="text-zinc-400 text-sm mb-4">{selectedProduct.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-zinc-500 mb-6">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      SKU: {selectedProduct.sku}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {selectedProduct.stock} disponibles
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 py-3 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-zinc-400 rounded-xl text-sm transition-colors"
                    >
                      Cerrar
                    </button>
                    <button
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Agregar al carrito
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-8 px-6 mt-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-white" />
            </div>
            <span>Shopper — {store.name}</span>
          </div>
          <Link href="/" className="hover:text-zinc-400 transition-colors">
            Ver más tiendas
          </Link>
        </div>
      </footer>
    </div>
  );
}