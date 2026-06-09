'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ShoppingCart, CheckCircle, Package, ShieldCheck, AlertTriangle, Share2,
  ChevronLeft, ChevronRight, Plus, Minus, Truck, Shield, RotateCcw, ZoomIn, Heart, MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { Store as StoreType } from '@/types';
import { SeccionResenas } from '@/components/ui/Resenas';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export interface Variant {
  name: string; sku: string; price: number; stock: number;
  attributes: Record<string, string>;
}
export interface Product {
  _id: string; store_id: string; title: string; description?: string;
  price: number; stock: number; images: string[]; sku: string; is_active: boolean;
  variants?: Variant[]; attributes?: Record<string, string>;
  compare_at_price?: number;
}

export default function ProductClient({
  store, product, slug,
}: { store: StoreType; product: Product; slug: string }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [compartido, setCompartido] = useState(false);
  // URL del navegador — se establece sólo en cliente para evitar hydration mismatch
  const [pageUrl, setPageUrl] = useState('');
  useEffect(() => { setPageUrl(window.location.href); }, []);
  const { toggle: wishToggle, has: wishHas } = useWishlistStore();
  const isWished = wishHas(product._id);
  const { addItem, openCart } = useCartStore();

  const v = selectedVariant;
  const currentPrice = v?.price ?? product.price;
  const currentStock = v?.stock ?? product.stock;
  const imgs = product.images?.length ? product.images : [];

  const agregar = () => {
    addItem({
      productId: product._id, storeId: store.id, title: product.title,
      price: currentPrice, stock: currentStock,
      sku: v?.sku ?? product.sku, image: product.images?.[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    openCart();
    toast.success('¡Agregado al carrito!');
  };

  const compartir = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCompartido(true);
      setTimeout(() => setCompartido(false), 1800);
    } catch {/* silent */}
  };

  const waSeller = store.theme?.whatsapp
    ? `https://wa.me/${store.theme.whatsapp}?text=${encodeURIComponent(
        `¡Hola! Estoy interesado en "${product.title}" de tu tienda ${store.name} en Shopper.`,
      )}`
    : null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      <div className="edp-wrap">

        {/* Breadcrumb editorial */}
        <nav className="edp-crumb" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span className="sep">/</span>
          <Link href={`/store/${slug}`}>{store.name}</Link>
          <span className="sep">/</span>
          <span className="here">{product.title}</span>
        </nav>

        {/* Cabecera */}
        <header className="edp-head">
          <Link href={`/store/${slug}`} className="edp-store">
            <ShieldCheck className="w-[14px] h-[14px]" /> {store.name}
          </Link>
          <span className="edp-sku">SKU · {v?.sku ?? product.sku}</span>
        </header>

        {/* Grid principal */}
        <div className="edp-grid">

          {/* ── Galería editorial ──────────────────────────── */}
          <section className="edp-gallery">
            <div
              className="edp-stage"
              onClick={() => imgs.length > 0 && setLightbox(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && imgs.length > 0 && setLightbox(true)}
              aria-label="Ampliar imagen"
            >
              <span className="edp-badge col"><ShieldCheck className="w-3 h-3" /> Hecho en Colombia</span>

              {imgs.length > 0 ? (
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imgIdx}
                    src={imgs[imgIdx]}
                    alt={product.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </AnimatePresence>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16" style={{ color: 'var(--border-hover)' }} />
                </div>
              )}

              <span className="edp-zoom" aria-hidden><ZoomIn className="w-4 h-4" /></span>

              {imgs.length > 1 && (
                <>
                  <button
                    type="button"
                    className="edp-stage-nav prev"
                    aria-label="Imagen anterior"
                    onClick={(e) => { e.stopPropagation(); setImgIdx(p => Math.max(0, p - 1)); }}
                    disabled={imgIdx === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="edp-stage-nav next"
                    aria-label="Imagen siguiente"
                    onClick={(e) => { e.stopPropagation(); setImgIdx(p => Math.min(imgs.length - 1, p + 1)); }}
                    disabled={imgIdx === imgs.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Caption editorial */}
            {imgs.length > 0 && (
              <div className="edp-stage-cap">
                <span>Foto del producto</span>
                <span className="num">
                  {String(imgIdx + 1).padStart(2, '0')} / {String(imgs.length).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Thumbs */}
            {imgs.length > 1 && (
              <div className="edp-thumbs" role="tablist" aria-label="Miniaturas">
                {imgs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    aria-current={i === imgIdx}
                    aria-label={`Ver foto ${i + 1}`}
                    role="tab"
                  >
                    <img src={img} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* Garantías */}
            <div className="edp-guards">
              <div className="edp-guard"><Truck className="w-4 h-4" /> Envío a todo Col.</div>
              <div className="edp-guard"><Shield className="w-4 h-4" /> Compra protegida</div>
              <div className="edp-guard"><RotateCcw className="w-4 h-4" /> Devoluciones</div>
            </div>
          </section>

          {/* ── Caja de compra (sticky) ─────────────────────── */}
          <aside className="edp-buy">
            <h1 className="edp-title">{product.title}</h1>

            <div className="edp-tags">
              <span className="edp-tag tag-new">Nuevo</span>
              <span className="edp-tag tag-col"><ShieldCheck className="w-3 h-3 inline -mt-px mr-1" />Verificado</span>
              {product.attributes?.material && (
                <span className="edp-tag">Material · {product.attributes.material}</span>
              )}
            </div>

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div className="edp-variants">
                <span className="lbl">Variante</span>
                <div className="edp-var-list">
                  {product.variants.map(vr => (
                    <button
                      key={vr.sku}
                      type="button"
                      className="edp-var-btn"
                      aria-pressed={selectedVariant?.sku === vr.sku}
                      onClick={() =>
                        setSelectedVariant(selectedVariant?.sku === vr.sku ? null : vr)
                      }
                    >
                      {vr.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Caja de precio */}
            <div className="edp-pricecard">
              <div className="edp-price">{fmt(currentPrice)}</div>
              <div className="edp-price-meta">
                <span className="pill">IVA incl.</span>
                <span>· Precio final, sin sorpresas.</span>
              </div>

              {currentStock > 0 ? (
                <div className="edp-stock ok">
                  <CheckCircle className="w-4 h-4" /> En stock · {currentStock} disp.
                </div>
              ) : (
                <div className="edp-stock no">
                  <AlertTriangle className="w-4 h-4" /> Sin stock
                </div>
              )}

              {currentStock > 0 && (
                <>
                  <div className="edp-qty">
                    <span>Cant.</span>
                    <div className="edp-qty-box">
                      <button
                        type="button"
                        onClick={() => setQty(q => Math.max(1, q - 1))}
                        disabled={qty <= 1}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="val" aria-live="polite">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(q => Math.min(currentStock, q + 1))}
                        disabled={qty >= currentStock}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={agregar}
                    className={'edp-cta-add' + (added ? ' done' : '')}
                  >
                    {added ? (
                      <><CheckCircle className="w-4 h-4" /> ¡Agregado!</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Agregar al carrito</>
                    )}
                  </motion.button>

                  <Link href="/checkout" className="edp-cta-buy">
                    Comprar ahora
                  </Link>
                </>
              )}

              {waSeller && (
                <a href={waSeller} target="_blank" rel="noopener noreferrer" className="edp-cta-wa">
                  <MessageCircle className="w-4 h-4" /> Contactar al vendedor
                </a>
              )}

              <div className="edp-trust">
                <Shield className="w-3.5 h-3.5" />
                Compra protegida con SSL 256-bit
              </div>
            </div>

            {/* Acciones secundarias */}
            <div className="edp-actions">
              <button type="button" onClick={compartir} className="edp-act-btn">
                {compartido ? (
                  <><CheckCircle className="w-4 h-4" /> Copiado</>
                ) : (
                  <><Share2 className="w-4 h-4" /> Compartir</>
                )}
              </button>
              <button
                type="button"
                className={'edp-act-btn edp-act-icon' + (isWished ? ' wished' : '')}
                aria-label={isWished ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                onClick={() =>
                  wishToggle({
                    productId: product._id,
                    storeId: store.id,
                    title: product.title,
                    price: currentPrice,
                    image: product.images?.[0],
                    slug: product._id,
                    storeSlug: store.slug,
                  })
                }
              >
                <Heart className="w-4 h-4" />
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  '¡Mira este producto en Shopper! ' + product.title + (pageUrl ? ' - ' + pageUrl : ''),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="edp-act-btn edp-act-icon"
                aria-label="Compartir por WhatsApp"
                style={{ color: '#1da851', borderColor: 'rgba(29,168,81,.35)', background: 'rgba(37,211,102,.08)' }}
                suppressHydrationWarning
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </aside>
        </div>

        {/* Descripción como artículo */}
        {product.description && (
          <article className="edp-article">
            <h2>Sobre <span className="it">este producto</span></h2>
            <p>{product.description}</p>
          </article>
        )}

        {/* Reseñas */}
        <div className="mt-10">
          <SeccionResenas productId={product._id} />
        </div>

        {/* Volver a la tienda */}
        <Link href={`/store/${slug}`} className="edp-back">
          <ArrowLeft className="w-4 h-4" /> Volver a {store.name}
        </Link>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && imgs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            className="edp-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Vista ampliada"
          >
            <img
              src={imgs[imgIdx]}
              alt={product.title}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              className="close"
              onClick={() => setLightbox(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante WhatsApp mobile */}
      {waSeller && (
        <a
          href={waSeller}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Preguntarle al vendedor por WhatsApp"
          className="md:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-sm pl-3.5 pr-4 py-3 rounded-full shadow-lg active:scale-95 transition-all"
        >
          <MessageCircle className="w-5 h-5" /> Preguntar
        </a>
      )}
    </div>
  );
}
