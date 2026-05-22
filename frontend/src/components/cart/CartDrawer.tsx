'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingCart, Trash2, Plus, Minus,
  Package, ArrowRight, ShoppingBag,
  Shield, Tag, CheckCircle, Ticket, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore, IVA_RATE } from '@/store/cart.store';
import { toast } from 'sonner';

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function CartDrawer() {
  const {
    items, isOpen, closeCart, removeItem, updateQuantity,
    subtotal, ivaAmount, discountAmount, total, count,
    coupon, discount, applyCoupon, removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const cartTotal = total();
  const cartCount = count();
  const sub       = subtotal();
  const iva       = ivaAmount();
  const disc      = discountAmount();

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError('');
    await new Promise(r => setTimeout(r, 600)); // simular llamada
    const ok = applyCoupon(couponInput);
    setCouponLoading(false);
    if (ok) { toast.success(`¡Cupón aplicado! ${discount}% de descuento`); setCouponInput(''); }
    else    { setCouponError('Cupón inválido o expirado'); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-[var(--nav-bg)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-white" />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--accent)] rounded-full text-[9px] font-black text-white flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </div>
                <h2 className="font-bold text-white text-base">
                  {cartCount === 0 ? 'Carrito vacío' : `Carrito (${cartCount})`}
                </h2>
              </div>
              <button onClick={closeCart}
                className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto bg-[var(--surface-2)]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16 px-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-white border-2 border-dashed border-[var(--border)] rounded-3xl flex items-center justify-center"
                  >
                    <ShoppingBag className="w-10 h-10 text-[var(--border-hover)]" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-[var(--text-primary)] text-lg mb-1">Tu carrito está vacío</p>
                    <p className="text-sm text-[var(--text-muted)]">Agrega productos para comenzar</p>
                  </div>
                  <button onClick={closeCart}
                    className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-200/50">
                    Explorar tiendas
                  </button>
                </div>
              ) : (
                <div className="p-4 flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 48, scale: 0.95, transition: { duration: 0.2 } }}
                        className="flex gap-3 bg-white border border-[var(--border)] rounded-xl p-3 hover:border-[var(--accent-border)] hover:shadow-sm transition-all"
                      >
                        {/* Imagen */}
                        <div className="w-16 h-16 bg-[var(--surface-2)] rounded-lg border border-[var(--border)] overflow-hidden shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.title} className="w-full h-full object-contain p-1" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[var(--border-hover)]" /></div>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-tight mb-1">{item.title}</p>
                          <p className="text-xs text-[var(--text-muted)] mb-2">SKU: {item.sku}</p>
                          <div className="flex items-center gap-0.5 mb-2">
                            <p className="text-sm font-black text-[var(--text-primary)]">{fmt(item.price * item.quantity)}</p>
                            {item.quantity > 1 && <p className="text-xs text-[var(--text-muted)] ml-1">({fmt(item.price)} c/u)</p>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface-2)]">
                              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border)] transition-colors border-r border-[var(--border)]">
                                <Minus className="w-3 h-3" />
                              </button>
                              <motion.span key={item.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                                className="text-sm font-bold w-8 text-center">{item.quantity}</motion.span>
                              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-[var(--border)] transition-colors border-l border-[var(--border)]"
                                disabled={item.quantity >= item.stock}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.productId)}
                              className="text-xs text-[var(--text-muted)] hover:text-red-600 transition-colors flex items-center gap-1 hover:underline">
                              <Trash2 className="w-3 h-3" /> Quitar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer con resumen y cupón */}
            {items.length > 0 && (
              <div className="border-t border-[var(--border)] bg-white shrink-0">
                {/* Cupón */}
                <div className="px-4 pt-4">
                  {coupon ? (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-green-800">Cupón <span className="font-black">{coupon}</span> aplicado</p>
                        <p className="text-xs text-green-600">−{discount}% de descuento</p>
                      </div>
                      <button onClick={removeCoupon} className="text-green-600 hover:text-green-800 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <input
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Código de descuento"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface-2)] outline-none focus:border-[var(--accent)] transition-colors uppercase font-mono tracking-wider"
                          />
                        </div>
                        <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                          className="px-3 py-2 bg-[var(--nav-bg)] text-white text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-40 transition-all whitespace-nowrap">
                          {couponLoading ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {couponError}
                        </motion.p>
                      )}
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">Prueba: SHOPPER10 · BIENVENIDO · COLOMBIA20</p>
                    </div>
                  )}
                </div>

                {/* Resumen precios */}
                <div className="px-4 pb-2 space-y-1.5 text-sm border-t border-[var(--border)] pt-3">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Subtotal ({cartCount} art.)</span>
                    <span>{fmt(sub)}</span>
                  </div>
                  {disc > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between text-green-600 font-medium">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Descuento ({discount}%)</span>
                      <span>−{fmt(disc)}</span>
                    </motion.div>
                  )}
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>IVA (19%)</span>
                    <span>{fmt(iva)}</span>
                  </div>
                  <div className="h-px bg-[var(--border)] my-1" />
                  <div className="flex justify-between font-black text-base text-[var(--text-primary)]">
                    <span>Total con IVA</span>
                    <motion.span key={cartTotal} initial={{ scale: 1.1, color: '#FF9900' }} animate={{ scale: 1, color: '#0F1111' }}>
                      {fmt(cartTotal)}
                    </motion.span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-4 pb-5 pt-3 flex flex-col gap-2">
                  <Link href="/checkout" onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black text-sm py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-200/50 active:scale-[0.98]">
                    Finalizar compra <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/cart" onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold text-sm py-3 rounded-xl border border-[#FCD200] transition-all">
                    <ShoppingBag className="w-4 h-4" /> Ver carrito completo
                  </Link>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-1">
                    <Shield className="w-3 h-3 text-green-600" />
                    Compra segura · SSL 256-bit · IVA incluido
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
