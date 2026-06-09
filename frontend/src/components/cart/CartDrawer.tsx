'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingCart, Trash2, Plus, Minus,
  Package, ArrowRight, ShoppingBag,
  Shield, Tag, CheckCircle, Ticket, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import FreeShippingProgress from '@/components/cart/FreeShippingProgress';
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
    const result = await applyCoupon(couponInput);
    setCouponLoading(false);
    if (result.ok) { toast.success(`¡Cupón aplicado! ${discount}% de descuento`); setCouponInput(''); }
    else           { setCouponError(result.message ?? 'Cupón inválido o expirado'); }
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
            className="fixed inset-0 z-50 backdrop-blur-[3px]"
            style={{ background: 'rgba(34,29,22,0.42)' }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-50 flex flex-col bg-[var(--bone)] shadow-[var(--shadow-lg)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--line)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-[var(--ink)]" />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[var(--primary)] rounded-full text-[9px] font-black text-[var(--bone-2)] flex items-center justify-center"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </div>
                <h2 className="font-extrabold text-[var(--ink)] text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Tu carrito
                </h2>
              </div>
              <button onClick={closeCart}
                className="w-10 h-10 flex items-center justify-center text-[var(--ink)] hover:bg-[var(--bone-3)] rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de envío gratis (P1.2) */}
            {items.length > 0 && (
              <div className="px-6 py-4 bg-[var(--bone-2)] border-b border-[var(--line)] shrink-0">
                <FreeShippingProgress subtotal={sub} size="compact" />
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16 px-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-[var(--bone-2)] border-2 border-dashed border-[var(--line)] rounded-3xl flex items-center justify-center"
                  >
                    <ShoppingBag className="w-10 h-10 text-[var(--line)]" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-[var(--ink)] text-lg mb-1">Tu carrito está vacío</p>
                    <p className="text-sm text-[var(--ink-soft)]">Explora las tiendas y agrega lo que te guste.</p>
                  </div>
                  <button onClick={closeCart} className="btn btn-primary" style={{ background: 'var(--primary)' }}>
                    Seguir comprando
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
                        className="flex gap-3 bg-[var(--bone-2)] border border-[var(--line)] rounded-[var(--r-md)] p-3 hover:shadow-[var(--shadow-sm)] transition-all"
                      >
                        {/* Imagen */}
                        <div className="w-[72px] h-[72px] bg-[var(--bone-3)] rounded-[10px] overflow-hidden shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[var(--ink-soft)]" /></div>}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--ink)] line-clamp-2 leading-tight mb-1">{item.title}</p>
                          <p className="text-xs text-[var(--ink-soft)] mb-2">SKU: {item.sku}</p>
                          <div className="flex items-center gap-0.5 mb-2">
                            <p className="text-sm font-extrabold text-[var(--ink)]">{fmt(item.price * item.quantity)}</p>
                            {item.quantity > 1 && <p className="text-xs text-[var(--ink-soft)] ml-1">({fmt(item.price)} c/u)</p>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-[var(--line)] rounded-full overflow-hidden">
                              <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-[30px] h-[30px] flex items-center justify-center text-[var(--ink)] hover:text-[var(--primary)] transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <motion.span key={item.quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                                className="text-sm font-bold w-7 text-center">{item.quantity}</motion.span>
                              <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-[30px] h-[30px] flex items-center justify-center text-[var(--ink)] hover:text-[var(--primary)] transition-colors disabled:opacity-40"
                                disabled={item.quantity >= item.stock}>
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button onClick={() => removeItem(item.productId)}
                              className="text-xs text-[var(--ink-soft)] hover:text-[var(--danger)] transition-colors flex items-center gap-1 hover:underline">
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
              <div className="border-t border-[var(--line)] bg-[var(--bone-2)] shrink-0">
                {/* Cupón */}
                <div className="px-5 pt-4">
                  {coupon ? (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 bg-[var(--selva-soft)] border border-[var(--selva)]/30 rounded-xl px-3 py-2.5 mb-3">
                      <CheckCircle className="w-4 h-4 text-[var(--selva)] shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-[var(--selva)]">Cupón <span className="font-black">{coupon}</span> aplicado</p>
                        <p className="text-xs text-[var(--selva)]">−{discount}% de descuento</p>
                      </div>
                      <button onClick={removeCoupon} className="text-[var(--selva)] hover:opacity-70 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <div className="mb-3">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--ink-soft)]" />
                          <input
                            value={couponInput}
                            onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                            placeholder="Código de descuento"
                            className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--line)] rounded-lg bg-[var(--bone-3)] outline-none focus:border-[var(--primary)] transition-colors uppercase font-mono tracking-wider text-[var(--ink)]"
                          />
                        </div>
                        <button onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                          className="px-4 py-2 bg-[var(--ink)] text-[var(--bone-2)] text-xs font-bold rounded-full hover:bg-[var(--primary-2)] disabled:opacity-40 transition-all whitespace-nowrap">
                          {couponLoading ? '...' : 'Aplicar'}
                        </button>
                      </div>
                      {couponError && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="text-xs text-[var(--danger)] mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {couponError}
                        </motion.p>
                      )}
                      <p className="text-[10px] text-[var(--ink-soft)] mt-1">Prueba: SHOPPER10 · BIENVENIDO · COLOMBIA20</p>
                    </div>
                  )}
                </div>

                {/* Resumen precios */}
                <div className="px-5 pb-2 space-y-1.5 text-sm border-t border-[var(--line)] pt-3">
                  <div className="flex justify-between text-[var(--ink-soft)]">
                    <span>Subtotal ({cartCount} art.)</span>
                    <span>{fmt(sub)}</span>
                  </div>
                  {disc > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="flex justify-between text-[var(--selva)] font-medium">
                      <span className="flex items-center gap-1"><Tag className="w-3 h-3" />Descuento ({discount}%)</span>
                      <span>−{fmt(disc)}</span>
                    </motion.div>
                  )}
                  <div className="flex justify-between text-[var(--text-muted)]">
                    <span>IVA incluido (19%)</span>
                    <span>{fmt(iva)}</span>
                  </div>
                  <div className="h-px bg-[var(--line)] my-1" />
                  <div className="flex justify-between font-extrabold text-[var(--ink)] items-baseline">
                    <span className="text-base">Total con IVA</span>
                    <motion.span key={cartTotal} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
                      className="text-[28px] leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {fmt(cartTotal)}
                    </motion.span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
                  <Link href="/checkout" onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full bg-[var(--primary)] hover:bg-[var(--primary-2)] text-[var(--bone-2)] font-semibold text-sm py-3.5 rounded-full transition-all hover:shadow-[var(--shadow-md)] active:scale-[0.98]">
                    Ir a pagar <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/cart" onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full border-[1.5px] border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bone-2)] font-semibold text-sm py-3 rounded-full transition-all">
                    <ShoppingBag className="w-4 h-4" /> Ver carrito completo
                  </Link>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-[var(--ink-soft)] mt-1">
                    <Shield className="w-3 h-3 text-[var(--selva)]" />
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
