'use client';

/**
 * ParallaxSection — wrapper que añade efecto parallax sutil a cualquier sección.
 * El contenido se mueve a velocidad ligeramente distinta al scroll de fondo.
 *
 * Uso:
 *   <ParallaxSection speed={0.2}>
 *     <h2>Productos destacados</h2>
 *     <div>...</div>
 *   </ParallaxSection>
 */

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Velocidad parallax. 0 = sin efecto, 0.5 = fuerte. Default 0.15 */
  speed?:   number;
  className?: string;
}

export default function ParallaxSection({ children, speed = 0.15, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ['0%', '0%'] : [`${30 * speed}%`, `${-30 * speed}%`],
  );

  return (
    <section ref={ref} className={`relative ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </section>
  );
}
