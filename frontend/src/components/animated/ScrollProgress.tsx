'use client';

/**
 * ScrollProgress — barra delgada en el tope que indica el progreso de lectura.
 * Útil en páginas largas: producto, blog, checkout.
 * Color: terracota — paleta Shopper.
 */

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping:   30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0%',
        background:      'linear-gradient(90deg, var(--accent), var(--accent-bright))',
      }}
      className="fixed left-0 right-0 top-0 z-[60] h-[3px]"
      aria-hidden
    />
  );
}
