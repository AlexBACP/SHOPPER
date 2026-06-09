'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, ArrowLeft, MapPin, Package,
  Loader2, CreditCard, Shield, Lock, ChevronRight,
  Truck, BadgeCheck, Star, Phone, Smartphone,
  Landmark, Wallet, Check, AlertCircle, ShieldCheck, Banknote,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { costoEnvio } from '@/lib/shipping';
import { FREE_SHIPPING_THRESHOLD } from '@/config/constants';
import api from '@/lib/api';
import { getApiMessage } from '@/lib/errors';
import OrderSummary from '@/components/cart/OrderSummary';
import FreeShippingProgress from '@/components/cart/FreeShippingProgress';
import { toast } from 'sonner';

const schema = z.object({
  shipping_name:    z.string().trim().min(3, 'Nombre completo requerido'),
  shipping_phone:   z.string().trim().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  shipping_address: z.string().trim().min(5, 'Dirección válida requerida'),
  shipping_city:    z.string().trim().min(2, 'Ciudad requerida'),
  shipping_dept:    z.string().trim().min(2, 'Departamento requerido'),
  shipping_notes:   z.string().max(500, 'Máximo 500 caracteres').optional(),
});
type FormData = z.infer<typeof schema>;
type PayMethod = 'pse' | 'nequi' | 'daviplata' | 'card' | 'cod';
type Step = 'shipping' | 'payment' | 'processing';

const fmt  = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const STEPS: { id: Step; label: string }[] = [
  { id: 'shipping', label: 'Envío' },
  { id: 'payment',  label: 'Pago' },
];
const STEP_IDX: Record<Step, number> = { shipping: 0, payment: 1, processing: 1 };

const DEPARTAMENTOS = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas',
  'Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca',
  'Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño',
  'Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés',
  'Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada',
];

const PAY_METHODS: Array<{ id: PayMethod; label: string; desc: string; Icon: LucideIcon; }> = [
  { id: 'pse',       label: 'PSE',                  desc: 'Débito desde tu banco',          Icon: Landmark   },
  { id: 'nequi',     label: 'Nequi',                desc: 'Billetera digital',              Icon: Smartphone },
  { id: 'daviplata', label: 'Daviplata',            desc: 'Pago móvil Davivienda',          Icon: Wallet     },
  { id: 'card',      label: 'Tarjeta',              desc: 'Crédito o débito',               Icon: CreditCard },
  { id: 'cod',       label: 'Pago contra entrega',  desc: 'En efectivo al recibir',         Icon: Banknote   },
];

function StepIndicator({ step }: { step: Step }) {
  const idx = STEP_IDX[step];
  return (
    <div className="edc-steps" aria-label="Progreso">
      {STEPS.map((s, i) => (
        <div key={s.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <div className={'edc-step ' + (idx > i ? 'done' : idx === i ? 'active' : '')}>
            <span className="num" aria-hidden>
              {idx > i ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
            </span>
            <span className="lbl">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <span className="edc-step-line" />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="edc-field">
      <label className="edc-field-label">
        {label}{required && <span className="req">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            className="edc-field-err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

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
  const envioConocido = !!shippingData;
  const envio         = envioConocido ? costoEnvio(shippingData!.shipping_dept, sub) : 0;
  const totalConEnvio = cartTotal + envio;

  // —— Pantalla vacía (sin sesión / sin items) ——
  if (!user || items.length === 0) {
    return (
      <div className="edc-empty-screen">
        <div className="box">
          <div className="icon"><ShoppingBag className="w-9 h-9" /></div>
          <h2>
            {!user
              ? <>Inicia <span className="it">sesión</span> para continuar</>
              : <>Tu carrito está <span className="it">vacío</span></>}
          </h2>
          <p>
            {!user
              ? 'Necesitas una cuenta para completar tu compra de forma segura.'
              : 'Agrega productos antes de continuar al checkout.'}
          </p>
          <Link
            href={!user ? '/auth/login' : '/'}
            className="btn btn-primary"
          >
            {!user ? 'Iniciar sesión' : 'Explorar tiendas'}
          </Link>
        </div>
      </div>
    );
  }

  const onShipping = (data: FormData) => {
    setShippingData(data);
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onPay = async () => {
    if (!shippingData) return;
    setStep('processing'); setError('');
    try {
      const res = await api.post('/orders/checkout/prepare', {
        ...shippingData,
        payment_method: payMethod,
        coupon_code: coupon ?? undefined,
        items: items.map(i => ({
          productId: i.productId, storeId: i.storeId, title: i.title, sku: i.sku,
          price: i.price, quantity: i.quantity, image: i.image,
        })),
      });

      const { orderId, urlPago, wompiConfigurado, couponApplied } = res.data as {
        orderId: string; urlPago: string; wompiConfigurado: boolean; couponApplied: boolean;
      };

      clearCart();

      const couponDropped = !!coupon && couponApplied === false;
      if (couponDropped) {
        toast.warning(
          `El cupón "${coupon}" ya no es válido. Tu pedido se procesó sin descuento.`,
          { duration: 6000 },
        );
        await new Promise(r => setTimeout(r, 1500));
      }

      if (wompiConfigurado && urlPago) {
        window.location.href = urlPago;
      } else {
        window.location.href = `/checkout/success?ref=${orderId}&method=${payMethod}${couponDropped ? '&coupon_dropped=1' : ''}`;
      }
    } catch (e: unknown) {
      const msg = getApiMessage(e, 'No pudimos procesar el pago. Intenta de nuevo en un momento.');
      setError(msg);
      toast.error(msg);
      setStep('payment');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone)' }}>
      {/* —— Masthead editorial —— */}
      <div className="edc-mast">
        <div className="edc-mast-inner">
          <Link href="/cart" className="edc-back">
            <ArrowLeft className="w-4 h-4" /> Volver al carrito
          </Link>
          <h1 className="edc-title">Finalizar <span className="em">compra</span></h1>
          <StepIndicator step={step} />
        </div>
      </div>

      <div className="edc-grid">

        {/* —— Columna principal —— */}
        <div>
          <AnimatePresence mode="wait">

            {/* PASO 1: Envío */}
            {step === 'shipping' && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28 }}
              >
                <div className="edc-card">
                  <div className="edc-card-h">
                    <MapPin className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <h2>Datos de <span className="it">envío</span></h2>
                  </div>

                  <form onSubmit={handleSubmit(onShipping)} className="edc-card-body" noValidate>
                    <div className="edc-row-2">
                      <Field label="Nombre completo" required error={errors.shipping_name?.message}>
                        <input
                          type="text"
                          placeholder="Juan Pérez García"
                          className="edc-input"
                          autoComplete="name"
                          {...register('shipping_name')}
                        />
                      </Field>
                      <Field label="Teléfono" required error={errors.shipping_phone?.message}>
                        <input
                          type="tel"
                          inputMode="tel"
                          placeholder="310 000 0000"
                          className="edc-input"
                          autoComplete="tel-national"
                          {...register('shipping_phone')}
                        />
                      </Field>
                    </div>

                    <div className="edc-row-3" style={{ marginTop: 18 }}>
                      <Field label="Dirección completa" required error={errors.shipping_address?.message}>
                        <input
                          type="text"
                          placeholder="Calle 80 #45-32, Apto 501, Barrio Chapinero"
                          className="edc-input"
                          autoComplete="street-address"
                          {...register('shipping_address')}
                        />
                      </Field>
                    </div>

                    <div className="edc-row-2" style={{ marginTop: 18 }}>
                      <Field label="Ciudad" required error={errors.shipping_city?.message}>
                        <input
                          type="text"
                          placeholder="Bogotá, Medellín, Cali..."
                          className="edc-input"
                          autoComplete="address-level2"
                          {...register('shipping_city')}
                        />
                      </Field>
                      <Field label="Departamento" required error={errors.shipping_dept?.message}>
                        <select
                          className="edc-select"
                          autoComplete="address-level1"
                          {...register('shipping_dept')}
                        >
                          <option value="">Seleccionar...</option>
                          {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </Field>
                    </div>

                    <div className="edc-row-3" style={{ marginTop: 18 }}>
                      <Field label="Instrucciones adicionales">
                        <textarea
                          rows={3}
                          className="edc-textarea"
                          placeholder="Ej. Portería principal, dejar con el vecino del 502..."
                          {...register('shipping_notes')}
                        />
                      </Field>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="edc-cta-next" style={{ marginTop: 26 }}>
                      Continuar al pago <ChevronRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* PASO 2: Pago */}
            {(step === 'payment' || step === 'processing') && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -18 }}
                transition={{ duration: 0.28 }}
              >
                <div className="edc-card">
                  <div className="edc-card-h">
                    <CreditCard className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <h2>Método de <span className="it">pago</span></h2>
                  </div>

                  <div className="edc-card-body">
                    <div className="edc-pays" role="radiogroup" aria-label="Método de pago">
                      {PAY_METHODS.map(m => {
                        const Ic = m.Icon;
                        const selected = payMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className="edc-pay"
                            aria-pressed={selected}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setPayMethod(m.id)}
                          >
                            <span className="edc-pay-icon"><Ic className="w-5 h-5" /></span>
                            <span className="edc-pay-info">
                              <span className="lbl">{m.label}</span>
                              <span className="ds">{m.desc}</span>
                            </span>
                            <span className="edc-pay-check" aria-hidden>
                              {selected && <Check className="w-3 h-3" strokeWidth={3.5} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Redes aceptadas */}
                    <div className="edc-nets">
                      <span className="lbl">Aceptamos:</span>
                      {['VISA', 'Mastercard', 'Amex', 'PSE', 'Nequi'].map(n => (
                        <span key={n} className="edc-net">{n}</span>
                      ))}
                    </div>

                    {/* Error */}
                    {error && (
                      <motion.div
                        className="edc-note err"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </motion.div>
                    )}

                    {/* Avisos según método */}
                    {payMethod === 'cod' ? (
                      <div className="edc-note ok">
                        <Banknote className="w-4 h-4" />
                        <span>
                          <strong>Pago contra entrega:</strong> pagas en <strong>efectivo al recibir</strong> tu pedido. Ten el monto exacto listo. El vendedor coordinará la entrega contigo.
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="edc-note ok">
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            Pago protegido con cifrado <strong>SSL 256-bit</strong>. No almacenamos los datos de tu tarjeta en ningún momento.
                          </span>
                        </div>
                        <div className="edc-note warn">
                          <Lock className="w-4 h-4" />
                          <span>
                            Al confirmar, tu pago se procesa de forma segura con <strong>Wompi</strong> (Bancolombia) y recibirás la confirmación al instante.
                          </span>
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
                      <button
                        type="button"
                        onClick={() => setStep('shipping')}
                        disabled={step === 'processing'}
                        className="edc-cta-back"
                      >
                        <ArrowLeft className="w-4 h-4" /> Atrás
                      </button>
                      <button
                        type="button"
                        onClick={onPay}
                        disabled={step === 'processing'}
                        className="edc-cta-pay"
                      >
                        {step === 'processing'
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> {payMethod === 'cod' ? 'Confirmando…' : 'Redirigiendo…'}</>
                          : payMethod === 'cod'
                            ? <><Banknote className="w-4 h-4" /> Confirmar · {fmt(totalConEnvio)}</>
                            : <><Lock className="w-4 h-4" /> Pagar {fmt(totalConEnvio)}</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* —— Sidebar resumen —— */}
        <aside className="edc-side">

          {/* Resumen de pedido */}
          <motion.section
            className="edc-summary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <header className="edc-summary-h">
              <div>
                <div className="lbl">Tu pedido</div>
                <h3 className="ti">Resumen <span className="it">de compra</span></h3>
              </div>
              <span className="ct">×{cartCount}</span>
            </header>

            <div style={{ padding: '14px 22px 0' }}>
              <FreeShippingProgress subtotal={sub} size="compact" />
            </div>

            <div className="edc-summary-items">
              {items.map(it => (
                <div className="edc-summary-item" key={it.productId}>
                  <div className="img">
                    {it.image
                      ? <img src={it.image} alt={it.title} loading="lazy" />
                      : <Package className="w-4 h-4" style={{ color: 'var(--ink-soft)' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="ti">{it.title}</div>
                    <div className="qt">×{it.quantity}</div>
                  </div>
                  <span className="pr">{fmt(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="edc-summary-totals">
              <OrderSummary
                itemCount={count()}
                subtotal={sub}
                discountPct={discount}
                discountAmount={disc}
                ivaIncluded={iva}
                shipping={envioConocido ? envio : 'pending'}
              />
              {sub < FREE_SHIPPING_THRESHOLD && (
                <p style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6, fontStyle: 'italic' }}>
                  Envío gratis en compras sobre {fmt(FREE_SHIPPING_THRESHOLD)}.
                </p>
              )}
            </div>
          </motion.section>

          {/* Dirección confirmada */}
          {shippingData && step !== 'shipping' && (
            <motion.section
              className="edc-ship"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="h">
                <Truck className="w-4 h-4" /> Enviar a
              </div>
              <p>
                <span className="nm">{shippingData.shipping_name}</span><br />
                {shippingData.shipping_address}<br />
                {shippingData.shipping_city}, {shippingData.shipping_dept}
              </p>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                <Phone className="w-3 h-3" /> {shippingData.shipping_phone}
              </p>
            </motion.section>
          )}

          {/* Trust badges */}
          <motion.section
            className="edc-trust-list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {[
              { Icon: Shield,     cls: 'ok', t: 'Pago 100% seguro',         d: 'Certificado SSL 256-bit' },
              { Icon: BadgeCheck, cls: 'pr', t: 'Vendedores verificados',   d: 'Identidad confirmada' },
              { Icon: Star,       cls: 'in', t: 'Satisfacción garantizada', d: 'Política de devoluciones' },
            ].map(({ Icon, cls, t, d }) => (
              <div className="edc-trust-item" key={t}>
                <span className={`ic ${cls}`}><Icon className="w-4 h-4" /></span>
                <div>
                  <div className="ti">{t}</div>
                  <div className="ds">{d}</div>
                </div>
              </div>
            ))}
          </motion.section>
        </aside>
      </div>
    </div>
  );
}
