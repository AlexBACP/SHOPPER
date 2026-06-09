'use client';

/**
 * Testimonios — sección de reseñas con auto-rotación.
 * Patrón inspirado en "Animated Testimonials" de 21st.dev, reescrito
 * self-contained en la paleta Mercado Editorial (sin Radix ni imágenes
 * externas: avatar con inicial). Respeta prefers-reduced-motion.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

interface Testimonio {
  name: string; city: string; rating: number; content: string; color: string;
}

const TESTIMONIOS: Testimonio[] = [
  { name: 'Valentina Ríos',   city: 'Medellín',     rating: 5, content: 'Encontré artesanías hermosas de tiendas que ni sabía que existían. Llegó todo en 3 días y tal cual la foto. Mi compra favorita del año.', color: '#c75a2b' },
  { name: 'Andrés Gómez',     city: 'Bogotá',       rating: 5, content: 'Pagué con Nequi sin problema y me llegó la factura al correo al instante. Se siente seguro y muy fácil de usar.', color: '#2f5d4f' },
  { name: 'Daniela Castaño',  city: 'Cali',         rating: 5, content: 'Me encanta que pueda hablarle directo al vendedor por WhatsApp. Resolvieron mis dudas y me ayudaron a elegir la talla.', color: '#a8431d' },
  { name: 'Sebastián Pérez',  city: 'Barranquilla', rating: 4, content: 'Buenos precios y envío gratis pasando cierto valor. La app se ve muy profesional comparada con otras de por acá.', color: '#221d16' },
  { name: 'Laura Martínez',   city: 'Bucaramanga',  rating: 5, content: 'Apoyar marcas colombianas independientes y que la experiencia sea tan buena no tiene precio. Ya voy por mi tercer pedido.', color: '#2f5d4f' },
];

export default function Testimonios() {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const total = TESTIMONIOS.length;

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setI(c => (c + 1) % total), 5500);
    return () => clearInterval(t);
  }, [reduced, total]);

  const t = TESTIMONIOS[i];

  return (
    <section className="sec wrap" id="testimonios">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Izquierda: encabezado + navegación */}
        <div>
          <span className="eyebrow">Confianza</span>
          <h2 className="sec-title" style={{ marginTop: 10 }}>
            Lo que dicen <span className="serif-it">nuestros compradores</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--ink-soft)]">
            Miles de colombianos ya compran en Shopper con la confianza de tiendas verificadas,
            pagos seguros y envíos a todo el país.
          </p>

          <div className="mt-7 flex items-center gap-2.5">
            {TESTIMONIOS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Ver reseña ${idx + 1}`}
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: i === idx ? 34 : 10,
                  background: i === idx ? 'var(--primary)' : 'var(--line)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Derecha: tarjeta animada */}
        <div className="relative min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 40, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[var(--bone-2)] p-8 shadow-[var(--shadow-md)]"
            >
              <Quote className="absolute right-6 top-6 h-10 w-10 rotate-180" style={{ color: 'var(--accent-subtle)' }} />

              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className="h-5 w-5"
                    style={{
                      color: s < t.rating ? 'var(--accent)' : 'var(--line)',
                      fill:  s < t.rating ? 'var(--accent)' : 'transparent',
                    }}
                  />
                ))}
              </div>

              <p className="relative z-10 flex-1 text-lg font-medium leading-relaxed text-[var(--ink)]">
                “{t.content}”
              </p>

              <div className="mt-6 flex items-center gap-3 border-t border-[var(--line)] pt-5">
                <span
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black text-[var(--bone-2)]"
                  style={{ background: t.color, fontFamily: 'var(--font-display)' }}
                >
                  {t.name[0]}
                </span>
                <div>
                  <p className="font-bold text-[var(--ink)]">{t.name}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{t.city}, Colombia · Compra verificada</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Adornos */}
          <div className="absolute -bottom-5 -left-5 -z-10 h-24 w-24 rounded-2xl" style={{ background: 'var(--accent-subtle)' }} />
          <div className="absolute -top-5 -right-5 -z-10 h-24 w-24 rounded-2xl" style={{ background: 'var(--selva-soft)' }} />
        </div>
      </div>
    </section>
  );
}
