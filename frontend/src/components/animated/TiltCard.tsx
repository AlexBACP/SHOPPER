'use client';

/**
 * TiltCard — efecto 3D sutil al mover el cursor (estilo Apple/Linear).
 * Perfecto para tarjetas de tienda, testimonios o productos destacados.
 */

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { MouseEvent, ReactNode, useRef } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Inclinación máxima en grados (default 8) */
  intensity?: number;
}

export default function TiltCard({ children, className = '', intensity = 8 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const sX = useSpring(x, { stiffness: 220, damping: 16 });
  const sY = useSpring(y, { stiffness: 220, damping: 16 });

  const rotateX = useTransform(sY, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-intensity, intensity]);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width  - 0.5);
    y.set((e.clientY - rect.top)  / rect.height - 0.5);
  };

  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
