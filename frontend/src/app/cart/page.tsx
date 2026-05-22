'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, Package, ArrowRight,
  ShoppingBag, Shield, Truck, Tag, Ticket, CheckCircle,
  X, AlertCircle, Lock, BadgeCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore, IVA_RATE } from '@/store/cart.store';
import { toast } from 'sonner';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function CartPage() {
  const {
    items, removeItem, updateQuantity,
    subtotal, ivaAmount, discountAmount, total, count,
    coupon, discount, applyCoupon, removeCoupon,
  } = useCartStore();

  const [couponInput,   setCouponInput]   = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError,   setCouponError]   = useState('');

  const cartTotal = total();
  const cartCount = count();
  const sub       = subtotal();
  const iva       = ivaAmount();
  const disc      = discountAmount();

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError('');
    await new Promise(r => setTimeout(r, 700));
    const ok = applyCoupon(couponInput);
    setCouponLoading(false);
    if (ok) toast.success(`¡Cupón ${couponInput.toUpperCase()} aplicado! −${discount}%`);
    else setCouponError('Cupón inválido o expirado');
  };

  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const item    = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1] as [number,number,number,number], duration: 0.4 } } };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero header */}
      <div className="bg-[var(--nav-bg)] py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-300/30">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Carrito de compras</h1>
            <p className="text-white/50 text-sm">{cartCount > 0 ? `${cartCount} artículo${cartCount > 1 ? 's' : ''} · Total: ${fmt(cartTotal)}` : 'Tu carrito está vacío'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-28 h-28 bg-white border-2 border-dashed border-[var(--border)] rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <ShoppingCart className="w-12 h-12 text-[var(--border-hover)]" />
            </motion.div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Tu carrito está vacío</h2>
            <p className="text-[var(--text-muted)] mb-8">Descubre miles de productos en nuestras tiendas</p>
            <Link href="/" className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-200/50 text-base">
              <ShoppingBag className="w-5 h-5" /> Explorar tiendas
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">

            {/* Lista de items */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {/* Encabezado */}
              <motion.div variants={item} className="bg-white border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Productos ({cartCount})</p>
                  <button
                    onClick={() => { items.forEach(i => removeItem(i.productId)); toast.success('Carrito vaciado'); }}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Vaciar
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {items.map((it, i) => (
                    <motion.div key={it.productId}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className={`flex gap-4 px-5 py-4 hover:bg-[var(--surface-2)] transition-colors ${i < items.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                        {/* Imagen */}
                        <div className="w-20 h-20 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          {it.image
                            ? <img src={it.image} alt={it.title} className="w-full h-full object-contain p-2 hover:scale-110 transition-transform duration-300" />
                            : <Package className="w-7 h-7 text-[var(--border-hover)]" />}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-0.5">{it.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mb-3">SKU: {it.sku}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-white shadow-sm">
                              <button onClick={() => updateQuantity(it.productId, it.quantity - 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors border-r border-[var(--border)]">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <motion.span key={it.quantity} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                                className="w-10 text-center text-sm font-black">{it.quantity}</motion.span>
                              <button onClick={() => updateQuantity(it.productId, it.quantity + 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-2)] transition-colors border-l border-[var(--border)]"
                                disabled={it.quantity >= it.stock}>
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {it.stock <= 5 && (
                              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> ¡Últimas {it.stock}!
                              </span>
                            )}
                            <button onClick={() => removeItem(it.productId)}
                              className="text-xs text-[var(--text-muted)] hover:text-red-600 transition-colors flex items-center gap-1 hover:underline ml-auto">
                              <Trash2 className="w-3 h-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                        {/* Precio */}
                        <div className="text-right shrink-0">
                          <motion.p key={`${it.productId}-${it.quantity}`} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
                            className="text-base font-black text-[var(--text-primary)]">{fmt(it.price * it.quantity)}</motion.p>
                          {it.quantity > 1 && <p className="text-xs text-[var(--text-muted)]">{fmt(it.price)} c/u</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Garantías */}
              <motion.div variants={item} className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, text: 'Compra segura', sub: 'SSL 256-bit', color: 'text-green-600 bg-green-50 border-green-200' },
                  { icon: Truck,  text: 'Envíos',        sub: 'A todo Colombia', color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { icon: BadgeCheck, text: 'Vendedores', sub: 'Verificados', color: 'text-orange-600 bg-orange-50 border-orange-200' },
                ].map(({ icon: Icon, text, sub, color }) => (
                  <div key={text} className={`flex items-center gap-2 border rounded-xl p-3 text-xs ${color}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <div><p className="font-bold leading-tight">{text}</p><p className="opacity-70">{sub}</p></div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Resumen */}
            <div className="space-y-4">
              {/* Cupón */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-white border border-[var(--border)] rounded-xl p-4 shadow-sm">
                <p className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[var(--accent)]" /> Cupón de descuento
                </p>
                {coupon ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-black text-green-800">{coupon} — −{discount}%</p>
                      <p className="text-xs text-green-600">Ahorro: {fmt(disc)}</p>
                    </div>
                    <button onClick={removeCoupon} className="text-green-600 hover:text-green-800 transition-colors"><X className="w-4 h-4" /></button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={couponInput}
                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                        placeholder="SHOPPER10"
                        className="flex-1 px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-2)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all uppercase font-mono tracking-wider placeholder:normal-case placeholder:font-sans"
                      />
                      <button onClick={handleCoupon} disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-[var(--nav-bg)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all">
                        {couponLoading ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{couponError}</p>}
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">Prueba: SHOPPER10 · BIENVENIDO · COLOMBIA20</p>
                  </>
                )}
              </motion.div>

              {/* Totales */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-white border border-[var(--border)] rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--accent)]" /> Resumen del pedido
                </h2>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal ({cartCount} art.)</span><span>{fmt(sub)}</span>
                  </div>
                  {disc > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex justify-between text-green-600 font-semibold">
                      <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Descuento ({discount}%)</span>
                      <span>−{fmt(disc)}</span>
                    </motion.div>
                  )}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">IVA (19%) <span className="text-[10px] text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-full ml-1">Colombia</span></span>
                    <span>{fmt(iva)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Envío</span>
                    <span className="text-[var(--success)] font-semibold">A calcular</span>
                  </div>
                  <div className="h-px bg-[var(--border)] !my-3" />
                  <div className="flex justify-between font-black text-lg text-[var(--text-primary)]">
                    <span>Total</span>
                    <motion.span key={cartTotal} initial={{ scale: 1.05, color: '#FF9900' }} animate={{ scale: 1, color: '#0F1111' }} transition={{ duration: 0.3 }}>
                      {fmt(cartTotal)}
                    </motion.span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">* IVA del 19% incluido según legislación colombiana</p>
                </div>

                <div className="mt-5 space-y-2">
                  <Link href="/checkout"
                    className="flex items-center justify-center gap-2 w-full bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-200/50 text-base">
                    <Lock className="w-4 h-4" /> Pagar ahora <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/"
                    className="flex items-center justify-center gap-2 w-full border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium py-3 rounded-xl transition-colors text-sm">
                    Seguir comprando
                  </Link>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                  {['PSE', 'Nequi', 'Daviplata', 'Visa'].map(m => (
                    <span key={m} className="text-xs font-bold text-[var(--text-muted)]">{m}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
