'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, CheckCircle, Package, Store, Tag, Star, AlertTriangle, Share2, ChevronLeft, ChevronRight, Plus, Minus, Truck, Shield, RotateCcw, ZoomIn, Heart, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { Store as StoreType } from '@/types';
import { SeccionResenas } from '@/components/ui/Resenas';

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

interface Variant { name: string; sku: string; price: number; stock: number; attributes: Record<string, string>; }
interface Product { _id: string; store_id: string; title: string; description?: string; price: number; stock: number; images: string[]; sku: string; is_active: boolean; variants?: Variant[]; attributes?: Record<string, string>; }

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [store, setStore] = useState<StoreType | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [compartido, setCompartido] = useState(false);
  const { toggle: wishToggle, has: wishHas } = useWishlistStore();
  const isWished = product ? wishHas(product._id) : false;
  const { addItem, openCart } = useCartStore();

  useEffect(() => {
    (async () => {
      try {
        const stores = await api.get('/stores');
        const s = stores.data.find((st: StoreType) => st.slug === slug);
        if (!s) { setNotFound(true); return; }
        setStore(s);
        const pr = await api.get(`/stores/${s.id}/products`);
        const p = pr.data.find((x: Product) => x._id === id);
        if (!p || p.is_active === false) { setNotFound(true); return; }
        setProduct(p);
      } catch { setNotFound(true); } finally { setLoading(false); }
    })();
  }, [slug, id]);

  const agregar = () => {
    if (!product || !store) return;
    const v = selectedVariant;
    addItem({ productId: product._id, storeId: store.id, title: product.title, price: v?.price ?? product.price, stock: v?.stock ?? product.stock, sku: v?.sku ?? product.sku, image: product.images?.[0] });
    setAdded(true); setTimeout(() => setAdded(false), 2000); openCart();
    toast.success('¡Agregado al carrito!');
  };

  const compartir = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCompartido(true); setTimeout(() => setCompartido(false), 2000);
  };

  const currentPrice = selectedVariant?.price ?? product?.price ?? 0;
  const currentStock = selectedVariant?.stock ?? product?.stock ?? 0;

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
      <div className="text-center"><Package className="w-10 h-10 text-[var(--accent)] animate-pulse mx-auto mb-3"/><p className="text-sm text-[var(--text-muted)]">Cargando producto...</p></div>
    </div>
  );

  if (notFound || !product || !store) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <Package className="w-12 h-12 text-[var(--border-hover)] mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
        <Link href={`/store/${slug}`} className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-5 py-2.5 rounded-lg transition-all"><ArrowLeft className="w-4 h-4" /> Volver a la tienda</Link>
      </div>
    </div>
  );

  const imgs = product.images?.length ? product.images : [];

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-xs text-[var(--text-muted)] flex-wrap">
          <Link href="/" className="hover:text-[var(--blue)] transition-colors">Inicio</Link>
          <span>/</span>
          <Link href={`/store/${slug}`} className="hover:text-[var(--blue)] transition-colors">{store.name}</Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-medium line-clamp-1">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">

          {/* Galería */}
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              {/* Thumbnails */}
              {imgs.length > 1 && (
                <div className="flex flex-col gap-2 w-16">
                  {imgs.map((img, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={`w-16 h-16 border-2 rounded-lg overflow-hidden transition-all ${imgIdx === i ? 'border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--border-hover)]'}`}>
                      <img src={img} alt="" className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}

              {/* Imagen principal */}
              <div className="flex-1 bg-white border border-[var(--border)] rounded-xl overflow-hidden relative group cursor-zoom-in aspect-square max-h-[500px]"
                onClick={() => imgs.length > 0 && setLightbox(true)}>
                {imgs.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.img key={imgIdx} src={imgs[imgIdx]} alt={product.title}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      className="w-full h-full object-contain p-6" />
                  </AnimatePresence>
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-[var(--border-hover)]" /></div>
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-lg p-1.5"><ZoomIn className="w-4 h-4 text-[var(--text-secondary)]" /></div>
                {imgs.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(p => Math.max(0, p-1)); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                      disabled={imgIdx === 0}><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={e => { e.stopPropagation(); setImgIdx(p => Math.min(imgs.length-1, p+1)); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30"
                      disabled={imgIdx === imgs.length-1}><ChevronRight className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </div>

            {/* Garantías */}
            <div className="grid grid-cols-3 gap-3">
              {[{ icon: Truck, text: 'Envío disponible' }, { icon: Shield, text: 'Compra protegida' }, { icon: RotateCcw, text: 'Devoluciones' }].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 bg-white border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--text-secondary)]">
                  <Icon className="w-4 h-4 text-[var(--accent)] shrink-0" />{text}
                </div>
              ))}
            </div>
          </div>

          {/* Info + caja de compra */}
          <div className="flex flex-col gap-4">
            {/* Info del producto */}
            <div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                <Link href={`/store/${slug}`} className="flex items-center gap-1 text-[var(--blue)] hover:underline"><Store className="w-3.5 h-3.5" />{store.name}</Link>
                <span>·</span><span>SKU: {product.sku}</span>
              </div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight mb-3">{product.title}</h1>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} className="w-3.5 h-3.5 fill-orange-400 text-orange-400"/>)}</div>
                <span className="text-sm text-[var(--text-muted)]">(Nuevo)</span>
              </div>
            </div>

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="bg-white border border-[var(--border)] rounded-xl p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Variantes disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => (
                    <button key={v.sku} onClick={() => setSelectedVariant(selectedVariant?.sku === v.sku ? null : v)}
                      className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${selectedVariant?.sku === v.sku ? 'border-[var(--accent)] bg-orange-50 text-[var(--accent-dark)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'}`}>
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caja de compra estilo Amazon */}
            <div className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
              <div className="mb-3">
                <div className="text-3xl font-black text-[var(--text-primary)] leading-tight">{fmt(currentPrice)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-muted)]">+ IVA 19%: {fmt(currentPrice * 0.19)}</span>
                  <span className="badge-iva">IVA incluido al pagar</span>
                </div>
                <p className="text-xs font-bold text-green-700 mt-1">Total con IVA: {fmt(currentPrice * 1.19)}</p>
              </div>

              {currentStock > 0 ? (
                <p className="text-sm text-[var(--success)] font-semibold mb-4 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> En stock ({currentStock} disponibles)</p>
              ) : (
                <p className="text-sm text-[var(--danger)] font-semibold mb-4 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Sin stock</p>
              )}

              {currentStock > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-[var(--text-secondary)]">Cantidad:</span>
                    <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                      <button onClick={() => setQty(q => Math.max(1, q-1))} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors border-r border-[var(--border)]"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-10 text-center text-sm font-bold">{qty}</span>
                      <button onClick={() => setQty(q => Math.min(currentStock, q+1))} className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors border-l border-[var(--border)]" disabled={qty >= currentStock}><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <motion.button onClick={agregar} whileTap={{ scale: 0.98 }}
                    className={`w-full py-3 rounded-lg font-bold text-sm transition-all mb-2 flex items-center justify-center gap-2 ${
                      added ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] hover:shadow-md'
                    }`}>
                    {added ? <><CheckCircle className="w-4 h-4" />¡Agregado!</> : <><ShoppingCart className="w-4 h-4" />Agregar al carrito</>}
                  </motion.button>
                  <Link href="/checkout" className="w-full py-3 rounded-lg font-bold text-sm bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] border border-[#FCD200] transition-all flex items-center justify-center gap-2 hover:shadow-md">
                    Comprar ahora
                  </Link>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />
                Compra protegida con SSL 256-bit
              </div>
            </div>

            {/* Botón compartir */}
            <div className="flex gap-2">
              <button onClick={compartir} className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors">
                {compartido ? <><CheckCircle className="w-4 h-4 text-green-500" />¡Copiado!</> : <><Share2 className="w-4 h-4" />Compartir</>}
              </button>
              {product && (
                <button
                  onClick={() => wishToggle({ productId: product._id, storeId: store?.id ?? '', title: product.title, price: currentPrice, image: product.images?.[0], slug: product._id, storeSlug: store?.slug ?? '' })}
                  className={`w-12 flex items-center justify-center border rounded-xl transition-all ${isWished ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50'}`}
                  title={isWished ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
                  <Heart className={`w-5 h-5 ${isWished ? 'fill-rose-500' : ''}`} />
                </button>
              )}
              {product && (
                <a href={`https://wa.me/?text=¡Mira este producto en Shopper! ${encodeURIComponent(product.title + ' - ' + window?.location?.href ?? '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-12 flex items-center justify-center border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 rounded-xl transition-all"
                  title="Compartir en WhatsApp">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Descripción */}
        {product.description && (
          <div className="mt-8 bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-lg text-[var(--text-primary)] mb-3">Descripción del producto</h2>
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>
        )}

        {/* Reseñas */}
        <div className="mt-6">
          <SeccionResenas productId={product._id} storeId={store.id} />
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && imgs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <img src={imgs[imgIdx]} alt={product.title} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none">×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
