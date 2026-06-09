'use client';

/**
 * useParallax — hook genérico para aplicar parallax a cualquier elemento.
 *
 * Uso:
 *   const ref = useRef(null);
 *   const { y } = useParallax(ref, { speed: 0.4 });
 *   return <motion.div ref={ref} style={{ y }}>...</motion.div>;
 */

import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { RefObject } from 'react';

interface Options {
  /** Velocidad: -1 (contra-scroll) a 1 (super lento). Default 0.3 */
  speed?: number;
}

export function useParallax(
  ref: RefObject<HTMLElement>,
  { speed = 0.3 }: Options = {},
): { y: MotionValue<string> } {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`${-50 * speed}%`, `${50 * speed}%`]);

  return { y };
}
