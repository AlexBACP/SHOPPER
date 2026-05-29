'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ArrowLeft, MapPin, Package,
  Loader2, CreditCard, Shield, Lock, ChevronRight,
  Truck, BadgeCheck, Star, Phone, Smartphone,
  Landmark, Wallet, Check, AlertCircle, ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  shipping_name:    z.string().min(3, 'Nombre completo requerido'),
  shipping_phone:   z.string().min(7, 'Teléfono de contacto requerido'),
  shipping_address: z.string().min(5, 'Dirección válida requerida'),
  shipping_city:    z.string().min(2, 'Ciudad requerida'),
  shipping_dept:    z.string().min(2, 'Departamento requerido'),
  shipping_notes:   z.string().optional(),
});
type FormData = z.infer<typeof schema>;
type PayMethod = 'pse' | 'nequi' | 'daviplata' | 'card';
type Step = 'shipping' | 'payment' | 'processing';

const fmt  = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const STEPS_LABELS = ['Envío', 'Pago', 'Confirmado'];
const STEP_IDX: Record<Step, number> = { shipping: 0, payment: 1, processing: 1 };

const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
];

const PAY_METHODS: Array<{
  id: PayMethod; label: string; desc: string;
  Icon: LucideIcon; iconBg: string; iconColor: string; ring: string;
}> = [
  { id: 'pse',       label: 'PSE',       desc: 'Débito desde tu banco',    Icon: Landmark,   iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    ring: 'border-blue-500 ring-blue-100'       },
  { id: 'nequi',     label: 'Nequi',     desc: 'Billetera digital',        Icon: Smartphone, iconBg: 'bg-fuchsia-50', iconColor: 'text-fuchsia-600', ring: 'border-fuchsia-500 ring-fuchsia-100' },
  { id: 'daviplata', label: 'Daviplata', desc: 'Pago móvil Davivienda',    Icon: Wallet,     iconBg: 'bg-red-50',     iconColor: 'text-red-600',     ring: 'border-red-500 ring-red-100'         },
  { id: 'card',      label: 'Tarjeta',   desc: 'Crédito o débito',         Icon: CreditCard, iconBg: 'bg-indigo-50',  iconColor: 'text-indigo-600',  ring: 'border-indigo-500 ring-indigo-100'   },
];

function StepIndicator({ step }: { step: Step }) {
  const idx = STEP_IDX[step];
  return (
    <div className="flex items-center gap-1 max-w-xs">
      {STEPS_LABELS.map((label, i) => (
        <div key={label} className="flex items-center gap-1 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all duration-300 ${
            idx > i ? 'bg-green-500 text-white' :
            idx === i ? 'bg-[var(--accent)] text-white shadow-lg shadow-orange-200/60' :
            'bg-white/20 text-white/50'
          }`}>
            {idx > i ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
          </div>
          <span className={`text-xs font-medium transition-colors ${idx >= i ? 'text-white' : 'text-white/40'}`}>{label}</span>
          {i < STEPS_LABELS.length - 1 && (
            <div className={`flex-1 h-0.5 transition-colors duration-500 ${idx > i ? 'bg-green-500' : 'bg-white/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function InputField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-1.5">{label}</label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = "w-full px-4 py-2.5 text-sm border border-[var(--input-border)] rounded-xl bg-white text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-orange-100 transition-all";

export default function CheckoutPage() {
  const { user }  = useAuthStore();
  const {
    items, subtotal, ivaAmount, discountAmount, total, count, clearCart,
    coupon, discount,
  } = useCartStore();

  const [step,         setStep]         = useState<Step>('shipping');
  const [payMethod,    setPayMethod]    = useState<PayMethod>('pse');
  const [shippingData, setShippingData] = useState<FormData | null>(null);
  const [error,        setError]        = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const sub       = subtotal();
  const iva       = ivaAmount();
  const disc      = discountAmount();
  const cartTotal = total();
  const cartCount = count();

  if (!user || items.length === 0) return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-white border border-[var(--border)] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="w-10 h-10 text-[var(--border-hover)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">{!user ? 'Inicia sesión para continuar' : 'Tu carrito está vacío'}</h2>
        <p className="text-[var(--text-muted)] text-sm mb-6">{!user ? 'Necesitas una cuenta para completar tu compra' : 'Agrega productos antes de pagar'}</p>
        <Link href={!user ? '/auth/login' : '/'}
          className="inline-flex items-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-bold px-6 py-3 rounded-xl transition-all hover:shadow-md">
          {!user ? 'Iniciar sesión' : 'Explorar tiendas'}
        </Link>
      </div>
    </div>
  );

  const onShipping = (data: FormData) => { setShippingData(data); setStep('payment'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const onPay = async () => {
    if (!shippingData) return;
    setStep('processing'); setError('');
    try {
      // Crea la orden y prepara el pago. El backend devuelve la URL de la
      // pasarela segura de Wompi (si está configurada) para redirigir al usuario.
      const res = await api.post('/orders/checkout/prepare', {
        ...shippingData,
        payment_method: payMethod,
        coupon_code: coupon ?? undefined,
        items: items.map(i => ({
          productId: i.productId,
          storeId:   i.storeId,
          title:     i.title,
          sku:       i.sku,
          price:     i.price,
          quantity:  i.quantity,
          image:     i.image,
        })),
      });

      const { orderId, urlPago, wompiConfigurado, couponApplied } = res.data as {
        orderId: string; urlPago: string; wompiConfigurado: boolean; couponApplied: boolean;
      };

      clearCart();

      // El cupón venció/se agotó entre el carrito y el checkout → avisar
      const couponDropped = !!coupon && couponApplied === false;
      if (couponDropped) {
        toast.warning(
          `El cupón "${coupon}" ya no es válido. Tu pedido se procesó sin descuento.`,
          { duration: 6000 },
        );
        await new Promise(r => setTimeout(r, 1500)); // dar tiempo a leer el aviso
      }

      // Redirección real: a la pasarela de Wompi si está configurada,
      // o a la página de confirmación interna en caso contrario.
      if (wompiConfigurado && urlPago) {
        window.location.href = urlPago;
      } else {
        window.location.href = `/checkout/success?ref=${orderId}${couponDropped ? '&coupon_dropped=1' : ''}`;
      }
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al procesar el pago. Intenta de nuevo.';
      setError(msg);
      toast.error(msg);
      setStep('payment');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <div className="bg-[var(--nav-bg)] py-5 px-4 md:px-6 sticky top-0 z-30 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/cart" className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al carrito
            </Link>
            <div className="w-px h-4 bg-white/20" />
            <h1 className="text-base font-bold text-white">Finalizar compra</h1>
          </div>
          <StepIndicator step={step} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Formularios */}
        <div>
          <AnimatePresence mode="wait">
            {/* PASO 1: Envío */}
            {step === 'shipping' && (
              <motion.div key="shipping" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                <div className="bg-white border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-6 py-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[var(--accent)]" />
                    <h2 className="font-bold text-[var(--text-primary)]">Información de envío</h2>
                  </div>
                  <form onSubmit={handleSubmit(onShipping)} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField label="Nombre completo *" error={errors.shipping_name?.message}>
                        <input type="text" placeholder="Juan Pérez García" {...register('shipping_name')} className={inputCls} />
                      </InputField>
                      <InputField label="Teléfono de contacto *" error={errors.shipping_phone?.message}>
                        <input type="tel" placeholder="310 000 0000" {...register('shipping_phone')} className={inputCls} />
                      </InputField>
                    </div>
                    <InputField label="Dirección completa *" error={errors.shipping_address?.message}>
                      <input type="text" placeholder="Calle 80 #45-32, Apto 501, Barrio Chapinero" {...register('shipping_address')} className={inputCls} />
                    </InputField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField label="Ciudad *" error={errors.shipping_city?.message}>
                        <input type="text" placeholder="Bogotá, Medellín, Cali..." {...register('shipping_city')} className={inputCls} />
                      </InputField>
                      <InputField label="Departamento *" error={errors.shipping_dept?.message}>
                        <select {...register('shipping_dept')} className={inputCls}>
                          <option value="">Seleccionar...</option>
                          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </InputField>
                    </div>
                    <InputField label="Instrucciones adicionales" error={undefined}>
                      <textarea {...register('shipping_notes')} rows={3}
                        placeholder="Ej. Portería principal, dejar con el vecino del 502..."
                        className={`${inputCls} resize-none`} />
                    </InputField>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-orange-200/50 disabled:opacity-60">
                      Continuar al pago <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PASO 2: Pago */}
            {(step === 'payment' || step === 'processing') && (
              <motion.div key="payment" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                <div className="bg-white border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-6 py-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[var(--accent)]" />
                    <h2 className="font-bold text-[var(--text-primary)]">Método de pago</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-[var(--text-secondary)] mb-3">Elige cómo quieres pagar</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      {PAY_METHODS.map(m => {
                        const selected = payMethod === m.id;
                        return (
                          <motion.button key={m.id} type="button"
                            onClick={() => setPayMethod(m.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all bg-white ${
                              selected ? `${m.ring} ring-2 shadow-sm` : 'border-[var(--border)] hover:border-[var(--border-hover)]'
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-xl ${m.iconBg} flex items-center justify-center shrink-0`}>
                              <m.Icon className={`w-5 h-5 ${m.iconColor}`} strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{m.label}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{m.desc}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                              selected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-hover)]'
                            }`}>
                              {selected && (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                  <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
                                </motion.span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Redes aceptadas */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                      <span className="text-[11px] text-[var(--text-muted)]">Aceptamos:</span>
                      {['VISA', 'Mastercard', 'Amex', 'PSE', 'Nequi'].map(n => (
                        <span key={n} className="px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-bold text-[var(--text-secondary)] tracking-wide">{n}</span>
                      ))}
                    </div>

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                      </motion.div>
                    )}

                    <div className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] mb-3 bg-green-50 border border-green-200 rounded-xl p-3">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Pago protegido con cifrado <strong>SSL 256-bit</strong>. No almacenamos los datos de tu tarjeta en ningún momento.</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-xs text-blue-700 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3">
                      <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Al confirmar, tu pago se procesa de forma segura con <strong>Wompi</strong> (Bancolombia) y recibirás la confirmación de tu pedido al instante.</span>
                    </div>

                    <div className="flex gap-3">
                      <button type="button" onClick={() => setStep('shipping')} disabled={step === 'processing'}
                        className="flex-1 py-3.5 border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        <ArrowLeft className="w-4 h-4" /> Atrás
                      </button>
                      <motion.button type="button" onClick={onPay}
                        disabled={step === 'processing'}
                        whileTap={{ scale: 0.98 }}
                        className="flex-[1.6] py-3.5 bg-[var(--btn-cart-bg)] hover:bg-[var(--btn-cart-hover)] text-[var(--btn-cart-text)] font-black rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-orange-200/50 flex items-center justify-center gap-2 disabled:opacity-60">
                        {step === 'processing'
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo al pago…</>
                          : <><Lock className="w-4 h-4" /> Pagar {fmt(cartTotal)}</>
                        }
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar resumen */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white border border-[var(--border)] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[var(--accent)]" /> Tu pedido ({cartCount})
            </h3>
            <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
              {items.map(it => (
                <div key={it.productId} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg overflow-hidden shrink-0">
                    {it.image ? <img src={it.image} alt={it.title} className="w-full h-full object-contain p-1" /> : <Package className="w-4 h-4 text-[var(--text-muted)] m-auto mt-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{it.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">×{it.quantity}</p>
                  </div>
                  <p className="text-xs font-black text-[var(--text-primary)] shrink-0">{fmt(it.price * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span>{fmt(sub)}</span></div>
              {disc > 0 && <div className="flex justify-between text-green-600 font-semibold"><span>Descuento ({discount}%)</span><span>−{fmt(disc)}</span></div>}
              <div className="flex justify-between text-[var(--text-secondary)]"><span>IVA 19%</span><span>{fmt(iva)}</span></div>
              <div className="flex justify-between font-black text-base text-[var(--text-primary)] pt-1 border-t border-[var(--border)]">
                <span>Total</span><span className="text-[var(--accent-dark)]">{fmt(cartTotal)}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">* IVA 19% incluido · Ley colombiana</p>
            </div>
          </motion.div>

          {shippingData && step !== 'shipping' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm">
              <p className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5 text-sm">
                <Truck className="w-4 h-4 text-[var(--accent)]" /> Enviar a
              </p>
              <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
                <p className="font-semibold">{shippingData.shipping_name}</p>
                <p>{shippingData.shipping_address}</p>
                <p>{shippingData.shipping_city}, {shippingData.shipping_dept}</p>
                <p className="flex items-center gap-1 text-[var(--text-muted)]">
                  <Phone className="w-3 h-3" />{shippingData.shipping_phone}
                </p>
              </div>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
            {[
              { icon: Shield,    color: 'text-green-600', text: 'Pago 100% seguro',         sub: 'SSL 256-bit certificado' },
              { icon: BadgeCheck,color: 'text-blue-600',  text: 'Vendedores verificados',    sub: 'Identidad confirmada' },
              { icon: Star,      color: 'text-orange-500',text: 'Satisfacción garantizada',  sub: 'Política de devoluciones' },
            ].map(({ icon: Icon, color, text, sub }) => (
              <div key={text} className="flex items-center gap-3 text-xs">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div><p className="font-semibold text-[var(--text-primary)]">{text}</p><p className="text-[var(--text-muted)]">{sub}</p></div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
