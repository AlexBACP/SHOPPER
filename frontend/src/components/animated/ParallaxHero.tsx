'use client';

/**
 * ParallaxHero — Hero editorial con parallax scroll-driven.
 *
 * Tres capas que se mueven a distinta velocidad mientras haces scroll:
 *   1. Fondo (lento)      → atmósfera
 *   2. Imagen producto    → ancla visual
 *   3. Headline + CTA     → más rápido, sensación de profundidad
 *
 * Usa la paleta Mercado Editorial de Shopper vía CSS variables (no hardcoded).
 * Respeta prefers-reduced-motion: en ese caso desactiva el parallax.
 */

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface ParallaxHeroProps {
  eyebrow?:   string;
  title:      string;
  subtitle?:  string;
  ctaLabel?:  string;
  ctaHref?:   string;
  imageUrl?:  string;
}

export default function ParallaxHero({
  eyebrow  = 'Marketplace independiente',
  title    = 'Descubre Colombia\nhecha a mano',
  subtitle = 'Cientos de tiendas pequeñas, miles de historias. Compra directo del creador con envío a todo el país.',
  ctaLabel = 'Explorar tiendas',
  ctaHref  = '/search',
  imageUrl = 'https://images.unsplash.com/photo-1606293459339-aa5d34a7b0e1?w=1200&q=85&auto=format&fit=crop',
}: ParallaxHeroProps) {
  const ref          = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });

  // Capas a distinta velocidad — desactiva si el usuario pide menos movimiento
  const yBg      = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['0%',  '40%']);
  const yImage   = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['0%', '-15%']);
  const yContent = useTransform(scrollYProgress, [0, 1], reducedMotion ? ['0%', '0%'] : ['0%', '-25%']);
  const opacity  = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale    = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden"
      style={{ minHeight: '92vh', backgroundColor: 'var(--bg)' }}
    >
      {/* CAPA 1 — fondo orgánico (más lento) */}
      <motion.div
        aria-hidden
        style={{ y: yBg }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute -top-32 -left-32 h-[55vh] w-[55vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent-glow), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-[60vh] w-[60vh] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--blue-glow), transparent 70%)' }}
        />
        {/* Grano sutil sobre el fondo */}
        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </motion.div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-12 lg:py-32">
        {/* TEXTO — capa más rápida */}
        <motion.div
          style={{ y: yContent, opacity }}
          className="lg:col-span-6"
        >
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase"
            style={{
              background: 'var(--accent-subtle)',
              color:      'var(--accent-dark)',
              border:     '1px solid var(--accent-border)',
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="mt-6 text-5xl leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {title.split('\n').map((line, i) => (
              <span key={i} className="block">
                {i === 1
                  ? <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{line}</span>
                  : line}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-6 max-w-xl text-lg leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link href={ctaHref}>
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-medium shadow-lg"
                style={{
                  background: 'var(--btn-primary-bg)',
                  color:      'var(--btn-primary-text)',
                  boxShadow:  'var(--shadow-btn)',
                }}
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.span>
            </Link>

            <Link
              href="/owner"
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: 'var(--text-link)' }}
            >
              Vender en Shopper →
            </Link>
          </motion.div>

          {/* Mini-stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-12 grid max-w-md grid-cols-3 gap-6"
          >
            {[
              { n: '500+',  l: 'Tiendas' },
              { n: '12k+',  l: 'Productos' },
              { n: '4.9 ★', l: 'Calificación' },
            ].map((s, i) => (
              <div key={i}>
                <div
                  className="text-2xl font-medium"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
                >
                  {s.n}
                </div>
                <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {s.l}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* IMAGEN — capa media */}
        <motion.div
          style={{ y: yImage, scale }}
          className="relative lg:col-span-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            animate={{ opacity: 1, scale: 1,    rotate: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl"
            style={{ boxShadow: 'var(--shadow-card-hover)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Producto destacado de tienda independiente colombiana"
              className="h-full w-full object-cover"
            />
            {/* viñeta cálida sobre la imagen */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, rgba(34,29,22,0.35) 0%, transparent 50%)',
              }}
            />
          </motion.div>

          {/* Badge flotante */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 6 }}
            animate={{ opacity: 1, y: 0,  rotate: 6 }}
            transition={{ duration: 0.8, delay: 0.7, type: 'spring' }}
            className="absolute -bottom-6 -left-6 max-w-[200px] rounded-2xl p-4"
            style={{
              background: 'var(--surface)',
              border:     '1px solid var(--border)',
              boxShadow:  'var(--shadow-card)',
            }}
          >
            <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Nuevo esta semana
            </div>
            <div
              className="mt-1 text-sm font-medium leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              Mochila Wayuu artesanal · La Guajira
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-10 w-6 items-start justify-center rounded-full border pt-2"
          style={{ borderColor: 'var(--border-hover)' }}
        >
          <div
            className="h-2 w-1 rounded-full"
            style={{ background: 'var(--text-muted)' }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
