'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Package, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist.store';
import { useCartStore } from '@/store/cart.store';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function WishlistPage() {
  const { items, remove, clear, count } = useWishlistStore();
  const { addItem, openCart }           = useCartStore();

  const agregar = (item: typeof items[0]) => {
    addItem({ productId: item.productId, storeId: item.storeId, title: item.title, price: item.price, stock: 99, sku: item.productId, image: item.image });
    openCart();
    toast.success('Agregado al carrito');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="bg-[var(--nav-bg)] px-4 md:px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200/50">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Lista de deseos</h1>
              <p className="text-white/50 text-sm">{count()} producto{count() !== 1 ? 's' : ''} guardado{count() !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={clear} className="text-white/50 hover:text-white text-xs flex items-center gap-1.5 border border-white/20 hover:border-white/40 px-3 py-2 rounded-lg transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Vaciar lista
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-28 h-28 bg-white border-2 border-dashed border-rose-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-12 h-12 text-rose-300" />
            </motion.div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Tu lista está vacía</h2>
            <p className="text-[var(--text-muted)] mb-8">Guarda tus productos favoritos para comprarlos después</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-200/50">
              Explorar tiendas <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div key={item.productId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 22 }}
                  whileHover={{ y: -6 }}
                  className="bg-white border border-[var(--border)] rounded-2xl overflow-hidden group hover:shadow-xl hover:shadow-slate-200/80 hover:border-[var(--accent-border)] transition-all"
                >
                  <Link href={`/store/${item.storeSlug}/product/${item.productId}`}>
                    <div className="aspect-square bg-[var(--surface-2)] relative overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.title} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-[var(--border-hover)]" /></div>}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/store/${item.storeSlug}/product/${item.productId}`}>
                      <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 hover:text-[var(--blue)] transition-colors min-h-[2.5rem]">{item.title}</p>
                    </Link>
                    <span className="text-[10px] text-[var(--text-muted)] my-1.5 inline-block">Nuevo</span>
                    <p className="text-base font-black text-[var(--text-primary)] mb-3">{fmt(item.price)}</p>
                    <div className="flex gap-2">
                      <button onClick={() => agregar(item)}
                        className="flex-1 py-2 text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all shadow-md shadow-orange-200/60 flex items-center justify-center gap-1">
                        <ShoppingCart className="w-3.5 h-3.5" /> Agregar
                      </button>
                      <button onClick={() => remove(item.productId)}
                        className="w-9 h-9 flex items-center justify-center border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
