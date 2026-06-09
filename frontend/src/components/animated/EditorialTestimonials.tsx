'use client';

/**
 * EditorialTestimonials — sección de testimonios estilo revista impresa.
 * Una cita protagonista con cross-fade automático + dos cards laterales
 * con testimonios secundarios. Respeta prefers-reduced-motion.
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  rating?: number;
};

const DEFAULT: Testimonial[] = [
  {
    quote: 'Encontré productos hechos a mano que no veía en ningún otro lado. Cada pedido llega con una historia, una nota del taller — eso ya no se ve.',
    name: 'Laura Mendoza',
    role: 'Compradora · Medellín',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80&auto=format&fit=crop',
    rating: 5,
  },
  {
    quote: 'Migrar mi marca a Shopper fue lo mejor del año. Triplicamos pedidos en tres meses y el equipo de pagos resuelve todo el mismo día.',
    name: 'Andrés Caballero',
    role: 'Tienda · Bogotá',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&q=80&auto=format&fit=crop',
    rating: 5,
  },
  {
    quote: 'Por fin un sitio donde puedo comprar artesanías colombianas sin pelearme con interfaces de los 2000. Se siente curado, no inventado.',
    name: 'Sofía Restrepo',
    role: 'Cliente recurrente · Cali',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=240&q=80&auto=format&fit=crop',
    rating: 5,
  },
];

export default function EditorialTestimonials({
  testimonials = DEFAULT,
  intervalMs = 6500,
}: {
  testimonials?: Testimonial[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const main = testimonials[active];
  const sides = testimonials.filter((_, i) => i !== active).slice(0, 2);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const t = setInterval(() => setActive((i) => (i + 1) % testimonials.length), intervalMs);
    return () => clearInterval(t);
  }, [testimonials.length, intervalMs]);

  return (
    <div>
      <div className="ed-test">
        {/* Testimonio principal con cross-fade */}
        <div className="ed-test-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
            >
              <p className="ed-test-quote">{main.quote}</p>
              <div className="ed-test-person">
                <div className="ed-test-avatar">
                  <img src={main.avatar} alt={main.name} loading="lazy" />
                </div>
                <div className="ed-test-meta">
                  <div className="nm">{main.name}</div>
                  <div className="rl">{main.role}</div>
                  {!!main.rating && (
                    <div className="star" aria-label={`${main.rating} de 5 estrellas`}>
                      {Array.from({ length: main.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="ed-test-dots" role="tablist" aria-label="Cambiar testimonio">
            {testimonials.map((t, i) => (
              <button
                key={i}
                role="tab"
                aria-current={i === active}
                aria-label={`Ver testimonio de ${t.name}`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        </div>

        {/* Testimonios laterales */}
        <div className="ed-test-side">
          {sides.map((t, i) => (
            <article className="ed-test-card" key={`${active}-${i}`}>
              <p className="qt">{t.quote}</p>
              <div className="ft">
                <span className="nm">{t.name}</span>
                <span className="rl">{t.role.split('·')[0]?.trim()}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
