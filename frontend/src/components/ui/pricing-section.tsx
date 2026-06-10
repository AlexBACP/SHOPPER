'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Planes para VENDEDORES de Shopper.
   Toggle mensual/anual · tarjetas · tabla comparativa · FAQ.
   Estética editorial (hueso / tinta / terracota).
   ───────────────────────────────────────────────────────────── */

type Billing = 'mes' | 'anual';
const ANNUAL_OFF = 0.2; // 20% de descuento al pagar anual

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

type Plan = {
  name: string; desc: string; price: number; highlight: boolean;
  cta: string; href: string; features: string[];
};

const PLANS: Plan[] = [
  {
    name: 'Emprendedor', desc: 'Para empezar a vender sin costo, hoy mismo.',
    price: 0, highlight: false, cta: 'Abrir tienda gratis', href: '/auth/register',
    features: ['Hasta 10 productos', 'Comisión 8% por venta', '1 tienda', 'Tema básico', 'Pagos cada semana', 'Soporte por correo'],
  },
  {
    name: 'Negocio', desc: 'Para tiendas que ya venden y quieren crecer.',
    price: 29_900, highlight: true, cta: 'Empezar con Negocio', href: '/auth/register',
    features: ['Hasta 150 productos', 'Comisión 5% por venta', 'Editor de tienda completo', 'Dominio personalizado', 'Analíticas con IA', 'Cupones y descuentos', 'Soporte prioritario'],
  },
  {
    name: 'Empresa', desc: 'Para marcas con catálogo grande y equipo.',
    price: 89_900, highlight: false, cta: 'Empezar con Empresa', href: '/auth/register',
    features: ['Productos ilimitados', 'Comisión 0% por venta', 'Múltiples tiendas', 'Reportes avanzados', 'Carga masiva por Excel', 'Soporte dedicado 24/7', 'Onboarding personalizado'],
  },
];

/* Tabla comparativa: cada fila es una característica con su valor por plan.
   boolean → ✓ / ✗ · string → texto. Orden de columnas = PLANS. */
const COMPARISON: { label: string; values: (string | boolean)[] }[] = [
  { label: 'Productos publicados',  values: ['10', '150', 'Ilimitados'] },
  { label: 'Comisión por venta',    values: ['8%', '5%', '0%'] },
  { label: 'Número de tiendas',     values: ['1', '1', 'Varias'] },
  { label: 'Editor de tienda',      values: ['Básico', 'Completo', 'Completo'] },
  { label: 'Dominio personalizado', values: [false, true, true] },
  { label: 'Analíticas con IA',     values: [false, true, true] },
  { label: 'Cupones y descuentos',  values: [false, true, true] },
  { label: 'Carga masiva por Excel',values: [false, false, true] },
  { label: 'Soporte',               values: ['Correo', 'Prioritario', 'Dedicado 24/7'] },
];

const FAQ: { q: string; a: string }[] = [
  { q: '¿Puedo cambiar de plan cuando quiera?', a: 'Sí. Subes o bajas de plan en cualquier momento desde tu panel de vendedor; el cambio aplica de inmediato y se ajusta el cobro proporcional.' },
  { q: '¿Hay permanencia o cláusulas?', a: 'No. No hay contratos ni permanencia mínima. Cancelas cuando quieras y tu tienda pasa al plan gratuito.' },
  { q: '¿La comisión es aparte del precio del plan?', a: 'La comisión se descuenta de cada venta que haces (no es un cobro mensual extra). El precio del plan es lo único que pagas de forma fija.' },
  { q: '¿Cómo se cobra el plan?', a: 'Con tarjeta o los medios de pago de Wompi (PSE, Nequi, etc.). Si eliges facturación anual obtienes 20% de descuento.' },
  { q: '¿Qué pasa si supero el límite de productos?', a: 'Te avisamos antes de llegar al tope. Para publicar más solo necesitas subir al siguiente plan; nada se borra.' },
  { q: '¿Los precios incluyen IVA?', a: 'Sí, todos los precios mostrados ya incluyen el IVA del 19%. No hay cargos ocultos.' },
];

/* ── Toggle Mensual / Anual ─────────────────────────────── */
function BillingToggle({ value, onChange }: { value: Billing; onChange: (v: Billing) => void }) {
  return (
    <div className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bone-2)] p-1">
      {(['mes', 'anual'] as Billing[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={value === opt}
          className={cn(
            'rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors',
            value === opt ? 'bg-[var(--ink)] text-[var(--bone-2)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]',
          )}
        >
          {opt === 'mes' ? 'Mensual' : 'Anual'}
          {opt === 'anual' && (
            <span className={cn('ml-1.5 text-[11px] font-bold', value === opt ? 'text-[var(--accent-bright,#ffae8a)]' : 'text-[var(--primary)]')}>
              −20%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Celda de la tabla comparativa ──────────────────────── */
function Cell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="mx-auto h-5 w-5 text-[var(--selva)]" strokeWidth={2.5} />
      : <X className="mx-auto h-4 w-4 text-[var(--ink-soft)] opacity-40" strokeWidth={2.5} />;
  }
  return <span className="text-[14px] text-[var(--ink)]">{value}</span>;
}

/* ── Item de FAQ (acordeón nativo, accesible) ───────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[var(--line)] py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[var(--ink)] marker:hidden [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--ink-soft)] transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[var(--ink-soft)]">{a}</p>
    </details>
  );
}

export default function PricingSection() {
  const [billing, setBilling] = useState<Billing>('mes');
  const annual = billing === 'anual';
  const monthlyOf = (p: number) => (annual ? Math.round(p * (1 - ANNUAL_OFF)) : p);

  return (
    <section className="sec wrap" aria-labelledby="planes-heading">
      {/* Encabezado + toggle */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-[var(--primary)]">
          <Sparkles className="h-[14px] w-[14px]" /> Para vendedores
        </span>
        <h2
          id="planes-heading"
          className="mt-4 text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.02] tracking-[-.02em] text-[var(--ink)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Planes que{' '}
          <span className="italic font-normal text-[var(--primary)]" style={{ fontFamily: 'var(--font-serif)' }}>
            crecen contigo
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
          Empieza gratis y sube de plan cuando vendas más. Sin permanencia, cambia o cancela cuando quieras.
        </p>
        <BillingToggle value={billing} onChange={setBilling} />
      </div>

      {/* Tarjetas */}
      <div className="mt-14 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-[var(--bone-2)] p-7 transition-transform duration-300',
              plan.highlight
                ? 'border-[var(--primary)] shadow-[0_24px_60px_-20px_rgba(199,90,43,.35)] lg:-translate-y-3'
                : 'border-[var(--ed-hairline,rgba(34,29,22,.12))] shadow-[0_2px_8px_rgba(40,30,18,.06)]',
            )}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-7 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--bone-2)] shadow-md">
                <Sparkles className="h-3 w-3" /> Más popular
              </span>
            )}

            <h3 className="text-xl font-bold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
              {plan.name}
            </h3>
            <p className="mt-1.5 min-h-[40px] text-[13.5px] leading-snug text-[var(--ink-soft)]">{plan.desc}</p>

            {/* Precio */}
            <div className="mt-5 flex items-end gap-1.5">
              <span
                className="text-[40px] font-extrabold leading-none tracking-tight text-[var(--ink)]"
                style={{ fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}
              >
                {plan.price === 0 ? 'Gratis' : fmtCOP(monthlyOf(plan.price))}
              </span>
              {plan.price > 0 && <span className="pb-1 text-sm font-medium text-[var(--ink-soft)]">/mes</span>}
            </div>
            <p className="mt-1 h-4 text-[12px] text-[var(--primary)]">
              {plan.price > 0 && annual ? `Facturado anual · ahorras ${fmtCOP(plan.price * 12 * ANNUAL_OFF)}/año` : ''}
            </p>

            {/* CTA */}
            <Link
              href={plan.href}
              className={cn(
                'mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]',
                plan.highlight
                  ? 'bg-[var(--ink)] text-[var(--bone-2)] hover:bg-[var(--primary-2)]'
                  : 'border-[1.5px] border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--bone-2)]',
              )}
            >
              {plan.cta}
              <ArrowRight className="h-[18px] w-[18px]" />
            </Link>

            {/* Características */}
            <ul className="mt-7 space-y-3 border-t border-[var(--ed-hairline,rgba(34,29,22,.12))] pt-7">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-[14px] text-[var(--ink)]">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--selva-soft)]">
                    <Check className="h-3.5 w-3.5 text-[var(--selva)]" strokeWidth={2.5} />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* ── Tabla comparativa (escritorio) ─────────────────── */}
      <div className="mt-20 hidden md:block">
        <h3 className="text-center text-[clamp(22px,3vw,32px)] font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Compara los <span className="italic font-normal text-[var(--primary)]" style={{ fontFamily: 'var(--font-serif)' }}>planes</span>
        </h3>
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--bone-3)]">
                <th className="p-4 text-[13px] font-bold uppercase tracking-wide text-[var(--ink-soft)]">Característica</th>
                {PLANS.map((p) => (
                  <th key={p.name} className="p-4 text-center text-[14px] font-bold text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={row.label} className={cn('border-t border-[var(--line)]', i % 2 === 1 && 'bg-[var(--bone-2)]/40')}>
                  <td className="p-4 text-[14px] font-medium text-[var(--ink)]">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="p-4 text-center">
                      <Cell value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <div className="mx-auto mt-20 max-w-3xl">
        <h3 className="text-center text-[clamp(22px,3vw,32px)] font-extrabold tracking-tight text-[var(--ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          Preguntas <span className="italic font-normal text-[var(--primary)]" style={{ fontFamily: 'var(--font-serif)' }}>frecuentes</span>
        </h3>
        <div className="mt-8 border-t border-[var(--line)]">
          {FAQ.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* Nota al pie */}
      <p className="mt-12 text-center text-[13px] text-[var(--ink-soft)]">
        Los precios incluyen IVA. La comisión se descuenta de cada venta, no es un cobro aparte.
      </p>
    </section>
  );
}
